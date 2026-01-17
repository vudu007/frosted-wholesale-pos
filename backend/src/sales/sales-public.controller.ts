import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CustomersService } from '../customers/customers.service';

interface GuestOrderItem {
  productId: string;
  qty: number;
}

interface GuestCustomerInfo {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address: string;
}

interface CreateGuestOrderDto {
  storeId: string;
  customerInfo: GuestCustomerInfo;
  items: GuestOrderItem[];
  orderType?: 'ONLINE' | 'CURBSIDE';
}

@Controller('sales/public')
export class SalesPublicController {
  constructor(
    private readonly salesService: SalesService,
    private readonly customersService: CustomersService,
  ) {}

  @Post('guest-order')
  async createGuestOrder(@Body() dto: CreateGuestOrderDto) {
    // 1. Calculate total quantity to determine payment terms
    const totalQty = dto.items.reduce((sum, item) => sum + item.qty, 0);

    // 2. Determine payment terms based on quantity
    let paymentTerms: string;
    let paymentDueDate: Date | undefined;
    let status: 'PENDING' | 'COMPLETED';
    let requiresImmediatePayment: boolean;

    if (totalQty >= 1 && totalQty <= 3) {
      // 1-3 items: Immediate payment required
      paymentTerms = 'IMMEDIATE';
      status = 'PENDING'; // Will be COMPLETED after payment
      requiresImmediatePayment = true;
      paymentDueDate = new Date(); // Due now
    } else if (totalQty >= 4 && totalQty <= 10) {
      // 4-10 items: 1 week credit
      paymentTerms = '1_WEEK';
      status = 'PENDING';
      requiresImmediatePayment = false;
      paymentDueDate = new Date();
      paymentDueDate.setDate(paymentDueDate.getDate() + 7); // 7 days from now
    } else {
      // 11+ items: 2 weeks credit
      paymentTerms = '2_WEEKS';
      status = 'PENDING';
      requiresImmediatePayment = false;
      paymentDueDate = new Date();
      paymentDueDate.setDate(paymentDueDate.getDate() + 14); // 14 days from now
    }

    // 3. Create or find customer
    let customer;
    try {
      // Try to find existing customer by phone or email
      const existingCustomers = await this.customersService.findAll(
        dto.storeId,
      );
      customer = existingCustomers.find(
        (c: any) =>
          c.phone === dto.customerInfo.phone ||
          (dto.customerInfo.email && c.email === dto.customerInfo.email),
      );

      if (!customer) {
        // Create new customer
        customer = await this.customersService.create({
          ...dto.customerInfo,
          storeId: dto.storeId,
        });
      }
    } catch (error) {
      // If customer creation fails, proceed without customer ID
      console.error('Customer creation failed:', error);
    }

    // 4. Create the sale with payment terms
    const sale = await this.salesService.processTransaction(
      dto.storeId,
      dto.items,
      [], // No payments for credit orders
      undefined, // No discount
      customer?.id,
      dto.orderType || 'ONLINE',
      status,
      undefined, // No table number
      true, // isGuestOrder
      paymentTerms,
      paymentDueDate,
    );

    // 5. Return order details with payment terms
    return {
      success: true,
      orderId: sale.id,
      orderNumber: sale.id.slice(0, 8).toUpperCase(),
      status: sale.status,
      paymentTerms,
      paymentDueDate,
      requiresImmediatePayment,
      totalAmount: Number(sale.grandTotal),
      message: requiresImmediatePayment
        ? 'Order created. Payment required to complete order.'
        : `Order created successfully. Payment due by ${paymentDueDate?.toLocaleDateString()}.`,
      customerInfo: {
        name: `${dto.customerInfo.firstName} ${dto.customerInfo.lastName}`,
        phone: dto.customerInfo.phone,
        email: dto.customerInfo.email,
      },
    };
  }

  @Get('track/:orderId')
  async trackOrder(@Param('orderId') orderId: string) {
    const sale = await this.salesService.findOne(orderId);
    
    if (!sale) {
      return {
        success: false,
        message: 'Order not found',
      };
    }

    return {
      success: true,
      order: {
        id: sale.id,
        orderNumber: sale.id.slice(0, 8).toUpperCase(),
        status: sale.status,
        createdAt: sale.createdAt,
        paymentTerms: (sale as any).paymentTerms,
        paymentDueDate: (sale as any).paymentDueDate,
        totalAmount: Number(sale.grandTotal),
        items: sale.items.map((item: any) => ({
          productName: item.product.name,
          quantity: item.qty,
          price: Number(item.price),
        })),
      },
    };
  }
}

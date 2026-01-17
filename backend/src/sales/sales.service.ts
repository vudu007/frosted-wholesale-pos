import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { DiscountType, Prisma } from '@prisma/client';
import { CustomersService } from '../customers/customers.service';
import { DashboardGateway } from '../dashboard/dashboard.gateway';

interface PaymentDto {
  type: string;
  amount: number;
}
interface DiscountDto {
  type: DiscountType;
  value: number;
}

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    private customersService: CustomersService,
    private dashboardGateway: DashboardGateway,
  ) {}

  async findAll(params: {
    storeId?: string;
    page?: number;
    limit?: number;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const {
      storeId,
      page = 1,
      limit = 50,
      search,
      startDate,
      endDate,
    } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.SaleWhereInput = {};

    if (storeId) {
      where.storeId = storeId;
    }

    if (search) {
      where.OR = [
        { id: { contains: search } },
        { customer: { firstName: { contains: search, mode: 'insensitive' } } },
        { customer: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        include: {
          items: { include: { product: true } },
          payments: true,
          customer: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.sale.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async processTransaction(
    storeId: string,
    items: { productId: string; qty: number }[],
    payments: PaymentDto[],
    discount?: DiscountDto,
    customerId?: string,
    orderType?: 'IN_STORE' | 'ONLINE' | 'CURBSIDE',
    status?: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED',
    tableNumber?: string,
    isGuestOrder?: boolean,
    paymentTerms?: string,
    paymentDueDate?: Date,
  ) {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Calculate Subtotal
      const validatedProducts = await Promise.all(
        items.map(async (item) => {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            include: { recipe: true },
          });
          if (!product)
            throw new BadRequestException(
              `Product ${item.productId} not found`,
            );
          return { ...product, requestedQty: item.qty };
        }),
      );
      const subtotal = validatedProducts.reduce(
        (sum, p) => sum + Number(p.price) * p.requestedQty,
        0,
      );

      // 2. Apply Discount
      let discountAmount = 0;
      if (discount) {
        discountAmount =
          discount.type === 'PERCENTAGE'
            ? subtotal * (discount.value / 100)
            : discount.value;
      }
      const discountedSubtotal = subtotal - discountAmount;

      // 3. Calculate Tax & Total
      const taxAmount = 0;
      const grandTotal = discountedSubtotal;

      // 4. VALIDATE PAYMENTS: Ensure total payments match the grand total (only if status is COMPLETED)
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      const isCompleted = status === 'COMPLETED';

      // Skip payment validation for guest orders with credit terms
      if (isCompleted && !isGuestOrder && Math.abs(totalPaid - grandTotal) > 0.01) {
        // Allow for tiny rounding differences
        throw new BadRequestException(
          `Payment mismatch: Grand total is ${grandTotal.toFixed(2)}, but received ${totalPaid.toFixed(2)}`,
        );
      }

      // 5. Create Sale Record
      const sale = await tx.sale.create({
        data: {
          storeId,
          subtotal,
          taxAmount,
          grandTotal,
          discountType: discount?.type,
          discountAmount: discountAmount > 0 ? discountAmount : null,
          customerId: customerId || null,
          orderType: orderType || 'IN_STORE',
          status: status || (totalPaid >= grandTotal ? 'COMPLETED' : 'PENDING'),
          tableNumber: tableNumber || null,
          isGuestOrder: isGuestOrder || false,
          paymentTerms: paymentTerms || null,
          paymentDueDate: paymentDueDate || null,
        },
      });

      // 6. Create Payment Records
      if (payments.length > 0) {
        await tx.payment.createMany({
          data: payments.map((p) => ({
            saleId: sale.id,
            paymentType: p.type,
            amount: p.amount,
          })),
        });
      }

      // 7. Create Sale Items
      await tx.saleItem.createMany({
        data: validatedProducts.map((p) => ({
          saleId: sale.id,
          productId: p.id,
          qty: p.requestedQty,
          price: p.price,
        })),
      });

      // 8. Broadcast the new order/sale
      const fullSale = await tx.sale.findUnique({
        where: { id: sale.id },
        include: { items: { include: { product: true } }, customer: true },
      });
      await this.dashboardGateway.broadcastOrderUpdate(storeId, fullSale);

      // 9. Deduct Inventory (Only if not CANCELLED)
      if (status !== 'CANCELLED') {
        for (const product of validatedProducts) {
          if (product.isComposite) {
            // Deduct raw materials based on recipe
            if (product.recipe && product.recipe.length > 0) {
              for (const item of product.recipe) {
                const qtyRequired =
                  Number(item.qtyRequired) * product.requestedQty;

                const materialInventory =
                  await tx.rawMaterialInventory.findUnique({
                    where: {
                      storeId_materialId: {
                        storeId,
                        materialId: item.materialId,
                      },
                    },
                  });

                if (
                  !materialInventory ||
                  Number(materialInventory.stock) < qtyRequired
                ) {
                  throw new BadRequestException(
                    `Insufficient raw material: ${item.materialId}`,
                  );
                }

                await tx.rawMaterialInventory.update({
                  where: { id: materialInventory.id },
                  data: { stock: { decrement: qtyRequired } },
                });
              }
            }
          } else {
            // Deduct product stock directly
            const productInventory = await tx.productInventory.findUnique({
              where: {
                storeId_productId: {
                  storeId,
                  productId: product.id,
                },
              },
            });

            if (
              !productInventory ||
              productInventory.stock < product.requestedQty
            ) {
              throw new BadRequestException(
                `Insufficient stock for product: ${product.name}`,
              );
            }

            await tx.productInventory.update({
              where: { id: productInventory.id },
              data: { stock: { decrement: product.requestedQty } },
            });
          }
        }
      }

      return sale;
    });
  }

  async findOne(saleId: string) {
    return await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        items: { include: { product: true } },
        payments: true,
        customer: true,
      },
    });
  }

  async updateStatus(
    saleId: string,
    status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED',
  ) {
    const updated = await this.prisma.sale.update({
      where: { id: saleId },
      data: { status },
      include: {
        items: { include: { product: true } },
        payments: true,
        customer: true,
      },
    });

    // Broadcast the update
    await this.dashboardGateway.broadcastOrderUpdate(updated.storeId, updated);

    return updated;
  }

  async refundSale(saleId: string, reason: string, refundedBy: string) {
    // Fetch the sale with all details
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        items: {
          include: { product: true },
        },
        payments: true,
        customer: true,
      },
    });

    if (!sale) {
      throw new BadRequestException('Sale not found');
    }

    // Check if already refunded (you might want to add a refunded field to schema)
    // For now, we'll just process it

    return await this.prisma.$transaction(async (tx) => {
      // 1. Restore inventory for each item
      for (const item of sale.items) {
        const inventoryRecord = await tx.productInventory.findUnique({
          where: {
            storeId_productId: {
              storeId: sale.storeId,
              productId: item.productId,
            },
          },
        });

        if (inventoryRecord) {
          await tx.productInventory.update({
            where: {
              storeId_productId: {
                storeId: sale.storeId,
                productId: item.productId,
              },
            },
            data: {
              stock: { increment: item.qty },
            },
          });
        } else {
          // If inventory record doesn't exist, create one
          await tx.productInventory.create({
            data: {
              storeId: sale.storeId,
              productId: item.productId,
              stock: item.qty,
            },
          });
        }
      }

      // 2. Reverse customer loyalty points and spending if customer exists
      if (sale.customerId) {
        const pointsToDeduct = Math.floor(Number(sale.grandTotal) / 100);

        await this.customersService.updateLoyaltyPoints(
          sale.customerId,
          -pointsToDeduct, // Negative to deduct
        );

        await this.customersService.updateTotalSpent(
          sale.customerId,
          -Number(sale.grandTotal), // Negative to deduct
        );
      }

      // 3. Create a refund record (you might want a Refund model in schema)
      // For now, we'll mark it in an audit log or similar
      // Note: In production, you'd create a proper Refund table

      return {
        success: true,
        message: 'Sale refunded successfully',
        refundedAmount: Number(sale.grandTotal),
        saleId: sale.id,
        reason,
        refundedBy,
        refundedAt: new Date(),
      };
    });
  }
}

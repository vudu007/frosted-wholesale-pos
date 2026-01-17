import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
  Param,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { DiscountType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

// Define the structure of the data (the "payload") we expect to receive from the frontend
interface PaymentDto {
  type: string;
  amount: number;
}

interface DiscountDto {
  type: DiscountType;
  value: number;
}

interface CreateSalePayload {
  storeId: string;
  customerId?: string;
  items: { productId: string; qty: number }[];
  payments: PaymentDto[];
  discount?: DiscountDto;
  orderType?: 'IN_STORE' | 'ONLINE' | 'CURBSIDE';
  status?: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';
  tableNumber?: string;
}

@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  @Roles('ADMIN', 'CASHIER')
  findAll(
    @Query('storeId') storeId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.salesService.findAll({
      storeId,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
      search,
      startDate,
      endDate,
    });
  }

  @Post()
  create(@Body() payload: CreateSalePayload) {
    return this.salesService.processTransaction(
      payload.storeId,
      payload.items,
      payload.payments,
      payload.discount,
      payload.customerId,
      payload.orderType,
      payload.status,
      payload.tableNumber,
    );
  }

  @Post(':id/status')
  @Roles('ADMIN', 'CASHIER')
  updateStatus(
    @Param('id') saleId: string,
    @Body()
    body: {
      status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';
    },
  ) {
    return this.salesService.updateStatus(saleId, body.status);
  }

  @Post(':id/refund')
  @Roles('ADMIN')
  refundSale(
    @Param('id') saleId: string,
    @Body() body: { reason: string; refundedBy: string },
  ) {
    return this.salesService.refundSale(saleId, body.reason, body.refundedBy);
  }
}

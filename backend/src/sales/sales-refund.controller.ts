import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { SalesService } from './sales.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('sales')
export class SalesRefundController {
  constructor(private readonly salesService: SalesService) {}

  @Post(':id/refund')
  @UseGuards(JwtAuthGuard)
  async refundSale(
    @Param('id') saleId: string,
    @Body() body: { reason: string; refundedBy: string },
  ) {
    return this.salesService.refundSale(saleId, body.reason, body.refundedBy);
  }
}

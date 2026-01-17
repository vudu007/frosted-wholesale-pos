import { Controller, Post, Body } from '@nestjs/common';
import { InventoryAdjustmentsService } from './inventory-adjustments.service';

@Controller('inventory-adjustments')
export class InventoryAdjustmentsController {
  constructor(
    private readonly inventoryAdjustmentsService: InventoryAdjustmentsService,
  ) {}

  @Post()
  create(
    @Body()
    dto: {
      materialId: string;
      storeId: string;
      quantity: number;
      reason: string;
      userId: string;
    },
  ) {
    return this.inventoryAdjustmentsService.create(dto);
  }
}

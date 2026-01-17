import { Module } from '@nestjs/common';
import { InventoryAdjustmentsService } from './inventory-adjustments.service';
import { InventoryAdjustmentsController } from './inventory-adjustments.controller';
import { PrismaService } from '../prisma.service'; // <--- Import PrismaService

@Module({
  controllers: [InventoryAdjustmentsController],
  providers: [
    InventoryAdjustmentsService,
    PrismaService, // <--- Add it here
  ],
})
export class InventoryAdjustmentsModule {}

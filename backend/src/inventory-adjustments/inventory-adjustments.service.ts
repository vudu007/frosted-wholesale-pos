import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class InventoryAdjustmentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: {
    materialId: string;
    storeId: string;
    quantity: number;
    reason: string;
    userId: string;
  }) {
    // We use a transaction to ensure that logging the adjustment and updating the stock
    // happen together, or not at all. This maintains data integrity.
    return this.prisma.$transaction(async (tx) => {
      // 1. Log the adjustment event for auditing and reporting purposes
      const adjustment = await tx.inventoryAdjustment.create({
        data: {
          materialId: dto.materialId,
          storeId: dto.storeId,
          quantity: dto.quantity, // This is expected to be a negative number for loss
          reason: dto.reason,
          recordedById: dto.userId,
        },
      });

      // 2. Atomically update the actual inventory stock level for that raw material
      await tx.rawMaterialInventory.updateMany({
        where: {
          storeId: dto.storeId,
          materialId: dto.materialId,
        },
        data: {
          stock: {
            // 'increment' is used because we are adding a negative number,
            // which correctly subtracts from the total.
            increment: dto.quantity,
          },
        },
      });

      return adjustment;
    });
  }
}

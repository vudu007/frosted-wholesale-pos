import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class MaterialAllocationsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: {
    materialId: string;
    storeId: string;
    quantity: number;
    reason?: string;
  }) {
    // 1. Check if raw material inventory exists for this store
    const inventory = await this.prisma.rawMaterialInventory.findUnique({
      where: {
        storeId_materialId: {
          storeId: dto.storeId,
          materialId: dto.materialId,
        },
      },
    });

    if (!inventory) {
      throw new NotFoundException(
        'Raw material not found in this store inventory',
      );
    }

    if (Number(inventory.stock) < dto.quantity) {
      throw new BadRequestException(
        'Insufficient raw material stock for allocation',
      );
    }

    // 2. Start a transaction to record allocation and update stock
    return await this.prisma.$transaction(async (tx) => {
      // Create the allocation record
      const allocation = await tx.materialAllocation.create({
        data: {
          materialId: dto.materialId,
          storeId: dto.storeId,
          quantity: dto.quantity,
          reason: dto.reason,
        },
        include: {
          material: true,
        },
      });

      // Update the raw material stock
      await tx.rawMaterialInventory.update({
        where: {
          storeId_materialId: {
            storeId: dto.storeId,
            materialId: dto.materialId,
          },
        },
        data: {
          stock: {
            decrement: dto.quantity,
          },
        },
      });

      return allocation;
    });
  }

  async findAll(storeId?: string) {
    return await this.prisma.materialAllocation.findMany({
      where: storeId ? { storeId } : {},
      include: {
        material: true,
        store: true,
      },
      orderBy: {
        allocatedAt: 'desc',
      },
    });
  }

  async getMaterialStats(storeId: string) {
    // Aggregated report data can be added here if needed
    const allocations = await this.prisma.materialAllocation.findMany({
      where: { storeId },
      include: { material: true },
    });
    return allocations;
  }
}

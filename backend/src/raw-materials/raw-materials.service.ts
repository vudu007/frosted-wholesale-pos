import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class RawMaterialsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.rawMaterial.findMany({
      include: { inventory: true }, // Include stock levels
    });
  }

  async create(dto: {
    name: string;
    unit: string;
    image?: string;
    initialStock: number;
    storeId: string;
  }) {
    // 1. Create the Raw Material itself
    const material = await this.prisma.rawMaterial.create({
      data: {
        name: dto.name,
        unit: dto.unit,
        image: dto.image || undefined,
      },
    });

    // 2. Create its inventory record for the store
    await this.prisma.rawMaterialInventory.create({
      data: {
        materialId: material.id,
        storeId: dto.storeId,
        stock: dto.initialStock,
      },
    });

    return material;
  }

  async remove(id: string) {
    // Must delete inventory records first due to database relations
    await this.prisma.rawMaterialInventory.deleteMany({
      where: { materialId: id },
    });
    // Then delete the material
    return this.prisma.rawMaterial.delete({
      where: { id },
    });
  }

  async update(
    id: string,
    dto: {
      name?: string;
      unit?: string;
      image?: string;
    },
  ) {
    return this.prisma.rawMaterial.update({
      where: { id },
      data: dto,
    });
  }
}

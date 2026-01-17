import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return await this.prisma.product.findMany({
      include: { inventory: true },
    });
  }

  async create(dto: {
    name: string;
    price: number;
    costPrice?: number;
    sku: string;
    barcode?: string;
    size?: string;
    group?: string;
    image?: string;
    storeId: string;
  }) {
    // 1. Create Product
    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        group: dto.group || undefined,
        image: dto.image || undefined,
        price: dto.price,
        costPrice: dto.costPrice || 0,
        sku: dto.sku,
        barcode: dto.barcode || undefined,
        size: dto.size || undefined,
        // isTaxable removed
        isComposite: false, // Simple product for now
      },
    });

    // 2. Add Inventory
    await this.prisma.productInventory.create({
      data: {
        productId: product.id,
        storeId: dto.storeId,
        stock: 0, // Default stock 0 (user should add later or via bulk)
      },
    });

    return product;
  }

  async delete(id: string) {
    // Delete inventory first (ForeignKey constraint)
    await this.prisma.productInventory.deleteMany({ where: { productId: id } });
    return await this.prisma.product.delete({ where: { id } });
  }

  async update(
    id: string,
    dto: {
      name?: string;
      price?: number;
      costPrice?: number;
      sku?: string;
      barcode?: string;
      size?: string;
      group?: string;
      image?: string;
    },
  ) {
    return await this.prisma.product.update({
      where: { id },
      data: {
        ...dto,
      },
    });
  }

  async bulkCreate(
    products: {
      name: string;
      price: number;
      costPrice?: number;
      sku: string;
      barcode?: string;
      size?: string;
      group?: string;
      storeId: string;
      initialStock?: number;
      image?: string;
    }[],
  ) {
    // Using a transaction to ensure either all succeed or none (or we could do individually and report errors)
    // For simplicity in imports, we'll try to insert all valid ones.
    const results: any[] = [];
    for (const p of products) {
      // Check for duplicate SKU to avoid crash
      const existing = await this.prisma.product.findUnique({
        where: { sku: p.sku },
      });
      if (existing) continue; // Skip duplicates

      const product = await this.prisma.product.create({
        data: {
          name: p.name,
          group: p.group || undefined,
          image: p.image || undefined,
          price: p.price,
          costPrice: p.costPrice || 0,
          sku: p.sku,
          barcode: p.barcode || undefined,
          size: p.size || undefined,
          // isTaxable removed
          isComposite: false,
        },
      });

      await this.prisma.productInventory.create({
        data: {
          productId: product.id,
          storeId: p.storeId,
          stock: p.initialStock || 0,
        },
      });
      results.push(product);
    }
    return results;
  }
}

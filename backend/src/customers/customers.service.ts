import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Prisma } from '@prisma/client';
// Local enum to avoid build-time dependency on generated Prisma client
export enum CustomerTier {
  STANDARD = 'STANDARD',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(createCustomerDto: CreateCustomerDto) {
    // Check for duplicate email
    if (createCustomerDto.email) {
      const existingEmail = await this.prisma.customer.findUnique({
        where: { email: createCustomerDto.email },
      });
      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    // Check for duplicate phone
    if (createCustomerDto.phone) {
      const existingPhone = await this.prisma.customer.findUnique({
        where: { phone: createCustomerDto.phone },
      });
      if (existingPhone) {
        throw new ConflictException('Phone number already exists');
      }
    }

    return this.prisma.customer.create({
      data: {
        ...createCustomerDto,
        tier: createCustomerDto.tier || CustomerTier.STANDARD,
        loyaltyPoints: createCustomerDto.loyaltyPoints || 0,
        totalSpent: 0,
      },
    });
  }

  async findAll(storeId?: string) {
    const where = storeId ? { storeId } : {};
    return this.prisma.customer.findMany({
      where,
      include: {
        store: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        store: true,
        sales: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    // Check if customer exists
    await this.findOne(id);

    // Check for duplicate email if updating email
    if (updateCustomerDto.email) {
      const existingEmail = await this.prisma.customer.findFirst({
        where: {
          email: updateCustomerDto.email,
          id: { not: id },
        },
      });
      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    // Check for duplicate phone if updating phone
    if (updateCustomerDto.phone) {
      const existingPhone = await this.prisma.customer.findFirst({
        where: {
          phone: updateCustomerDto.phone,
          id: { not: id },
        },
      });
      if (existingPhone) {
        throw new ConflictException('Phone number already exists');
      }
    }

    return this.prisma.customer.update({
      where: { id },
      data: updateCustomerDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.customer.delete({
      where: { id },
    });
  }

  async search(query: string, storeId?: string) {
    const where: Prisma.CustomerWhereInput = {
      ...(storeId && { storeId }),
      OR: [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } },
      ],
    };

    return this.prisma.customer.findMany({
      where,
      take: 10,
    });
  }

  async updateLoyaltyPoints(id: string, points: number) {
    const customer = await this.findOne(id);
    return this.prisma.customer.update({
      where: { id },
      data: { loyaltyPoints: customer.loyaltyPoints + points },
    });
  }

  async updateTotalSpent(id: string, amount: number) {
    const customer = await this.findOne(id);
    const newTotal = Number(customer.totalSpent) + amount;

    return this.prisma.customer.update({
      where: { id },
      data: {
        totalSpent: newTotal,
        // Auto-promote tiers based on spending
        tier: this.calculateTier(newTotal),
      },
    });
  }

  private calculateTier(totalSpent: number): CustomerTier {
    if (totalSpent >= 10000) return CustomerTier.PLATINUM;
    if (totalSpent >= 5000) return CustomerTier.GOLD;
    if (totalSpent >= 1000) return CustomerTier.SILVER;
    return CustomerTier.STANDARD;
  }
}

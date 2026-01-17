import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtAuthGuard } from './jwt-auth.guard';

interface RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  password: string;
  storeId: string;
}

interface LoginDto {
  email: string;
  password: string;
}

@Controller('customer-auth')
export class CustomerAuthController {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    // Check if customer already exists
    const existing = await this.prisma.customer.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new Error('Customer with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create customer
    const customer = await this.prisma.customer.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        password: hashedPassword,
        storeId: dto.storeId,
      },
    });

    // Generate JWT token
    const payload = {
      sub: customer.id,
      email: customer.email,
      type: 'customer',
    };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      customer: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        loyaltyPoints: customer.loyaltyPoints,
        tier: customer.tier,
      },
    };
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    // Find customer
    const customer = await this.prisma.customer.findUnique({
      where: { email: dto.email },
    });

    if (!customer || !customer.password) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await bcrypt.compare(dto.password, customer.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Generate JWT token
    const payload = {
      sub: customer.id,
      email: customer.email,
      type: 'customer',
    };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      customer: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        loyaltyPoints: customer.loyaltyPoints,
        tier: customer.tier,
      },
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: req.user.sub },
      include: {
        sales: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    return customer;
  }

  @Get('orders')
  @UseGuards(JwtAuthGuard)
  async getOrders(@Request() req) {
    const orders = await this.prisma.sale.findMany({
      where: { customerId: req.user.sub },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        payments: true,
      },
    });

    return orders;
  }
}

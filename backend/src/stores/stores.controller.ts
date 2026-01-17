import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Controller('stores')
export class StoresController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('default')
  async getDefaultStore() {
    // Get the first store from the database
    const store = await this.prisma.store.findFirst();
    
    if (!store) {
      return {
        success: false,
        message: 'No store found. Please run database seed.',
      };
    }

    return {
      success: true,
      store: {
        id: store.id,
        name: store.name,
        location: store.location,
      },
    };
  }

  @Get()
  async getAllStores() {
    const stores = await this.prisma.store.findMany();
    return stores;
  }
}

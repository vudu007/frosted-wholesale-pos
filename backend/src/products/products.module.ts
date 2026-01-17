import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { PrismaService } from '../prisma.service'; // <--- Import

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, PrismaService], // <--- Add here
})
export class ProductsModule {}

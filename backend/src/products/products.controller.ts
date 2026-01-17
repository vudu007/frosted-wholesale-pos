// backend/src/products/products.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('bulk-import')
  @UseGuards(JwtAuthGuard)
  bulkImport(@Body() products: any[]) {
    // In a real app we'd validate 'products' array with a DTO
    return this.productsService.bulkCreate(products);
  }

  @Get()
  findAll() {
    // Remove auth guard to allow public access for guest shopping
    return this.productsService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(@Param('id') id: string) {
    return this.productsService.delete(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: any) {
    return this.productsService.update(id, dto);
  }
}

import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { MaterialAllocationsService } from './material-allocations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('material-allocations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaterialAllocationsController {
  constructor(private readonly service: MaterialAllocationsService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER')
  create(
    @Body()
    dto: {
      materialId: string;
      storeId: string;
      quantity: number;
      reason?: string;
    },
  ) {
    return this.service.create(dto);
  }

  @Get()
  @Roles('ADMIN', 'MANAGER')
  findAll(@Query('storeId') storeId?: string) {
    return this.service.findAll(storeId);
  }

  @Get('report')
  @Roles('ADMIN', 'MANAGER')
  getReport(@Query('storeId') storeId: string) {
    return this.service.getMaterialStats(storeId);
  }
}

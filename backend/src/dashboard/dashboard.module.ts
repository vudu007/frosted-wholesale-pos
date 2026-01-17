import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardGateway } from './dashboard.gateway';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [DashboardService, DashboardGateway, PrismaService],
  exports: [DashboardService, DashboardGateway],
})
export class DashboardModule {}

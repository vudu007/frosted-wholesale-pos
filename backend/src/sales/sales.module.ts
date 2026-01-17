import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { SalesPublicController } from './sales-public.controller';
import { PrismaService } from '../prisma.service'; // Import this
import { CustomersModule } from '../customers/customers.module';
import { DashboardModule } from '../dashboard/dashboard.module';

@Module({
  imports: [CustomersModule, DashboardModule],
  controllers: [SalesController, SalesPublicController],
  providers: [SalesService, PrismaService], // Add it here
})
export class SalesModule {}

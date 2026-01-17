import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { PrismaService } from '../prisma.service'; // <--- Import

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, PrismaService], // <--- Add here
})
export class ReportsModule {}

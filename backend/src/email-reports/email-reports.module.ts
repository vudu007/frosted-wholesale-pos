import { Module } from '@nestjs/common';
import { EmailReportsService } from './email-reports.service';
import { PrismaService } from '../prisma.service';
import { MailService } from '../mail/mail.service';
import { DashboardModule } from '../dashboard/dashboard.module';

@Module({
  imports: [DashboardModule],
  providers: [EmailReportsService, PrismaService, MailService],
  exports: [EmailReportsService],
})
export class EmailReportsModule {}

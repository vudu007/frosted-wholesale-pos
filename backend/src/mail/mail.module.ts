import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailService } from './mail.service';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [ConfigModule],
  providers: [MailService, PrismaService],
  exports: [MailService],
})
export class MailModule {}

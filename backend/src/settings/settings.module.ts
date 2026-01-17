import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { PrismaService } from '../prisma.service'; // <-- Import PrismaService

@Module({
  controllers: [SettingsController],
  providers: [
    SettingsService,
    PrismaService, // <-- Add this line
  ],
  exports: [SettingsService], // <-- Also export SettingsService so other modules can use it
})
export class SettingsModule {}

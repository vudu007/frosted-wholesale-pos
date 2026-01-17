import { Module } from '@nestjs/common';
import { StoresController } from './stores.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [StoresController],
  providers: [PrismaService],
})
export class StoresModule {}

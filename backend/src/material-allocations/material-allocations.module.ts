import { Module } from '@nestjs/common';
import { MaterialAllocationsService } from './material-allocations.service';
import { MaterialAllocationsController } from './material-allocations.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [MaterialAllocationsController],
  providers: [MaterialAllocationsService, PrismaService],
  exports: [MaterialAllocationsService],
})
export class MaterialAllocationsModule {}

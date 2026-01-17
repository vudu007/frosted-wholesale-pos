import { Module } from '@nestjs/common';
import { RawMaterialsService } from './raw-materials.service';
import { RawMaterialsController } from './raw-materials.controller';
import { PrismaService } from '../prisma.service'; // <---

@Module({
  controllers: [RawMaterialsController],
  providers: [RawMaterialsService, PrismaService], // <---
})
export class RawMaterialsModule {}

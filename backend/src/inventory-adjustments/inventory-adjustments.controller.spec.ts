import { Test, TestingModule } from '@nestjs/testing';
import { InventoryAdjustmentsController } from './inventory-adjustments.controller';
import { InventoryAdjustmentsService } from './inventory-adjustments.service';

describe('InventoryAdjustmentsController', () => {
  let controller: InventoryAdjustmentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryAdjustmentsController],
      providers: [InventoryAdjustmentsService],
    }).compile();

    controller = module.get<InventoryAdjustmentsController>(
      InventoryAdjustmentsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

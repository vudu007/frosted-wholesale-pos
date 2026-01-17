import { Test, TestingModule } from '@nestjs/testing';
import { InventoryAdjustmentsService } from './inventory-adjustments.service';

describe('InventoryAdjustmentsService', () => {
  let service: InventoryAdjustmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InventoryAdjustmentsService],
    }).compile();

    service = module.get<InventoryAdjustmentsService>(
      InventoryAdjustmentsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

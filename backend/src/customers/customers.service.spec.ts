import { CustomersService } from './customers.service';
import { PrismaService } from '../prisma.service';

describe('CustomersService', () => {
  let service: CustomersService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(() => {
    prisma = {
      // @ts-expect-error partial mock
      customer: {
        findUnique: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    } as any;

    service = new CustomersService(prisma);
  });

  it('updates loyalty points by adding earned points', async () => {
    prisma.customer.findUnique.mockResolvedValue({
      id: 'c1',
      loyaltyPoints: 10,
      totalSpent: 0,
    } as any);
    prisma.customer.update.mockResolvedValue({} as any);

    await service.updateLoyaltyPoints('c1', 5);

    expect(prisma.customer.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { loyaltyPoints: 15 },
    });
  });

  it('promotes tier based on updated totalSpent', async () => {
    prisma.customer.findUnique.mockResolvedValue({
      id: 'c2',
      loyaltyPoints: 0,
      totalSpent: 1200,
    } as any);
    prisma.customer.update.mockResolvedValue({} as any);

    await service.updateTotalSpent('c2', 4000); // newTotal = 5200 => GOLD

    expect(prisma.customer.update).toHaveBeenCalledWith({
      where: { id: 'c2' },
      data: {
        totalSpent: 5200,
        tier: 'GOLD',
      },
    });
  });
});

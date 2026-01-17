import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma.service';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    store: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = {
      username: 'testuser',
      password: 'password123',
      role: Role.CASHIER,
      storeId: 'store-123',
    };

    it('should successfully create a user with hashed password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null); // No duplicate
      mockPrisma.store.findUnique.mockResolvedValue({ id: 'store-123' }); // Store exists

      mockPrisma.user.create.mockResolvedValue({
        id: 'user-123',
        ...dto,
        password: 'hashed_password',
      });

      const result = await service.create(dto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: dto.username },
      });
      expect(prisma.store.findUnique).toHaveBeenCalledWith({
        where: { id: dto.storeId },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 'salt');
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          username: dto.username,
          password: 'hashed_password',
        }),
      });
      expect(result.password).toBe('hashed_password');
    });

    it('should throw ConflictException if username exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if store does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.store.findUnique.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });
});

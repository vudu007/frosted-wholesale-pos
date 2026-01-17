import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // Get all users (for the Admin table)
  async findAll() {
    return await this.prisma.user.findMany({
      include: {
        store: true,
      },
    });
  }

  // Create a new Staff Member
  async create(
    dto: { username: string; password: string; role: Role; storeId: string },
    user: User,
  ) {
    // Role-based creation logic
    if (
      user.role === Role.MANAGER &&
      (dto.role === Role.ADMIN || dto.role === Role.MANAGER)
    ) {
      throw new ForbiddenException('Managers can only create Cashiers.');
    }

    if (user.role === Role.CASHIER) {
      throw new ForbiddenException('Cashiers cannot create users.');
    }

    try {
      // 1. Check if username already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });

      if (existingUser) {
        throw new ConflictException('Username already exists');
      }

      // 2. Validate Store Existence
      const store = await this.prisma.store.findUnique({
        where: { id: dto.storeId },
      });

      if (!store) {
        throw new NotFoundException(`Store with ID ${dto.storeId} not found`);
      }

      // 3. Hash Password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(dto.password, salt);

      // 4. Create User
      return await this.prisma.user.create({
        data: {
          username: dto.username,
          password: hashedPassword,
          role: dto.role,
          storeId: dto.storeId,
        },
      });
    } catch (error) {
      // Re-throw known HTTP exceptions
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      // Handle Prisma Foreign Key Constraint Failure (P2003) just in case
      if (error.code === 'P2003') {
        throw new BadRequestException(
          'Invalid reference: Store ID does not exist',
        );
      }

      console.error('Error creating user:', error);
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  // Fire a Staff Member (Delete their account)
  async remove(id: string) {
    // Before deleting a user, you might need to handle related records
    // (e.g., reassign their shifts or sales records to a generic 'deleted_user' account).
    // For this system, we will just delete them.
    return await this.prisma.user.delete({
      where: { id },
    });
  }
}

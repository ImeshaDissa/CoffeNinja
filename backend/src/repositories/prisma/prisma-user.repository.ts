import { PrismaClient } from '@prisma/client';
import { UserRecord } from '../../domain/entities/user.entity.js';
import { IUserRepository } from '../interfaces/user-repository.interface.js';

/**
 * Explicit Prisma field selection for User authentication lookups.
 */
const USER_RECORD_SELECT = {
  id: true,
  email: true,
  name: true,
  passwordHash: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * PostgreSQL implementation of IUserRepository backed by Prisma.
 */
export class PrismaUserRepository implements IUserRepository {
  private readonly prisma: PrismaClient;

  /**
   * Initializes PrismaUserRepository with an injected PrismaClient.
   *
   * @param prisma - Prisma database client.
   */
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Finds a user record by normalized email address.
   *
   * @param email - Normalized lowercase email address.
   * @returns Matching UserRecord or null if not found.
   */
  public async findByEmail(email: string): Promise<UserRecord | null> {
    const record = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: USER_RECORD_SELECT,
    });
    return record;
  }

  /**
   * Finds a user record by unique user UUID.
   *
   * @param id - User UUID.
   * @returns Matching UserRecord or null if not found.
   */
  public async findById(id: string): Promise<UserRecord | null> {
    const record = await this.prisma.user.findUnique({
      where: { id },
      select: USER_RECORD_SELECT,
    });
    return record;
  }
}


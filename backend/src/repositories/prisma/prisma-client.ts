import { PrismaClient } from '@prisma/client';

/**
 * Singleton PrismaClient management to prevent connection pool exhaustion in development.
 */
const globalForPrisma = globalThis as unknown as {
  prismaClientInstance?: PrismaClient;
};

/**
 * Creates or returns the shared PrismaClient instance.
 *
 * @returns Configured PrismaClient instance.
 */
export function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prismaClientInstance) {
    globalForPrisma.prismaClientInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }
  return globalForPrisma.prismaClientInstance;
}


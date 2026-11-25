import './env.ts';
import { PrismaClient } from '@prisma/client';

declare global {
  var _homeMurtPrisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global._homeMurtPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global._homeMurtPrisma = prisma;
}

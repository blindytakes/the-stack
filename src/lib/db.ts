import { PrismaClient } from '@prisma/client';
import { isDatabaseUrlConfigured } from '@/lib/config/server';
import { isDevelopmentEnv, isProductionEnv } from '@/lib/config/runtime';

declare global {
  var prisma: PrismaClient | undefined;
}

export const db =
  globalThis.prisma ??
  new PrismaClient({
    log: isDevelopmentEnv() ? ['warn', 'error'] : ['error']
  });

if (!isProductionEnv()) {
  globalThis.prisma = db;
}

export function isDatabaseConfigured() {
  return isDatabaseUrlConfigured();
}

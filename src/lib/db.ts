import { PrismaClient } from '@prisma/client';

// Create a global PrismaClient instance
declare global {
  var prisma: PrismaClient | undefined;
}

// Create a singleton PrismaClient instance to prevent exhausting connection pools in development
export const db = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = db;
}

// Export types for convenience
export * from '@prisma/client'; 
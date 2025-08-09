import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

import { env } from "~/env.mjs";

// Keep a global prisma instance in dev to avoid hot-reload leaks
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prefer Accelerate when available to improve cold-starts and handle serverless pooling
const baseClient = new PrismaClient({
  log: env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

// Always attach the Accelerate extension; it is a no-op without a prisma+ URL
// Cast to PrismaClient to keep method signatures simple across the codebase
export const prisma: PrismaClient = (globalForPrisma.prisma ??
  baseClient.$extends(withAccelerate())) as unknown as PrismaClient;

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

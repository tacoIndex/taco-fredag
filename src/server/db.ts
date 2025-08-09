import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

import { env } from "~/env.mjs";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prefer Accelerate when available to improve cold-starts and handle serverless pooling
const baseClient = new PrismaClient({
  log: env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

export const prisma =
  globalForPrisma.prisma ??
  // Always attach the Accelerate extension; it is a no-op without a prisma+ URL
  baseClient.$extends(withAccelerate());

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

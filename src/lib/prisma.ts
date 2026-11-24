/**
 * PostPilot — Prisma ORM Client
 *
 * Configured with:
 * - Neon Serverless PostgreSQL support (via @prisma/adapter-neon)
 * - Standard Node / Edge runtime compatibility
 * - Global singleton pattern to prevent connection exhaustion in serverless & HMR environments
 */

import { PrismaClient } from "@prisma/client";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";

// Enable fetch-based HTTP querying on serverless runtimes
if (typeof WebSocket !== "undefined") {
  neonConfig.webSocketConstructor = WebSocket;
}
neonConfig.poolQueryViaFetch = true;

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var prismaPoolGlobal: Pool | undefined;
}

function createPrismaClient(): PrismaClient {
  const rawDbUrl =
    process.env["DATABASE_URL"] ||
    (globalThis as any).__env__?.["DATABASE_URL"] ||
    "";

  // Clean connection string (strip SCRAM channel binding for Neon serverless)
  const databaseUrl = rawDbUrl
    .replace(/([?&])channel_binding=[^&]+(&|$)/, "$1")
    .replace(/[?&]$/, "");

  try {
    if (databaseUrl) {
      const adapter = new PrismaNeon({ connectionString: databaseUrl });
      return new PrismaClient({ adapter });
    }
  } catch (adapterErr) {
    console.warn("[Prisma] Neon adapter initialization fallback to standard client:", adapterErr);
  }

  return new PrismaClient();
}

export const prisma = globalThis.prismaGlobal ?? createPrismaClient();

if (process.env["NODE_ENV"] !== "production") {
  globalThis.prismaGlobal = prisma;
}

export function getPrisma(): PrismaClient {
  return prisma;
}

export * from "@prisma/client";
export default prisma;

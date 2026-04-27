import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function validConnectionString(value: string | undefined) {
  if (!value) return null;
  if (value.includes("...")) return null;
  if (!value.startsWith("postgresql://") && !value.startsWith("postgres://")) return null;
  return value;
}

const connectionString =
  validConnectionString(process.env.POSTGRES_PRISMA_URL) ||
  validConnectionString(process.env.POSTGRES_DATABASE_URL) ||
  validConnectionString(process.env.POSTGRES_URL);

if (!connectionString) {
  throw new Error("Missing valid PostgreSQL connection string");
}

const adapter = new PrismaPg({
  connectionString,
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

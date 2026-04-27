import "dotenv/config";
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

dotenv.config({ path: ".env.local" });

function getDbUrl() {
  const candidates = [
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_DATABASE_URL,
    process.env.POSTGRES_URL,
  ];

  for (const value of candidates) {
    if (
      value &&
      !value.includes("...") &&
      (value.startsWith("postgresql://") || value.startsWith("postgres://"))
    ) {
      return value;
    }
  }

  throw new Error("No valid database URL found for Prisma config");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: getDbUrl(),
  },
});

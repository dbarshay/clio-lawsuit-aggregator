import { prisma } from "./prisma";
import { isBuildTime } from "./is-server-runtime";

export function getPrisma() {
  if (isBuildTime) {
    throw new Error("Prisma disabled during build");
  }

  return prisma;
}

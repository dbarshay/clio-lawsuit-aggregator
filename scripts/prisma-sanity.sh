#!/usr/bin/env bash
set -e

echo "Checking Prisma setup..."

echo "Node:"
node -v

echo "Prisma versions:"
npm list prisma @prisma/client

echo "DATABASE_URL:"
grep DATABASE_URL .env || true

echo "Generating client..."
npx prisma generate

echo "Done. Prisma is stable."

#!/bin/sh
set -e

echo "Pushing Prisma schema to database..."
npx prisma db push --accept-data-loss

echo "Seeding database..."
npx prisma db seed || echo "Seed skipped (already seeded or error)"

echo "Starting Next.js..."
exec node server.js

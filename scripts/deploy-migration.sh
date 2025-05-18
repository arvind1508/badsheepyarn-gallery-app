#!/bin/bash

# Exit on error
set -e

echo "Starting database migration deployment"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable is not set"
  echo "Please set it to your production database URL"
  exit 1
fi

# Run Prisma migration in production mode
echo "Running database migrations..."
npx prisma migrate deploy

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

echo "Migration completed successfully!" 
#!/bin/sh
set -e

echo "Waiting for database to be ready..."

# Wait for PostgreSQL to be ready
until pg_isready -h "${DB_HOST:-postgres}" -U "${DB_USER:-admin}" -d "${DB_NAME:-campus_db}" 2>/dev/null; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "Database is ready!"

# Run migrations
echo "Running database migrations..."
npm run db:migrate || echo "Migration failed or already up to date"

# Start the application
echo "Starting application..."
exec "$@"

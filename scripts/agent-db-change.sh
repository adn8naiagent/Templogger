#!/bin/bash
# Simple Database Schema Change for Agents
# This script should be called after an agent modifies prisma/schema.prisma

set -e

echo "🤖 Agent Database Schema Change"
echo "Detected changes to prisma/schema.prisma"
echo ""

# Check if there are actual changes to the schema
if ! git diff --quiet prisma/schema.prisma 2>/dev/null; then
    echo "✅ Schema changes detected"
else
    echo "ℹ️  No schema changes detected"
    exit 0
fi

# Generate migration name from current timestamp
TIMESTAMP=$(date +%Y%m%d%H%M%S)
MIGRATION_NAME="auto_${TIMESTAMP}"

echo "🔄 Generating migration: $MIGRATION_NAME"
echo ""

# Create migration and apply to dev database
unset DATABASE_URL

# Check if there's drift - if so, use alternative approach
if npx prisma migrate status 2>&1 | grep -q "Database schema is up to date"; then
    echo "✅ No drift detected, creating migration normally"
    npx prisma migrate dev --name "$MIGRATION_NAME"
else
    echo "⚠️  Schema drift detected, using direct database approach"
    
    # Apply schema changes directly to database first
    npx prisma db push --skip-generate
    
    # Then create migration to capture the changes
    npx prisma migrate dev --name "$MIGRATION_NAME" --create-only
    
    # Mark it as applied since database already has the changes
    npx prisma migrate resolve --applied "$MIGRATION_NAME"
fi

echo ""
echo "✅ Migration created successfully!"
echo "📁 Files updated:"
echo "   - prisma/schema.prisma (your changes)"
echo "   - prisma/migrations/$MIGRATION_NAME/ (auto-generated)"
echo ""
echo "🚀 Next: Commit these changes to trigger production deployment"

# Stage the migration files
git add prisma/migrations/
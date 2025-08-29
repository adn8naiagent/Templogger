#!/bin/bash
# Schema Change Helper Script for Agents
# Usage: ./scripts/schema-change.sh "migration_name" "description"

set -e

MIGRATION_NAME="$1"
DESCRIPTION="$2"

if [ -z "$MIGRATION_NAME" ]; then
    echo "❌ Error: Migration name required"
    echo "Usage: ./scripts/schema-change.sh \"migration_name\" \"description\""
    exit 1
fi

echo "🔄 Agent Database Schema Change Workflow"
echo "Migration: $MIGRATION_NAME"
echo "Description: $DESCRIPTION"
echo ""

# Step 1: Ensure we're working with clean state
echo "📋 Step 1: Checking Prisma status..."
unset DATABASE_URL
npx prisma migrate status

# Step 2: Generate and apply migration
echo ""
echo "🚀 Step 2: Creating migration and applying to Railway dev..."
unset DATABASE_URL
npx prisma migrate dev --name "$MIGRATION_NAME"

# Step 3: Verify migration was created
echo ""
echo "✅ Step 3: Verifying migration files..."
LATEST_MIGRATION=$(ls -t prisma/migrations/ | grep -v migration_lock.toml | head -1)
echo "Created migration: $LATEST_MIGRATION"
ls -la "prisma/migrations/$LATEST_MIGRATION/"

# Step 4: Show what will be committed
echo ""
echo "📄 Step 4: Files to commit:"
git add prisma/
git status --porcelain | grep prisma/

echo ""
echo "✅ Database schema change complete!"
echo "🔄 Railway dev database updated"
echo "📁 Migration files ready for commit"
echo ""
echo "Next steps:"
echo "1. Review the generated migration in prisma/migrations/$LATEST_MIGRATION/"
echo "2. Commit changes: git commit -m \"$DESCRIPTION\""
echo "3. Push to trigger production deployment via GitHub Actions"
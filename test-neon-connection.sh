#!/bin/bash

echo "🔍 Testing Database Connection..."
echo "Connected to: $(echo $DATABASE_URL | grep -o '@[^/]*')"

if echo "$DATABASE_URL" | grep -q "neon.tech"; then
    echo "✅ Neon database detected!"
    echo "🚀 Ready to run migration..."
    echo ""
    echo "Run this command to create your tables:"
    echo "npx prisma migrate dev --name init_neon_database"
elif echo "$DATABASE_URL" | grep -q "railway"; then
    echo "⚠️  Still connected to Railway"
    echo "Please restart your development environment to pick up the Neon DATABASE_URL"
else
    echo "❓ Unknown database connection"
fi

echo ""
echo "Current DATABASE_URL (masked):"
echo "$DATABASE_URL" | sed 's/postgresql:\/\/[^@]*@/postgresql:\/\/***:***@/g'
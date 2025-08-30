#!/bin/bash
# Startup script to ensure Railway database connection

echo "🚀 Starting FridgeSafe with Railway database..."

# Kill any existing processes on port 5000
pkill -f "tsx server/index.ts" 2>/dev/null || true

# Unset all Supabase variables
unset DATABASE_URL
unset SUPABASE_URL 
unset SUPABASE_ANON_KEY
unset SUPABASE_SERVICE_ROLE_KEY
unset PGDATABASE

# Set Railway connection
export DATABASE_URL="postgresql://postgres:mOqIZEvuvCijScmaYSUIZaIdoOPqKAsU@shortline.proxy.rlwy.net:42180/railway"

echo "✅ Connected to Railway database"
echo "📍 DATABASE_URL: $DATABASE_URL"

# Start the application
exec npm run dev
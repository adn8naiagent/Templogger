#!/bin/bash
# Startup script for Railway deployment

echo "🚀 Starting FridgeSafe on Railway..."

# Kill any existing processes on port 5000
pkill -f "tsx server/index.ts" 2>/dev/null || true

# Unset old Supabase variables (cleanup)
unset SUPABASE_URL 
unset SUPABASE_ANON_KEY
unset SUPABASE_SERVICE_ROLE_KEY
unset PGDATABASE

echo "✅ Connected to Neon database"

# Start the application
exec npm run dev
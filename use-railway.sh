#!/bin/bash
# Setup script for development with Neon database

# Unset old Supabase variables (cleanup)
unset SUPABASE_URL 
unset SUPABASE_ANON_KEY
unset SUPABASE_SERVICE_ROLE_KEY
unset PGDATABASE

echo "✅ Using Neon database from environment"
echo "DATABASE_URL configured from .env"

# Test connection
npx prisma db pull --print | head -20
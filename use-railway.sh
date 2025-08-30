#!/bin/bash
# Force connection to Railway dev database by unsetting Supabase variables

unset DATABASE_URL
unset SUPABASE_URL 
unset SUPABASE_ANON_KEY
unset SUPABASE_SERVICE_ROLE_KEY
unset PGDATABASE

export DATABASE_URL="postgresql://postgres:mOqIZEvuvCijScmaYSUIZaIdoOPqKAsU@shortline.proxy.rlwy.net:42180/railway"

echo "✅ Switched to Railway database"
echo "DATABASE_URL: $DATABASE_URL"

# Test connection
npx prisma db pull --print | head -20
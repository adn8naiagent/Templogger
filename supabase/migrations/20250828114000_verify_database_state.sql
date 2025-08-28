-- Migration: Verify Database State  
-- Description: Check what tables actually exist and provide detailed report
-- Generated: 2025-08-28 11:40:00 UTC

DO $$
DECLARE
    table_record record;
    table_count integer := 0;
    schema_name text;
    project_info record;
BEGIN
    RAISE NOTICE '🔍 PRODUCTION DATABASE VERIFICATION REPORT';
    RAISE NOTICE '================================================';
    
    -- Get current database info
    SELECT current_database() as db_name, current_user as username, version() as pg_version
    INTO project_info;
    
    RAISE NOTICE '📊 Database: %', project_info.db_name;
    RAISE NOTICE '👤 User: %', project_info.username;
    RAISE NOTICE '🐘 PostgreSQL: %', split_part(project_info.pg_version, ' ', 1) || ' ' || split_part(project_info.pg_version, ' ', 2);
    RAISE NOTICE '';
    
    -- Check all schemas
    RAISE NOTICE '📁 Available Schemas:';
    FOR schema_name IN 
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
        ORDER BY schema_name
    LOOP
        RAISE NOTICE '   - %', schema_name;
    END LOOP;
    RAISE NOTICE '';
    
    -- List all tables in public schema
    RAISE NOTICE '📋 Tables in PUBLIC schema:';
    FOR table_record IN 
        SELECT 
            table_name,
            (SELECT COUNT(*) FROM information_schema.columns 
             WHERE table_name = t.table_name AND table_schema = 'public') as column_count
        FROM information_schema.tables t
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
    LOOP
        table_count := table_count + 1;
        RAISE NOTICE '   %d. % (% columns)', table_count, table_record.table_name, table_record.column_count;
    END LOOP;
    
    IF table_count = 0 THEN
        RAISE NOTICE '   ❌ NO TABLES FOUND IN PUBLIC SCHEMA!';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '✅ Total tables found: %', table_count;
    END IF;
    
    -- Check for our specific application tables
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Application Tables Check:';
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        RAISE NOTICE '   ✅ users table exists';
    ELSE
        RAISE NOTICE '   ❌ users table MISSING';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fridges' AND table_schema = 'public') THEN
        RAISE NOTICE '   ✅ fridges table exists';
    ELSE
        RAISE NOTICE '   ❌ fridges table MISSING';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'temperature_logs' AND table_schema = 'public') THEN
        RAISE NOTICE '   ✅ temperature_logs table exists';
    ELSE
        RAISE NOTICE '   ❌ temperature_logs table MISSING';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_templates' AND table_schema = 'public') THEN
        RAISE NOTICE '   ✅ audit_templates table exists';
    ELSE
        RAISE NOTICE '   ❌ audit_templates table MISSING';
    END IF;
    
    -- Show migration history
    RAISE NOTICE '';
    RAISE NOTICE '📜 Migration History:';
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schema_migrations' AND table_schema = 'supabase_migrations') THEN
        FOR table_record IN 
            SELECT version, name, statements
            FROM supabase_migrations.schema_migrations
            ORDER BY version
        LOOP
            RAISE NOTICE '   - % (%)', table_record.version, COALESCE(table_record.name, 'unnamed');
        END LOOP;
    ELSE
        RAISE NOTICE '   ❌ No migration history found';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🏁 Database verification completed at %', now();
    RAISE NOTICE '================================================';
    
END $$;
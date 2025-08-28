-- Migration: Column Rename Support
-- Description: Add support for safely renaming columns with data preservation
-- Generated: 2025-08-28 11:20:00 UTC

-- Function to safely rename a column with data preservation
CREATE OR REPLACE FUNCTION rename_column_safely(
    table_name text, 
    old_column_name text, 
    new_column_name text, 
    column_type text
) 
RETURNS void 
LANGUAGE plpgsql AS $$
BEGIN
    -- Check if old column exists and new column doesn't
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = $2 AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = $3 AND table_schema = 'public'
    ) THEN
        -- Add new column
        EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s', table_name, new_column_name, column_type);
        
        -- Copy data from old to new column
        EXECUTE format('UPDATE %I SET %I = %I WHERE %I IS NOT NULL', table_name, new_column_name, old_column_name, old_column_name);
        
        -- Drop old column
        EXECUTE format('ALTER TABLE %I DROP COLUMN %I', table_name, old_column_name);
        
        RAISE NOTICE '✅ Renamed column %s.%s -> %s', table_name, old_column_name, new_column_name;
        
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = $3 AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '⚠️  New column %s.%s already exists, skipping rename', table_name, new_column_name;
        
    ELSE
        RAISE NOTICE '⚠️  Old column %s.%s does not exist, skipping rename', table_name, old_column_name;
    END IF;
END;
$$;

-- Function to safely rename a column but keep both (for gradual migration)
CREATE OR REPLACE FUNCTION add_column_copy_data(
    table_name text, 
    old_column_name text, 
    new_column_name text, 
    column_type text
) 
RETURNS void 
LANGUAGE plpgsql AS $$
BEGIN
    -- Check if old column exists and new column doesn't
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = $2 AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = $3 AND table_schema = 'public'
    ) THEN
        -- Add new column
        EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s', table_name, new_column_name, column_type);
        
        -- Copy data from old to new column
        EXECUTE format('UPDATE %I SET %I = %I WHERE %I IS NOT NULL', table_name, new_column_name, old_column_name, old_column_name);
        
        RAISE NOTICE '✅ Added column %s.%s and copied data from %s (old column preserved)', table_name, new_column_name, old_column_name;
        
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = $3 AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '⚠️  Column %s.%s already exists, skipping', table_name, new_column_name;
        
    ELSE
        RAISE NOTICE '⚠️  Source column %s.%s does not exist, cannot copy data', table_name, old_column_name;
    END IF;
END;
$$;

-- EXAMPLE USAGE (uncomment and modify as needed):
-- 
-- Example 1: Safely rename 'firstname' to 'first_name' in users table
-- SELECT rename_column_safely('users', 'firstname', 'first_name', 'text NOT NULL');
--
-- Example 2: Add new column and copy data, keeping old column (safer for gradual migration)
-- SELECT add_column_copy_data('users', 'firstname', 'first_name', 'text');
-- 
-- Example 3: After verifying the new column works, drop the old one
-- ALTER TABLE users DROP COLUMN firstname;

DO $$
BEGIN
    RAISE NOTICE '✅ Column rename functions created successfully';
    RAISE NOTICE 'Use rename_column_safely() or add_column_copy_data() as needed';
    RAISE NOTICE 'See migration file for usage examples';
END $$;
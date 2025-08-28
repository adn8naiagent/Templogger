-- Migration: Add test column to users table (force apply)
-- Description: Ensure test column exists in production users table
-- Generated: 2025-08-28 10:05:00 UTC

-- Add test column to users table (with IF NOT EXISTS to prevent errors)
ALTER TABLE "public"."users" ADD COLUMN IF NOT EXISTS "test" text;

-- Verify column was added
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'test' 
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'SUCCESS: test column exists in users table';
    ELSE
        RAISE EXCEPTION 'FAILED: test column was not created';
    END IF;
END $$;
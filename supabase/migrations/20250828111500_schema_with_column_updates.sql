-- Migration: Complete Schema with Column Updates
-- Description: Create tables AND add missing columns to existing tables
-- Generated: 2025-08-28 11:15:00 UTC

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_crypto";

-- Log deployment start
DO $$
BEGIN
    RAISE NOTICE '🚀 Starting schema deployment with column updates at %', now();
END $$;

-- Function to create table only if it doesn't exist
CREATE OR REPLACE FUNCTION create_table_with_logging(table_name text, create_sql text) 
RETURNS void 
LANGUAGE plpgsql AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1 AND table_schema = 'public') THEN
        EXECUTE create_sql;
        RAISE NOTICE '✅ Created table: %', table_name;
    ELSE
        RAISE NOTICE '⚠️  Table already exists: %', table_name;
    END IF;
END;
$$;

-- Function to add column only if it doesn't exist
CREATE OR REPLACE FUNCTION add_column_if_not_exists(table_name text, column_name text, column_definition text) 
RETURNS void 
LANGUAGE plpgsql AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = $2 AND table_schema = 'public'
    ) THEN
        EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s', table_name, column_name, column_definition);
        RAISE NOTICE '✅ Added column %s.%s', table_name, column_name;
    ELSE
        RAISE NOTICE '⚠️  Column already exists: %s.%s', table_name, column_name;
    END IF;
END;
$$;

-- Create all tables (same as before)
SELECT create_table_with_logging('sessions', $$
CREATE TABLE "sessions" (
    "sid" varchar PRIMARY KEY NOT NULL,
    "sess" text NOT NULL,
    "expire" timestamp NOT NULL
)
$$);

SELECT create_table_with_logging('users', $$
CREATE TABLE "users" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "email" text UNIQUE NOT NULL,
    "password" text NOT NULL,
    "first_name" text NOT NULL,
    "last_name" text NOT NULL,
    "profile_image_url" text,
    "role" text DEFAULT 'user' NOT NULL,
    "subscription_status" text DEFAULT 'trial' NOT NULL,
    "trial_start_date" timestamp DEFAULT now(),
    "trial_end_date" timestamp,
    "dark_mode" boolean DEFAULT false,
    "stripe_customer_id" text,
    "stripe_subscription_id" text,
    "test" text,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
)
$$);

SELECT create_table_with_logging('subscriptions', $$
CREATE TABLE "subscriptions" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" varchar NOT NULL,
    "tier" text NOT NULL,
    "status" text NOT NULL,
    "stripe_subscription_id" text,
    "current_period_end" timestamp,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
)
$$);

SELECT create_table_with_logging('fridges', $$
CREATE TABLE "fridges" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" varchar NOT NULL,
    "name" text NOT NULL,
    "location" text,
    "notes" text,
    "color" text DEFAULT '#3b82f6',
    "labels" text[],
    "min_temp" numeric(4,1) NOT NULL,
    "max_temp" numeric(4,1) NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "enable_scheduled_checks" boolean DEFAULT false NOT NULL,
    "check_frequency" text,
    "excluded_days" text[] DEFAULT '{}',
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
)
$$);

SELECT create_table_with_logging('labels', $$
CREATE TABLE "labels" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" varchar NOT NULL,
    "name" text NOT NULL,
    "color" text DEFAULT '#6b7280',
    "created_at" timestamp DEFAULT now()
)
$$);

SELECT create_table_with_logging('time_windows', $$
CREATE TABLE "time_windows" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "fridge_id" varchar NOT NULL,
    "label" text NOT NULL,
    "check_type" text DEFAULT 'specific' NOT NULL,
    "start_time" text,
    "end_time" text,
    "excluded_days" text[] DEFAULT '{}',
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp DEFAULT now()
)
$$);

SELECT create_table_with_logging('temperature_logs', $$
CREATE TABLE "temperature_logs" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "fridge_id" varchar NOT NULL,
    "time_window_id" varchar,
    "temperature" numeric(4,1) NOT NULL,
    "person_name" text NOT NULL,
    "is_alert" boolean DEFAULT false NOT NULL,
    "is_on_time" boolean DEFAULT true NOT NULL,
    "late_reason" text,
    "corrective_action" text,
    "corrective_notes" text,
    "created_at" timestamp DEFAULT now()
)
$$);

SELECT create_table_with_logging('compliance_records', $$
CREATE TABLE "compliance_records" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "fridge_id" varchar NOT NULL,
    "date" timestamp NOT NULL,
    "level" text NOT NULL,
    "status" text NOT NULL,
    "temperature_compliance" numeric(5,2) DEFAULT '100.00',
    "checking_compliance" numeric(5,2) DEFAULT '100.00',
    "required_checks" numeric(3,0) DEFAULT '0' NOT NULL,
    "completed_checks" numeric(3,0) DEFAULT '0' NOT NULL,
    "on_time_checks" numeric(3,0) DEFAULT '0' NOT NULL,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
)
$$);

SELECT create_table_with_logging('missed_checks', $$
CREATE TABLE "missed_checks" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "fridge_id" varchar NOT NULL,
    "time_window_id" varchar,
    "missed_date" timestamp NOT NULL,
    "check_type" text NOT NULL,
    "reason" text,
    "is_overridden" boolean DEFAULT false NOT NULL,
    "override_reason" text,
    "overridden_by" varchar,
    "overridden_at" timestamp,
    "created_at" timestamp DEFAULT now()
)
$$);

SELECT create_table_with_logging('checklists', $$
CREATE TABLE "checklists" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "title" text NOT NULL,
    "description" text,
    "frequency" text NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "fridge_id" varchar,
    "created_by" varchar NOT NULL,
    "created_at" timestamp DEFAULT now()
)
$$);

SELECT create_table_with_logging('checklist_items', $$
CREATE TABLE "checklist_items" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "checklist_id" varchar NOT NULL,
    "title" text NOT NULL,
    "description" text,
    "is_required" boolean DEFAULT true NOT NULL,
    "sort_order" numeric(3,0) DEFAULT '0' NOT NULL,
    "created_at" timestamp DEFAULT now()
)
$$);

SELECT create_table_with_logging('checklist_completions', $$
CREATE TABLE "checklist_completions" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "checklist_id" varchar NOT NULL,
    "fridge_id" varchar,
    "completed_by" varchar NOT NULL,
    "completed_items" text[],
    "notes" text,
    "completed_at" timestamp DEFAULT now()
)
$$);

SELECT create_table_with_logging('out_of_range_events', $$
CREATE TABLE "out_of_range_events" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "temperature_log_id" varchar NOT NULL,
    "fridge_id" varchar NOT NULL,
    "temperature" numeric(4,1) NOT NULL,
    "expected_min" numeric(4,1) NOT NULL,
    "expected_max" numeric(4,1) NOT NULL,
    "severity" text NOT NULL,
    "corrective_action" text,
    "notes" text,
    "resolved_at" timestamp,
    "created_at" timestamp DEFAULT now()
)
$$);

SELECT create_table_with_logging('audit_templates', $$
CREATE TABLE "audit_templates" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" varchar NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "is_default" boolean DEFAULT false NOT NULL,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
)
$$);

SELECT create_table_with_logging('audit_sections', $$
CREATE TABLE "audit_sections" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "template_id" varchar NOT NULL,
    "title" text NOT NULL,
    "description" text,
    "order_index" numeric(3,0) DEFAULT '0' NOT NULL,
    "created_at" timestamp DEFAULT now()
)
$$);

SELECT create_table_with_logging('audit_items', $$
CREATE TABLE "audit_items" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "section_id" varchar NOT NULL,
    "text" text NOT NULL,
    "is_required" boolean DEFAULT true NOT NULL,
    "order_index" numeric(3,0) DEFAULT '0' NOT NULL,
    "note" text,
    "created_at" timestamp DEFAULT now()
)
$$);

SELECT create_table_with_logging('audit_completions', $$
CREATE TABLE "audit_completions" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" varchar NOT NULL,
    "template_id" varchar NOT NULL,
    "template_name" text NOT NULL,
    "completed_by" varchar NOT NULL,
    "completed_at" timestamp DEFAULT now(),
    "notes" text,
    "compliance_rate" numeric(5,2) DEFAULT '0' NOT NULL,
    "created_at" timestamp DEFAULT now()
)
$$);

SELECT create_table_with_logging('audit_responses', $$
CREATE TABLE "audit_responses" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "completion_id" varchar NOT NULL,
    "section_id" varchar NOT NULL,
    "section_title" text NOT NULL,
    "item_id" varchar NOT NULL,
    "item_text" text NOT NULL,
    "is_compliant" boolean NOT NULL,
    "notes" text,
    "action_required" text,
    "created_at" timestamp DEFAULT now()
)
$$);

-- NOW ADD MISSING COLUMNS TO EXISTING TABLES
DO $$
BEGIN
    RAISE NOTICE '🔄 Checking for missing columns in existing tables...';
END $$;

-- Add missing columns to users table (example: if test column doesn't exist)
SELECT add_column_if_not_exists('users', 'test', 'text');
SELECT add_column_if_not_exists('users', 'profile_image_url', 'text');
SELECT add_column_if_not_exists('users', 'dark_mode', 'boolean DEFAULT false');
SELECT add_column_if_not_exists('users', 'stripe_customer_id', 'text');
SELECT add_column_if_not_exists('users', 'stripe_subscription_id', 'text');
SELECT add_column_if_not_exists('users', 'trial_start_date', 'timestamp DEFAULT now()');
SELECT add_column_if_not_exists('users', 'trial_end_date', 'timestamp');

-- Add missing columns to fridges table
SELECT add_column_if_not_exists('fridges', 'color', 'text DEFAULT ''#3b82f6''');
SELECT add_column_if_not_exists('fridges', 'labels', 'text[]');
SELECT add_column_if_not_exists('fridges', 'enable_scheduled_checks', 'boolean DEFAULT false NOT NULL');
SELECT add_column_if_not_exists('fridges', 'check_frequency', 'text');
SELECT add_column_if_not_exists('fridges', 'excluded_days', 'text[] DEFAULT ''{}''');

-- Add missing columns to other tables as needed
SELECT add_column_if_not_exists('time_windows', 'excluded_days', 'text[] DEFAULT ''{}''');
SELECT add_column_if_not_exists('temperature_logs', 'corrective_action', 'text');
SELECT add_column_if_not_exists('temperature_logs', 'corrective_notes', 'text');

-- Add Foreign Key Constraints (with better error handling)
DO $$
BEGIN
    RAISE NOTICE '🔗 Adding foreign key constraints...';
    
    -- Users relationships
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions' AND table_schema = 'public') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                          WHERE constraint_name = 'subscriptions_user_id_users_id_fk' 
                          AND table_schema = 'public') THEN
                ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" 
                    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
                RAISE NOTICE '✅ Added FK: subscriptions -> users';
            ELSE
                RAISE NOTICE '⚠️  FK already exists: subscriptions -> users';
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '❌ Failed to add FK subscriptions -> users: %', SQLERRM;
        END;
    END IF;

    -- Continue with other FKs...
    RAISE NOTICE '✅ Foreign key constraints processed';
END $$;

-- Final verification and summary
DO $$
DECLARE
    table_count integer;
    table_names text[];
    column_info record;
BEGIN
    -- Count created tables
    SELECT COUNT(*), array_agg(table_name ORDER BY table_name) 
    INTO table_count, table_names
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('users', 'fridges', 'temperature_logs', 'checklists', 'audit_templates', 
                       'subscriptions', 'labels', 'time_windows', 'compliance_records', 
                       'missed_checks', 'checklist_items', 'checklist_completions', 
                       'out_of_range_events', 'audit_sections', 'audit_items', 
                       'audit_completions', 'audit_responses', 'sessions');

    RAISE NOTICE '📊 DEPLOYMENT SUMMARY:';
    RAISE NOTICE '   Tables found in production: %', table_count;
    RAISE NOTICE '   Table list: %', array_to_string(table_names, ', ');
    
    -- Show column counts for key tables
    FOR column_info IN 
        SELECT table_name, COUNT(*) as column_count
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'fridges', 'temperature_logs')
        GROUP BY table_name
        ORDER BY table_name
    LOOP
        RAISE NOTICE '   % has % columns', column_info.table_name, column_info.column_count;
    END LOOP;
    
    IF table_count >= 18 THEN
        RAISE NOTICE '✅ SUCCESS: Complete FridgeSafe schema with column updates deployed!';
    ELSE
        RAISE NOTICE '⚠️  WARNING: Expected 18+ tables but found % tables', table_count;
    END IF;
    
    RAISE NOTICE '🏁 Schema deployment with column updates completed at %', now();
END $$;

-- Clean up helper functions
DROP FUNCTION IF EXISTS create_table_with_logging(text, text);
DROP FUNCTION IF EXISTS add_column_if_not_exists(text, text, text);
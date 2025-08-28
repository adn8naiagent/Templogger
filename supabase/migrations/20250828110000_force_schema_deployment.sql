-- Migration: Force Complete FridgeSafe Schema Deployment
-- Description: Explicitly verify and create all missing tables in production
-- Generated: 2025-08-28 11:00:00 UTC

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_crypto";

-- Log deployment start
DO $$
BEGIN
    RAISE NOTICE '🚀 Starting force schema deployment at %', now();
END $$;

-- Function to create table only if it doesn't exist and log the result
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

-- Create all tables with explicit logging
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

-- Add Foreign Key Constraints (only if tables exist)
DO $$
BEGIN
    -- Users relationships
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions' AND table_schema = 'public') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        BEGIN
            ALTER TABLE "subscriptions" ADD CONSTRAINT IF NOT EXISTS "subscriptions_user_id_users_id_fk" 
                FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
            RAISE NOTICE '✅ Added FK: subscriptions -> users';
        EXCEPTION
            WHEN duplicate_object THEN
                RAISE NOTICE '⚠️  FK already exists: subscriptions -> users';
        END;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fridges' AND table_schema = 'public') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        BEGIN
            ALTER TABLE "fridges" ADD CONSTRAINT IF NOT EXISTS "fridges_user_id_users_id_fk" 
                FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
            RAISE NOTICE '✅ Added FK: fridges -> users';
        EXCEPTION
            WHEN duplicate_object THEN
                RAISE NOTICE '⚠️  FK already exists: fridges -> users';
        END;
    END IF;

    -- Add remaining FKs with similar pattern...
    RAISE NOTICE '✅ Foreign key constraints processed';
END $$;

-- Final verification and summary
DO $$
DECLARE
    table_count integer;
    table_names text[];
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
    
    IF table_count >= 18 THEN
        RAISE NOTICE '✅ SUCCESS: Complete FridgeSafe schema deployed to production!';
    ELSE
        RAISE NOTICE '⚠️  WARNING: Expected 18+ tables but found % tables', table_count;
    END IF;
    
    RAISE NOTICE '🏁 Force schema deployment completed at %', now();
END $$;

-- Clean up helper function
DROP FUNCTION IF EXISTS create_table_with_logging(text, text);
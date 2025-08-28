-- Migration: Complete FridgeSafe Schema Deployment
-- Description: Deploy all application tables to production database
-- Generated: 2025-08-28 10:30:00 UTC

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create all application tables with complete schema

-- 1. Sessions table (existing, but ensure it exists)
CREATE TABLE IF NOT EXISTS "sessions" (
    "sid" varchar PRIMARY KEY NOT NULL,
    "sess" text NOT NULL,
    "expire" timestamp NOT NULL
);

-- 2. Users table (enhanced)
CREATE TABLE IF NOT EXISTS "users" (
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
);

-- 3. Subscriptions table
CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" varchar NOT NULL,
    "tier" text NOT NULL,
    "status" text NOT NULL,
    "stripe_subscription_id" text,
    "current_period_end" timestamp,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
);

-- 4. Fridges table
CREATE TABLE IF NOT EXISTS "fridges" (
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
);

-- 5. Labels table
CREATE TABLE IF NOT EXISTS "labels" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" varchar NOT NULL,
    "name" text NOT NULL,
    "color" text DEFAULT '#6b7280',
    "created_at" timestamp DEFAULT now()
);

-- 6. Time windows table
CREATE TABLE IF NOT EXISTS "time_windows" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "fridge_id" varchar NOT NULL,
    "label" text NOT NULL,
    "check_type" text DEFAULT 'specific' NOT NULL,
    "start_time" text,
    "end_time" text,
    "excluded_days" text[] DEFAULT '{}',
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp DEFAULT now()
);

-- 7. Temperature logs table
CREATE TABLE IF NOT EXISTS "temperature_logs" (
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
);

-- 8. Compliance records table
CREATE TABLE IF NOT EXISTS "compliance_records" (
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
);

-- 9. Missed checks table
CREATE TABLE IF NOT EXISTS "missed_checks" (
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
);

-- 10. Checklists table
CREATE TABLE IF NOT EXISTS "checklists" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "title" text NOT NULL,
    "description" text,
    "frequency" text NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "fridge_id" varchar,
    "created_by" varchar NOT NULL,
    "created_at" timestamp DEFAULT now()
);

-- 11. Checklist items table
CREATE TABLE IF NOT EXISTS "checklist_items" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "checklist_id" varchar NOT NULL,
    "title" text NOT NULL,
    "description" text,
    "is_required" boolean DEFAULT true NOT NULL,
    "sort_order" numeric(3,0) DEFAULT '0' NOT NULL,
    "created_at" timestamp DEFAULT now()
);

-- 12. Checklist completions table
CREATE TABLE IF NOT EXISTS "checklist_completions" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "checklist_id" varchar NOT NULL,
    "fridge_id" varchar,
    "completed_by" varchar NOT NULL,
    "completed_items" text[],
    "notes" text,
    "completed_at" timestamp DEFAULT now()
);

-- 13. Out of range events table
CREATE TABLE IF NOT EXISTS "out_of_range_events" (
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
);

-- 14. Audit templates table (Self-audit feature)
CREATE TABLE IF NOT EXISTS "audit_templates" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" varchar NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "is_default" boolean DEFAULT false NOT NULL,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now()
);

-- 15. Audit sections table
CREATE TABLE IF NOT EXISTS "audit_sections" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "template_id" varchar NOT NULL,
    "title" text NOT NULL,
    "description" text,
    "order_index" numeric(3,0) DEFAULT '0' NOT NULL,
    "created_at" timestamp DEFAULT now()
);

-- 16. Audit items table
CREATE TABLE IF NOT EXISTS "audit_items" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "section_id" varchar NOT NULL,
    "text" text NOT NULL,
    "is_required" boolean DEFAULT true NOT NULL,
    "order_index" numeric(3,0) DEFAULT '0' NOT NULL,
    "note" text,
    "created_at" timestamp DEFAULT now()
);

-- 17. Audit completions table
CREATE TABLE IF NOT EXISTS "audit_completions" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" varchar NOT NULL,
    "template_id" varchar NOT NULL,
    "template_name" text NOT NULL,
    "completed_by" varchar NOT NULL,
    "completed_at" timestamp DEFAULT now(),
    "notes" text,
    "compliance_rate" numeric(5,2) DEFAULT '0' NOT NULL,
    "created_at" timestamp DEFAULT now()
);

-- 18. Audit responses table
CREATE TABLE IF NOT EXISTS "audit_responses" (
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
);

-- Add Foreign Key Constraints
-- Users relationships
ALTER TABLE "subscriptions" ADD CONSTRAINT IF NOT EXISTS "subscriptions_user_id_users_id_fk" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "fridges" ADD CONSTRAINT IF NOT EXISTS "fridges_user_id_users_id_fk" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "labels" ADD CONSTRAINT IF NOT EXISTS "labels_user_id_users_id_fk" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Fridge relationships
ALTER TABLE "time_windows" ADD CONSTRAINT IF NOT EXISTS "time_windows_fridge_id_fridges_id_fk" 
    FOREIGN KEY ("fridge_id") REFERENCES "fridges"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "temperature_logs" ADD CONSTRAINT IF NOT EXISTS "temperature_logs_fridge_id_fridges_id_fk" 
    FOREIGN KEY ("fridge_id") REFERENCES "fridges"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "temperature_logs" ADD CONSTRAINT IF NOT EXISTS "temperature_logs_time_window_id_time_windows_id_fk" 
    FOREIGN KEY ("time_window_id") REFERENCES "time_windows"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "compliance_records" ADD CONSTRAINT IF NOT EXISTS "compliance_records_fridge_id_fridges_id_fk" 
    FOREIGN KEY ("fridge_id") REFERENCES "fridges"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "missed_checks" ADD CONSTRAINT IF NOT EXISTS "missed_checks_fridge_id_fridges_id_fk" 
    FOREIGN KEY ("fridge_id") REFERENCES "fridges"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "missed_checks" ADD CONSTRAINT IF NOT EXISTS "missed_checks_time_window_id_time_windows_id_fk" 
    FOREIGN KEY ("time_window_id") REFERENCES "time_windows"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "missed_checks" ADD CONSTRAINT IF NOT EXISTS "missed_checks_overridden_by_users_id_fk" 
    FOREIGN KEY ("overridden_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Checklist relationships
ALTER TABLE "checklists" ADD CONSTRAINT IF NOT EXISTS "checklists_fridge_id_fridges_id_fk" 
    FOREIGN KEY ("fridge_id") REFERENCES "fridges"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "checklists" ADD CONSTRAINT IF NOT EXISTS "checklists_created_by_users_id_fk" 
    FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "checklist_items" ADD CONSTRAINT IF NOT EXISTS "checklist_items_checklist_id_checklists_id_fk" 
    FOREIGN KEY ("checklist_id") REFERENCES "checklists"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "checklist_completions" ADD CONSTRAINT IF NOT EXISTS "checklist_completions_checklist_id_checklists_id_fk" 
    FOREIGN KEY ("checklist_id") REFERENCES "checklists"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "checklist_completions" ADD CONSTRAINT IF NOT EXISTS "checklist_completions_fridge_id_fridges_id_fk" 
    FOREIGN KEY ("fridge_id") REFERENCES "fridges"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "checklist_completions" ADD CONSTRAINT IF NOT EXISTS "checklist_completions_completed_by_users_id_fk" 
    FOREIGN KEY ("completed_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Out of range events
ALTER TABLE "out_of_range_events" ADD CONSTRAINT IF NOT EXISTS "out_of_range_events_temperature_log_id_temperature_logs_id_fk" 
    FOREIGN KEY ("temperature_log_id") REFERENCES "temperature_logs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "out_of_range_events" ADD CONSTRAINT IF NOT EXISTS "out_of_range_events_fridge_id_fridges_id_fk" 
    FOREIGN KEY ("fridge_id") REFERENCES "fridges"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Audit system relationships
ALTER TABLE "audit_templates" ADD CONSTRAINT IF NOT EXISTS "audit_templates_user_id_users_id_fk" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "audit_sections" ADD CONSTRAINT IF NOT EXISTS "audit_sections_template_id_audit_templates_id_fk" 
    FOREIGN KEY ("template_id") REFERENCES "audit_templates"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "audit_items" ADD CONSTRAINT IF NOT EXISTS "audit_items_section_id_audit_sections_id_fk" 
    FOREIGN KEY ("section_id") REFERENCES "audit_sections"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "audit_completions" ADD CONSTRAINT IF NOT EXISTS "audit_completions_user_id_users_id_fk" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "audit_completions" ADD CONSTRAINT IF NOT EXISTS "audit_completions_template_id_audit_templates_id_fk" 
    FOREIGN KEY ("template_id") REFERENCES "audit_templates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "audit_completions" ADD CONSTRAINT IF NOT EXISTS "audit_completions_completed_by_users_id_fk" 
    FOREIGN KEY ("completed_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE "audit_responses" ADD CONSTRAINT IF NOT EXISTS "audit_responses_completion_id_audit_completions_id_fk" 
    FOREIGN KEY ("completion_id") REFERENCES "audit_completions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- Success notification
DO $$
BEGIN
    RAISE NOTICE '✅ SUCCESS: Complete FridgeSafe schema deployed to production!';
    RAISE NOTICE 'Tables created: users, fridges, temperature_logs, checklists, audit_templates, and 13+ more';
    RAISE NOTICE 'All foreign key relationships established';
    RAISE NOTICE 'Production database is now ready for full application functionality';
END $$;
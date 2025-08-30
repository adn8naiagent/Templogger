-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."audit_completions" (
    "completed_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "completed_by" VARCHAR NOT NULL,
    "template_name" TEXT NOT NULL,
    "template_id" VARCHAR NOT NULL,
    "user_id" VARCHAR NOT NULL,
    "id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "compliance_rate" DECIMAL NOT NULL DEFAULT 0,

    CONSTRAINT "audit_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_items" (
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "section_id" VARCHAR NOT NULL,
    "note" TEXT,
    "text" TEXT NOT NULL,
    "order_index" DECIMAL NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),

    CONSTRAINT "audit_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_responses" (
    "section_title" TEXT NOT NULL,
    "completion_id" VARCHAR NOT NULL,
    "id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
    "action_required" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "is_compliant" BOOLEAN NOT NULL DEFAULT false,
    "item_text" TEXT NOT NULL,
    "item_id" VARCHAR NOT NULL,
    "section_id" VARCHAR NOT NULL,

    CONSTRAINT "audit_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_sections" (
    "order_index" DECIMAL NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "template_id" VARCHAR NOT NULL,
    "id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
    "description" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_templates" (
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
    "user_id" VARCHAR NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "audit_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."calibration_records" (
    "calibration_date" TIMESTAMP(6) NOT NULL,
    "next_calibration_due" TIMESTAMP(6) NOT NULL,
    "before_calibration_reading" DECIMAL,
    "after_calibration_reading" DECIMAL,
    "accuracy" DECIMAL,
    "certificate_file_size" DECIMAL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
    "user_id" VARCHAR NOT NULL,
    "fridge_id" VARCHAR NOT NULL,
    "performed_by" TEXT NOT NULL,
    "calibration_standard" TEXT,
    "certificate_file_name" TEXT,
    "certificate_file_path" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL,

    CONSTRAINT "calibration_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."checklist_completions" (
    "id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
    "checklist_id" VARCHAR NOT NULL,
    "fridge_id" VARCHAR,
    "completed_by" VARCHAR NOT NULL,
    "completed_items" TEXT[],
    "notes" TEXT,
    "completed_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checklist_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."checklist_items" (
    "id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
    "checklist_id" VARCHAR NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" DECIMAL(3,0) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."checklists" (
    "id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "frequency" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "fridge_id" VARCHAR,
    "created_by" VARCHAR NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."compliance_records" (
    "id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
    "fridge_id" VARCHAR NOT NULL,
    "date" TIMESTAMP(6) NOT NULL,
    "level" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "temperature_compliance" DECIMAL(5,2) DEFAULT 100.00,
    "checking_compliance" DECIMAL(5,2) DEFAULT 100.00,
    "required_checks" DECIMAL(3,0) NOT NULL DEFAULT 0,
    "completed_checks" DECIMAL(3,0) NOT NULL DEFAULT 0,
    "on_time_checks" DECIMAL(3,0) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."fridges" (
    "id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
    "user_id" VARCHAR NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "notes" TEXT,
    "color" TEXT DEFAULT '#3b82f6',
    "labels" TEXT[],
    "min_temp" DECIMAL(4,1) NOT NULL,
    "max_temp" DECIMAL(4,1) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "enable_scheduled_checks" BOOLEAN NOT NULL DEFAULT false,
    "check_frequency" TEXT,
    "excluded_days" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fridges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."labels" (
    "id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
    "user_id" VARCHAR NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT DEFAULT '#6b7280',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."maintenance_records" (
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "attachment_file_size" DECIMAL,
    "next_maintenance_due" TIMESTAMP(6),
    "cost" DECIMAL,
    "status" TEXT NOT NULL,
    "maintenance_date" TIMESTAMP(6) NOT NULL,
    "fridge_id" VARCHAR NOT NULL,
    "performed_by" TEXT NOT NULL,
    "maintenance_type" TEXT NOT NULL,
    "id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
    "description" TEXT NOT NULL,
    "user_id" VARCHAR NOT NULL,
    "attachment_file_path" TEXT,
    "parts_replaced" TEXT[],
    "attachment_file_name" TEXT,

    CONSTRAINT "maintenance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."missed_checks" (
    "id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
    "fridge_id" VARCHAR NOT NULL,
    "time_window_id" VARCHAR,
    "missed_date" TIMESTAMP(6) NOT NULL,
    "check_type" TEXT NOT NULL,
    "reason" TEXT,
    "is_overridden" BOOLEAN NOT NULL DEFAULT false,
    "override_reason" TEXT,
    "overridden_by" VARCHAR,
    "overridden_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "missed_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."out_of_range_events" (
    "id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
    "temperature_log_id" VARCHAR NOT NULL,
    "fridge_id" VARCHAR NOT NULL,
    "temperature" DECIMAL(4,1) NOT NULL,
    "expected_min" DECIMAL(4,1) NOT NULL,
    "expected_max" DECIMAL(4,1) NOT NULL,
    "severity" TEXT NOT NULL,
    "corrective_action" TEXT,
    "notes" TEXT,
    "resolved_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "out_of_range_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "sid" VARCHAR NOT NULL,
    "sess" TEXT NOT NULL,
    "expire" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("sid")
);

-- CreateTable
CREATE TABLE "public"."subscriptions" (
    "id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
    "user_id" VARCHAR NOT NULL,
    "tier" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "stripe_subscription_id" TEXT,
    "current_period_end" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."temperature_logs" (
    "id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
    "fridge_id" VARCHAR NOT NULL,
    "time_window_id" VARCHAR,
    "temperature" DECIMAL(4,1) NOT NULL,
    "person_name" TEXT NOT NULL,
    "is_alert" BOOLEAN NOT NULL DEFAULT false,
    "is_on_time" BOOLEAN NOT NULL DEFAULT true,
    "late_reason" TEXT,
    "corrective_action" TEXT,
    "corrective_notes" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "temperature_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."time_windows" (
    "id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
    "fridge_id" VARCHAR NOT NULL,
    "label" TEXT NOT NULL,
    "check_type" TEXT NOT NULL DEFAULT 'specific',
    "start_time" TEXT,
    "end_time" TEXT,
    "excluded_days" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "time_windows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "profile_image_url" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "subscription_status" TEXT NOT NULL DEFAULT 'trial',
    "trial_start_date" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "trial_end_date" TIMESTAMP(6),
    "dark_mode" BOOLEAN DEFAULT false,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "paid_member_since" TIMESTAMP(6),
    "current_paid_period_start" TIMESTAMP(6),
    "total_paid_days" INTEGER DEFAULT 0,
    "city" VARCHAR,
    "state_province" VARCHAR,
    "country" VARCHAR,
    "timezone" VARCHAR,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_unique" ON "public"."users"("email");

-- AddForeignKey
ALTER TABLE "public"."audit_completions" ADD CONSTRAINT "audit_completions_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."audit_completions" ADD CONSTRAINT "audit_completions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."audit_templates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."audit_completions" ADD CONSTRAINT "audit_completions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."audit_items" ADD CONSTRAINT "audit_items_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."audit_sections"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."audit_responses" ADD CONSTRAINT "audit_responses_completion_id_fkey" FOREIGN KEY ("completion_id") REFERENCES "public"."audit_completions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."audit_responses" ADD CONSTRAINT "audit_responses_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."audit_items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."audit_responses" ADD CONSTRAINT "audit_responses_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."audit_sections"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."audit_sections" ADD CONSTRAINT "audit_sections_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."audit_templates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."audit_templates" ADD CONSTRAINT "audit_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."calibration_records" ADD CONSTRAINT "calibration_records_fridge_id_fkey" FOREIGN KEY ("fridge_id") REFERENCES "public"."fridges"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."calibration_records" ADD CONSTRAINT "calibration_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."checklist_completions" ADD CONSTRAINT "checklist_completions_checklist_id_checklists_id_fk" FOREIGN KEY ("checklist_id") REFERENCES "public"."checklists"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."checklist_completions" ADD CONSTRAINT "checklist_completions_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."checklist_completions" ADD CONSTRAINT "checklist_completions_fridge_id_fridges_id_fk" FOREIGN KEY ("fridge_id") REFERENCES "public"."fridges"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."checklist_items" ADD CONSTRAINT "checklist_items_checklist_id_checklists_id_fk" FOREIGN KEY ("checklist_id") REFERENCES "public"."checklists"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."checklists" ADD CONSTRAINT "checklists_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."checklists" ADD CONSTRAINT "checklists_fridge_id_fridges_id_fk" FOREIGN KEY ("fridge_id") REFERENCES "public"."fridges"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."compliance_records" ADD CONSTRAINT "compliance_records_fridge_id_fridges_id_fk" FOREIGN KEY ("fridge_id") REFERENCES "public"."fridges"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."fridges" ADD CONSTRAINT "fridges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."labels" ADD CONSTRAINT "labels_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."maintenance_records" ADD CONSTRAINT "maintenance_records_fridge_id_fkey" FOREIGN KEY ("fridge_id") REFERENCES "public"."fridges"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."maintenance_records" ADD CONSTRAINT "maintenance_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."missed_checks" ADD CONSTRAINT "missed_checks_fridge_id_fridges_id_fk" FOREIGN KEY ("fridge_id") REFERENCES "public"."fridges"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."missed_checks" ADD CONSTRAINT "missed_checks_overridden_by_users_id_fk" FOREIGN KEY ("overridden_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."missed_checks" ADD CONSTRAINT "missed_checks_time_window_id_time_windows_id_fk" FOREIGN KEY ("time_window_id") REFERENCES "public"."time_windows"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."out_of_range_events" ADD CONSTRAINT "out_of_range_events_fridge_id_fridges_id_fk" FOREIGN KEY ("fridge_id") REFERENCES "public"."fridges"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."out_of_range_events" ADD CONSTRAINT "out_of_range_events_temperature_log_id_temperature_logs_id_fk" FOREIGN KEY ("temperature_log_id") REFERENCES "public"."temperature_logs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."temperature_logs" ADD CONSTRAINT "temperature_logs_fridge_id_fridges_id_fk" FOREIGN KEY ("fridge_id") REFERENCES "public"."fridges"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."temperature_logs" ADD CONSTRAINT "temperature_logs_time_window_id_time_windows_id_fk" FOREIGN KEY ("time_window_id") REFERENCES "public"."time_windows"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."time_windows" ADD CONSTRAINT "time_windows_fridge_id_fridges_id_fk" FOREIGN KEY ("fridge_id") REFERENCES "public"."fridges"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;


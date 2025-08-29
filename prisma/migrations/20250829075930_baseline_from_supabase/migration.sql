-- CreateTable
CREATE TABLE "audit_templates" (
    "id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
    "user_id" VARCHAR NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_sections" (
    "id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
    "template_id" VARCHAR NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order_index" DECIMAL NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_items" (
    "id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
    "section_id" VARCHAR NOT NULL,
    "text" TEXT NOT NULL,
    "note" TEXT,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "order_index" DECIMAL NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_completions" (
    "id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
    "user_id" VARCHAR NOT NULL,
    "template_id" VARCHAR NOT NULL,
    "template_name" TEXT NOT NULL,
    "completed_by" VARCHAR NOT NULL,
    "compliance_rate" DECIMAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "completed_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_responses" (
    "id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
    "completion_id" VARCHAR NOT NULL,
    "section_id" VARCHAR NOT NULL,
    "item_id" VARCHAR NOT NULL,
    "section_title" TEXT NOT NULL,
    "item_text" TEXT NOT NULL,
    "is_compliant" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "action_required" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
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

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fridges" (
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
    "excluded_days" TEXT[] DEFAULT '{}',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fridges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calibration_records" (
    "id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
    "user_id" VARCHAR NOT NULL,
    "fridge_id" VARCHAR NOT NULL,
    "performed_by" TEXT NOT NULL,
    "calibration_date" TIMESTAMP(6) NOT NULL,
    "next_calibration_due" TIMESTAMP(6) NOT NULL,
    "calibration_standard" TEXT,
    "before_calibration_reading" DECIMAL,
    "after_calibration_reading" DECIMAL,
    "accuracy" DECIMAL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "certificate_file_name" TEXT,
    "certificate_file_path" TEXT,
    "certificate_file_size" DECIMAL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calibration_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_records" (
    "id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
    "user_id" VARCHAR NOT NULL,
    "fridge_id" VARCHAR NOT NULL,
    "maintenance_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "performed_by" TEXT NOT NULL,
    "maintenance_date" TIMESTAMP(6) NOT NULL,
    "next_maintenance_due" TIMESTAMP(6),
    "status" TEXT NOT NULL,
    "cost" DECIMAL,
    "parts_replaced" TEXT[],
    "attachment_file_name" TEXT,
    "attachment_file_path" TEXT,
    "attachment_file_size" DECIMAL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable  
CREATE TABLE "time_windows" (
    "id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
    "user_id" VARCHAR NOT NULL,
    "fridge_id" VARCHAR NOT NULL,
    "label" TEXT NOT NULL,
    "check_type" TEXT NOT NULL DEFAULT 'specific',
    "start_time" TEXT,
    "end_time" TEXT,
    "excluded_days" TEXT[] DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "time_windows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temperature_logs" (
    "id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
    "user_id" VARCHAR NOT NULL,
    "fridge_id" VARCHAR NOT NULL,
    "time_window_id" VARCHAR,
    "person_name" TEXT NOT NULL,
    "current_temp_reading" DECIMAL NOT NULL,
    "min_temp_reading" DECIMAL NOT NULL,
    "max_temp_reading" DECIMAL NOT NULL,
    "is_alert" BOOLEAN NOT NULL DEFAULT false,
    "is_on_time" BOOLEAN NOT NULL DEFAULT true,
    "late_reason" TEXT,
    "corrective_action" TEXT,
    "corrective_notes" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "temperature_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "out_of_range_events" (
    "id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
    "user_id" VARCHAR NOT NULL,
    "temperature_log_id" VARCHAR NOT NULL,
    "fridge_id" VARCHAR NOT NULL,
    "violation_type" TEXT NOT NULL,
    "current_temp_reading" DECIMAL,
    "min_temp_reading" DECIMAL,
    "max_temp_reading" DECIMAL,
    "expected_min" DECIMAL NOT NULL,
    "expected_max" DECIMAL NOT NULL,
    "severity" TEXT NOT NULL,
    "corrective_action" TEXT,
    "notes" TEXT,
    "resolved_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "out_of_range_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_records" (
    "id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
    "user_id" VARCHAR NOT NULL,
    "fridge_id" VARCHAR NOT NULL,
    "date" TIMESTAMP(6) NOT NULL,
    "level" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "temperature_compliance" DECIMAL DEFAULT 100.00,
    "checking_compliance" DECIMAL DEFAULT 100.00,
    "required_checks" DECIMAL NOT NULL DEFAULT 0,
    "completed_checks" DECIMAL NOT NULL DEFAULT 0,
    "on_time_checks" DECIMAL NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "missed_checks" (
    "id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
    "user_id" VARCHAR NOT NULL,
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
CREATE TABLE "checklists" (
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
CREATE TABLE "checklist_items" (
    "id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
    "user_id" VARCHAR NOT NULL,
    "checklist_id" VARCHAR NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" DECIMAL NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_completions" (
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
CREATE TABLE "labels" (
    "id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
    "user_id" VARCHAR NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT DEFAULT '#6b7280',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
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
CREATE TABLE "sessions" (
    "sid" VARCHAR NOT NULL,
    "sess" TEXT NOT NULL,
    "expire" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("sid")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "audit_templates" ADD CONSTRAINT "audit_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_sections" ADD CONSTRAINT "audit_sections_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "audit_templates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_items" ADD CONSTRAINT "audit_items_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "audit_sections"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_completions" ADD CONSTRAINT "audit_completions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_completions" ADD CONSTRAINT "audit_completions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "audit_templates"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_completions" ADD CONSTRAINT "audit_completions_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_responses" ADD CONSTRAINT "audit_responses_completion_id_fkey" FOREIGN KEY ("completion_id") REFERENCES "audit_completions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_responses" ADD CONSTRAINT "audit_responses_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "audit_sections"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_responses" ADD CONSTRAINT "audit_responses_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "audit_items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "fridges" ADD CONSTRAINT "fridges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "calibration_records" ADD CONSTRAINT "calibration_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "calibration_records" ADD CONSTRAINT "calibration_records_fridge_id_fkey" FOREIGN KEY ("fridge_id") REFERENCES "fridges"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "maintenance_records" ADD CONSTRAINT "maintenance_records_fridge_id_fkey" FOREIGN KEY ("fridge_id") REFERENCES "fridges"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "time_windows" ADD CONSTRAINT "time_windows_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "time_windows" ADD CONSTRAINT "time_windows_fridge_id_fkey" FOREIGN KEY ("fridge_id") REFERENCES "fridges"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "temperature_logs" ADD CONSTRAINT "temperature_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "temperature_logs" ADD CONSTRAINT "temperature_logs_fridge_id_fkey" FOREIGN KEY ("fridge_id") REFERENCES "fridges"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "temperature_logs" ADD CONSTRAINT "temperature_logs_time_window_id_fkey" FOREIGN KEY ("time_window_id") REFERENCES "time_windows"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "out_of_range_events" ADD CONSTRAINT "out_of_range_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "out_of_range_events" ADD CONSTRAINT "out_of_range_events_temperature_log_id_fkey" FOREIGN KEY ("temperature_log_id") REFERENCES "temperature_logs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "out_of_range_events" ADD CONSTRAINT "out_of_range_events_fridge_id_fkey" FOREIGN KEY ("fridge_id") REFERENCES "fridges"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "compliance_records" ADD CONSTRAINT "compliance_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "compliance_records" ADD CONSTRAINT "compliance_records_fridge_id_fkey" FOREIGN KEY ("fridge_id") REFERENCES "fridges"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "missed_checks" ADD CONSTRAINT "missed_checks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "missed_checks" ADD CONSTRAINT "missed_checks_fridge_id_fkey" FOREIGN KEY ("fridge_id") REFERENCES "fridges"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "missed_checks" ADD CONSTRAINT "missed_checks_time_window_id_fkey" FOREIGN KEY ("time_window_id") REFERENCES "time_windows"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "missed_checks" ADD CONSTRAINT "missed_checks_overridden_by_fkey" FOREIGN KEY ("overridden_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "checklists" ADD CONSTRAINT "checklists_fridge_id_fkey" FOREIGN KEY ("fridge_id") REFERENCES "fridges"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "checklists" ADD CONSTRAINT "checklists_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "checklists"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "checklist_completions" ADD CONSTRAINT "checklist_completions_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "checklists"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "checklist_completions" ADD CONSTRAINT "checklist_completions_fridge_id_fkey" FOREIGN KEY ("fridge_id") REFERENCES "fridges"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "checklist_completions" ADD CONSTRAINT "checklist_completions_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "labels" ADD CONSTRAINT "labels_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
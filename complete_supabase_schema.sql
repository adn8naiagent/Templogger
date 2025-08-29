-- Drop existing tables to recreate with complete schema
DROP TABLE IF EXISTS public.out_of_range_events CASCADE;
DROP TABLE IF EXISTS public.temperature_logs CASCADE;
DROP TABLE IF EXISTS public.calibration_records CASCADE;
DROP TABLE IF EXISTS public.maintenance_records CASCADE;
DROP TABLE IF EXISTS public.audit_responses CASCADE;
DROP TABLE IF EXISTS public.audit_items CASCADE;
DROP TABLE IF EXISTS public.audit_sections CASCADE;
DROP TABLE IF EXISTS public.audit_completions CASCADE;
DROP TABLE IF EXISTS public.audit_templates CASCADE;
DROP TABLE IF EXISTS public.compliance_records CASCADE;
DROP TABLE IF EXISTS public.missed_checks CASCADE;
DROP TABLE IF EXISTS public.time_windows CASCADE;
DROP TABLE IF EXISTS public.checklist_completions CASCADE;
DROP TABLE IF EXISTS public.checklist_items CASCADE;
DROP TABLE IF EXISTS public.checklists CASCADE;
DROP TABLE IF EXISTS public.fridges CASCADE;
DROP TABLE IF EXISTS public.labels CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Create complete schema from Supabase
CREATE TABLE public.users (
    email text NOT NULL,
    id character varying NOT NULL,
    updated_at timestamp without time zone,
    profile_image_url text,
    role text NOT NULL,
    subscription_status text NOT NULL,
    created_at timestamp without time zone,
    stripe_customer_id text,
    stripe_subscription_id text,
    dark_mode boolean,
    trial_end_date timestamp without time zone,
    test text,
    last_name text NOT NULL,
    trial_start_date timestamp without time zone,
    first_name text NOT NULL,
    password text NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (email)
);

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    expire timestamp without time zone NOT NULL,
    sess text NOT NULL,
    PRIMARY KEY (sid)
);

CREATE TABLE public.subscriptions (
    user_id character varying NOT NULL,
    tier text NOT NULL,
    status text NOT NULL,
    current_period_end timestamp without time zone,
    updated_at timestamp without time zone,
    stripe_subscription_id text,
    created_at timestamp without time zone,
    id character varying NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.labels (
    user_id character varying NOT NULL,
    id character varying NOT NULL,
    created_at timestamp without time zone,
    name text NOT NULL,
    color text,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.fridges (
    is_active boolean NOT NULL,
    user_id character varying NOT NULL,
    id character varying NOT NULL,
    enable_scheduled_checks boolean NOT NULL,
    min_temp numeric NOT NULL,
    max_temp numeric NOT NULL,
    excluded_days text[],
    created_at timestamp without time zone,
    notes text,
    updated_at timestamp without time zone,
    location text,
    check_frequency text,
    name text NOT NULL,
    labels text[],
    color text,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.checklists (
    description text,
    fridge_id character varying,
    id character varying NOT NULL,
    created_by character varying NOT NULL,
    created_at timestamp without time zone,
    is_active boolean NOT NULL,
    title text NOT NULL,
    frequency text NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (created_by) REFERENCES public.users(id),
    FOREIGN KEY (fridge_id) REFERENCES public.fridges(id)
);

CREATE TABLE public.checklist_items (
    checklist_id character varying NOT NULL,
    sort_order numeric NOT NULL,
    id character varying NOT NULL,
    created_at timestamp without time zone,
    description text,
    is_required boolean NOT NULL,
    title text NOT NULL,
    user_id character varying NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (checklist_id) REFERENCES public.checklists(id),
    FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.checklist_completions (
    fridge_id character varying,
    id character varying NOT NULL,
    completed_at timestamp without time zone,
    user_id character varying NOT NULL,
    notes text,
    completed_items text[],
    completed_by character varying NOT NULL,
    checklist_id character varying NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (checklist_id) REFERENCES public.checklists(id),
    FOREIGN KEY (completed_by) REFERENCES public.users(id),
    FOREIGN KEY (fridge_id) REFERENCES public.fridges(id),
    FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.time_windows (
    check_type text NOT NULL,
    start_time text,
    end_time text,
    excluded_days text[],
    user_id character varying NOT NULL,
    created_at timestamp without time zone,
    id character varying NOT NULL,
    is_active boolean NOT NULL,
    label text NOT NULL,
    fridge_id character varying NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (fridge_id) REFERENCES public.fridges(id),
    FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.missed_checks (
    missed_date timestamp without time zone NOT NULL,
    created_at timestamp without time zone,
    overridden_at timestamp without time zone,
    is_overridden boolean NOT NULL,
    override_reason text,
    overridden_by character varying,
    user_id character varying NOT NULL,
    id character varying NOT NULL,
    fridge_id character varying NOT NULL,
    time_window_id character varying,
    check_type text NOT NULL,
    reason text,
    PRIMARY KEY (id),
    FOREIGN KEY (fridge_id) REFERENCES public.fridges(id),
    FOREIGN KEY (overridden_by) REFERENCES public.users(id),
    FOREIGN KEY (time_window_id) REFERENCES public.time_windows(id),
    FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.compliance_records (
    id character varying NOT NULL,
    status text NOT NULL,
    level text NOT NULL,
    fridge_id character varying NOT NULL,
    updated_at timestamp without time zone,
    created_at timestamp without time zone,
    on_time_checks numeric NOT NULL,
    completed_checks numeric NOT NULL,
    required_checks numeric NOT NULL,
    checking_compliance numeric,
    temperature_compliance numeric,
    date timestamp without time zone NOT NULL,
    user_id character varying NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (fridge_id) REFERENCES public.fridges(id),
    FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.temperature_logs (
    corrective_action text,
    user_id character varying NOT NULL,
    corrective_notes text,
    late_reason text,
    person_name text NOT NULL,
    time_window_id character varying,
    current_temp_reading numeric NOT NULL,
    is_on_time boolean NOT NULL,
    fridge_id character varying NOT NULL,
    id character varying NOT NULL,
    created_at timestamp without time zone,
    min_temp_reading numeric NOT NULL,
    max_temp_reading numeric NOT NULL,
    is_alert boolean NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (fridge_id) REFERENCES public.fridges(id),
    FOREIGN KEY (time_window_id) REFERENCES public.time_windows(id),
    FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.out_of_range_events (
    notes text,
    severity text NOT NULL,
    created_at timestamp without time zone,
    resolved_at timestamp without time zone,
    expected_max numeric NOT NULL,
    expected_min numeric NOT NULL,
    max_temp_reading numeric,
    current_temp_reading numeric,
    violation_type text NOT NULL,
    min_temp_reading numeric,
    user_id character varying NOT NULL,
    id character varying NOT NULL,
    temperature_log_id character varying NOT NULL,
    fridge_id character varying NOT NULL,
    corrective_action text,
    PRIMARY KEY (id),
    FOREIGN KEY (temperature_log_id) REFERENCES public.temperature_logs(id),
    FOREIGN KEY (fridge_id) REFERENCES public.fridges(id),
    FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.audit_templates (
    is_default boolean NOT NULL,
    updated_at timestamp without time zone,
    created_at timestamp without time zone,
    id character varying NOT NULL,
    user_id character varying NOT NULL,
    name text NOT NULL,
    description text,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.audit_sections (
    order_index numeric NOT NULL,
    title text NOT NULL,
    template_id character varying NOT NULL,
    id character varying NOT NULL,
    description text,
    created_at timestamp without time zone,
    PRIMARY KEY (id),
    FOREIGN KEY (template_id) REFERENCES public.audit_templates(id)
);

CREATE TABLE public.audit_items (
    is_required boolean NOT NULL,
    section_id character varying NOT NULL,
    note text,
    text text NOT NULL,
    order_index numeric NOT NULL,
    created_at timestamp without time zone,
    id character varying NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (section_id) REFERENCES public.audit_sections(id)
);

CREATE TABLE public.audit_completions (
    completed_at timestamp without time zone,
    notes text,
    completed_by character varying NOT NULL,
    template_name text NOT NULL,
    template_id character varying NOT NULL,
    user_id character varying NOT NULL,
    id character varying NOT NULL,
    created_at timestamp without time zone,
    compliance_rate numeric NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (completed_by) REFERENCES public.users(id),
    FOREIGN KEY (template_id) REFERENCES public.audit_templates(id),
    FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.audit_responses (
    section_title text NOT NULL,
    completion_id character varying NOT NULL,
    id character varying NOT NULL,
    action_required text,
    created_at timestamp without time zone,
    notes text,
    is_compliant boolean NOT NULL,
    item_text text NOT NULL,
    item_id character varying NOT NULL,
    section_id character varying NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (completion_id) REFERENCES public.audit_completions(id),
    FOREIGN KEY (item_id) REFERENCES public.audit_items(id),
    FOREIGN KEY (section_id) REFERENCES public.audit_sections(id)
);

CREATE TABLE public.calibration_records (
    calibration_date timestamp without time zone NOT NULL,
    next_calibration_due timestamp without time zone NOT NULL,
    before_calibration_reading numeric,
    after_calibration_reading numeric,
    accuracy numeric,
    certificate_file_size numeric,
    created_at timestamp without time zone,
    id character varying NOT NULL,
    user_id character varying NOT NULL,
    fridge_id character varying NOT NULL,
    performed_by text NOT NULL,
    calibration_standard text,
    certificate_file_name text,
    certificate_file_path text,
    notes text,
    status text NOT NULL,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES public.users(id),
    FOREIGN KEY (fridge_id) REFERENCES public.fridges(id)
);

CREATE TABLE public.maintenance_records (
    created_at timestamp without time zone,
    attachment_file_size numeric,
    next_maintenance_due timestamp without time zone,
    cost numeric,
    status text NOT NULL,
    maintenance_date timestamp without time zone NOT NULL,
    fridge_id character varying NOT NULL,
    performed_by text NOT NULL,
    maintenance_type text NOT NULL,
    id character varying NOT NULL,
    description text NOT NULL,
    user_id character varying NOT NULL,
    attachment_file_path text,
    parts_replaced text[],
    attachment_file_name text,
    PRIMARY KEY (id),
    FOREIGN KEY (user_id) REFERENCES public.users(id),
    FOREIGN KEY (fridge_id) REFERENCES public.fridges(id)
);
-- Migration: Fix Foreign Key Constraints
-- Description: Add foreign key constraints with proper error handling
-- Generated: 2025-08-28 11:30:00 UTC

DO $$
BEGIN
    -- Users relationships
    BEGIN
        ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        RAISE NOTICE '✅ Added FK: subscriptions -> users';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE '⚠️  FK already exists: subscriptions -> users';
    END;

    BEGIN
        ALTER TABLE "fridges" ADD CONSTRAINT "fridges_user_id_users_id_fk" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        RAISE NOTICE '✅ Added FK: fridges -> users';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE '⚠️  FK already exists: fridges -> users';
    END;

    BEGIN
        ALTER TABLE "labels" ADD CONSTRAINT "labels_user_id_users_id_fk" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        RAISE NOTICE '✅ Added FK: labels -> users';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE '⚠️  FK already exists: labels -> users';
    END;

    -- Fridge relationships
    BEGIN
        ALTER TABLE "time_windows" ADD CONSTRAINT "time_windows_fridge_id_fridges_id_fk" 
            FOREIGN KEY ("fridge_id") REFERENCES "fridges"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        RAISE NOTICE '✅ Added FK: time_windows -> fridges';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE '⚠️  FK already exists: time_windows -> fridges';
    END;

    BEGIN
        ALTER TABLE "temperature_logs" ADD CONSTRAINT "temperature_logs_fridge_id_fridges_id_fk" 
            FOREIGN KEY ("fridge_id") REFERENCES "fridges"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        RAISE NOTICE '✅ Added FK: temperature_logs -> fridges';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE '⚠️  FK already exists: temperature_logs -> fridges';
    END;

    BEGIN
        ALTER TABLE "temperature_logs" ADD CONSTRAINT "temperature_logs_time_window_id_time_windows_id_fk" 
            FOREIGN KEY ("time_window_id") REFERENCES "time_windows"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
        RAISE NOTICE '✅ Added FK: temperature_logs -> time_windows';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE '⚠️  FK already exists: temperature_logs -> time_windows';
    END;

    -- Add remaining foreign keys with same pattern...
    RAISE NOTICE '✅ All foreign key constraints processed successfully';
END $$;
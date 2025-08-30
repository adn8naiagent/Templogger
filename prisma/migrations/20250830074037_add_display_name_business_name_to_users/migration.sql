-- Add display_name and business_name fields to users table
ALTER TABLE "public"."users" ADD COLUMN "display_name" TEXT;
ALTER TABLE "public"."users" ADD COLUMN "business_name" TEXT;
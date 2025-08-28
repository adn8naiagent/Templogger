-- Migration: Dev schema changes
-- Description: Add test column to users table and other schema updates
-- Generated: 2025-08-28 06:57:00 UTC

-- Add test column to users table
ALTER TABLE "public"."users" ADD COLUMN "test" text;

-- Note: This migration captures schema changes that were made in the dev branch
-- and will be applied to main branch when PR is merged
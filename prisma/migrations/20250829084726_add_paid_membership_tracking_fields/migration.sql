-- AlterTable
ALTER TABLE "users" ADD COLUMN     "current_paid_period_start" TIMESTAMP(6),
ADD COLUMN     "paid_member_since" TIMESTAMP(6),
ADD COLUMN     "total_paid_days" INTEGER DEFAULT 0;
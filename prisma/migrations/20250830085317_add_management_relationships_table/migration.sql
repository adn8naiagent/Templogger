-- CreateTable
CREATE TABLE "public"."management_relationships" (
    "id" VARCHAR NOT NULL DEFAULT gen_random_uuid(),
    "management_company_id" VARCHAR NOT NULL,
    "pharmacy_user_id" VARCHAR NOT NULL,
    "location_name" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "management_relationships_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."management_relationships" ADD CONSTRAINT "management_relationships_management_company_id_fkey" FOREIGN KEY ("management_company_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."management_relationships" ADD CONSTRAINT "management_relationships_pharmacy_user_id_fkey" FOREIGN KEY ("pharmacy_user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
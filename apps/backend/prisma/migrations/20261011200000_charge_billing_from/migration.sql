-- AlterTable
ALTER TABLE "Charge" ADD COLUMN "billingFrom" TIMESTAMP(3);

UPDATE "Charge" SET "billingFrom" = "createdAt";

ALTER TABLE "Charge" ALTER COLUMN "billingFrom" SET NOT NULL;

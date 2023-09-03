-- AlterTable
ALTER TABLE "Product" ADD COLUMN "deletedAt" DATETIME;

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN "deletedAt" DATETIME;

/*
  Warnings:

  - The values [CANCELLED] on the enum `StockEntryStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `modelId` on the `stock_entries` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StockEntryStatus_new" AS ENUM ('PENDING', 'VALIDATED', 'COMPLETED', 'PARTIAL');
ALTER TABLE "public"."stock_entries" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "stock_entries" ALTER COLUMN "status" TYPE "StockEntryStatus_new" USING ("status"::text::"StockEntryStatus_new");
ALTER TYPE "StockEntryStatus" RENAME TO "StockEntryStatus_old";
ALTER TYPE "StockEntryStatus_new" RENAME TO "StockEntryStatus";
DROP TYPE "public"."StockEntryStatus_old";
ALTER TABLE "stock_entries" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."stock_entries" DROP CONSTRAINT "stock_entries_modelId_fkey";

-- DropIndex
DROP INDEX "public"."stock_entries_modelId_idx";

-- AlterTable
ALTER TABLE "individual_products" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "stock_entries" DROP COLUMN "modelId";

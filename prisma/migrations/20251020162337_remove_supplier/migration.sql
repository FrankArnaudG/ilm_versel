/*
  Warnings:

  - You are about to drop the column `supplierId` on the `product_models` table. All the data in the column will be lost.
  - You are about to drop the `suppliers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."product_models" DROP CONSTRAINT "product_models_supplierId_fkey";

-- DropIndex
DROP INDEX "public"."product_models_supplierId_idx";

-- AlterTable
ALTER TABLE "product_models" DROP COLUMN "supplierId";

-- DropTable
DROP TABLE "public"."suppliers";

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_name_key" ON "Supplier"("name");

-- CreateIndex
CREATE INDEX "Supplier_name_idx" ON "Supplier"("name");

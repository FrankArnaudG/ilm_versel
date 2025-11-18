/*
  Warnings:

  - The values [DISCONTINUED,COMING_SOON] on the enum `ProductStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('ENTRY', 'SALE', 'TRANSFER', 'RETURN', 'ADJUSTMENT', 'LOSS', 'DEFECT');

-- CreateEnum
CREATE TYPE "StockEntryStatus" AS ENUM ('PENDING', 'VALIDATED', 'CANCELLED', 'PARTIAL');

-- CreateEnum
CREATE TYPE "ImportSource" AS ENUM ('MANUAL', 'EXCEL', 'API');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "IndividualProductStatus" ADD VALUE 'RETURNED';
ALTER TYPE "IndividualProductStatus" ADD VALUE 'LOST';

-- AlterEnum
BEGIN;
CREATE TYPE "ProductStatus_new" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED', 'DESTOCKING_ACTIVE', 'DESTOCKING_END_OF_LIFE', 'INACTIVE');
ALTER TABLE "public"."product_models" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "product_models" ALTER COLUMN "status" TYPE "ProductStatus_new" USING ("status"::text::"ProductStatus_new");
ALTER TYPE "ProductStatus" RENAME TO "ProductStatus_old";
ALTER TYPE "ProductStatus_new" RENAME TO "ProductStatus";
DROP TYPE "public"."ProductStatus_old";
ALTER TABLE "product_models" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- CreateTable
CREATE TABLE "stock_entries" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "documentUrl" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentRefs" JSONB,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "receivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "importSource" "ImportSource" NOT NULL DEFAULT 'MANUAL',
    "excelFileName" TEXT,
    "totalArticles" INTEGER NOT NULL DEFAULT 0,
    "totalArticlesId" JSONB,
    "totalValueEUR" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalValueFCFA" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "averageMargin" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" "StockEntryStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "validatedById" TEXT,
    "validatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "individual_products" (
    "id" TEXT NOT NULL,
    "articleNumber" TEXT NOT NULL,
    "articleReference" TEXT NOT NULL,
    "modelReference" TEXT NOT NULL,
    "description" TEXT,
    "modelId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "colorId" TEXT,
    "variantId" TEXT,
    "useFCFA" BOOLEAN NOT NULL DEFAULT false,
    "pvTTC" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "pamp" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "oldPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tva" DECIMAL(5,2) NOT NULL DEFAULT 18,
    "margin" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "pvTTC_FCFA" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "pamp_FCFA" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "oldPrice_FCFA" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "marginFCFA" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "marginPercent" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "specifications" JSONB,
    "status" "IndividualProductStatus" NOT NULL DEFAULT 'IN_STOCK',
    "condition" "ProductCondition" NOT NULL DEFAULT 'NEW',
    "purchaseDate" TIMESTAMP(3),
    "receivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "soldDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "individual_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_entries_storeId_idx" ON "stock_entries"("storeId");

-- CreateIndex
CREATE INDEX "stock_entries_modelId_idx" ON "stock_entries"("modelId");

-- CreateIndex
CREATE INDEX "stock_entries_supplierId_idx" ON "stock_entries"("supplierId");

-- CreateIndex
CREATE INDEX "stock_entries_status_idx" ON "stock_entries"("status");

-- CreateIndex
CREATE INDEX "stock_entries_purchaseDate_idx" ON "stock_entries"("purchaseDate");

-- CreateIndex
CREATE INDEX "stock_entries_createdAt_idx" ON "stock_entries"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "individual_products_articleNumber_key" ON "individual_products"("articleNumber");

-- CreateIndex
CREATE INDEX "individual_products_modelId_idx" ON "individual_products"("modelId");

-- CreateIndex
CREATE INDEX "individual_products_storeId_idx" ON "individual_products"("storeId");

-- CreateIndex
CREATE INDEX "individual_products_entryId_idx" ON "individual_products"("entryId");

-- CreateIndex
CREATE INDEX "individual_products_supplierId_idx" ON "individual_products"("supplierId");

-- CreateIndex
CREATE INDEX "individual_products_colorId_idx" ON "individual_products"("colorId");

-- CreateIndex
CREATE INDEX "individual_products_variantId_idx" ON "individual_products"("variantId");

-- CreateIndex
CREATE INDEX "individual_products_status_idx" ON "individual_products"("status");

-- CreateIndex
CREATE INDEX "individual_products_articleNumber_idx" ON "individual_products"("articleNumber");

-- CreateIndex
CREATE INDEX "individual_products_articleReference_idx" ON "individual_products"("articleReference");

-- CreateIndex
CREATE INDEX "individual_products_modelReference_idx" ON "individual_products"("modelReference");

-- AddForeignKey
ALTER TABLE "stock_entries" ADD CONSTRAINT "stock_entries_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_entries" ADD CONSTRAINT "stock_entries_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "product_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_entries" ADD CONSTRAINT "stock_entries_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "individual_products" ADD CONSTRAINT "individual_products_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "product_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "individual_products" ADD CONSTRAINT "individual_products_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "individual_products" ADD CONSTRAINT "individual_products_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "stock_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "individual_products" ADD CONSTRAINT "individual_products_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "individual_products" ADD CONSTRAINT "individual_products_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "product_colors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "individual_products" ADD CONSTRAINT "individual_products_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

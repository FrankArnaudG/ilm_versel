/*
  Warnings:

  - You are about to drop the column `margin` on the `individual_products` table. All the data in the column will be lost.
  - You are about to drop the column `marginFCFA` on the `individual_products` table. All the data in the column will be lost.
  - You are about to drop the column `marginPercent` on the `individual_products` table. All the data in the column will be lost.
  - You are about to drop the column `oldPrice` on the `individual_products` table. All the data in the column will be lost.
  - You are about to drop the column `oldPrice_FCFA` on the `individual_products` table. All the data in the column will be lost.
  - You are about to drop the column `pamp` on the `individual_products` table. All the data in the column will be lost.
  - You are about to drop the column `pamp_FCFA` on the `individual_products` table. All the data in the column will be lost.
  - You are about to drop the column `pvTTC` on the `individual_products` table. All the data in the column will be lost.
  - You are about to drop the column `pvTTC_FCFA` on the `individual_products` table. All the data in the column will be lost.
  - You are about to drop the column `stockage_ram` on the `individual_products` table. All the data in the column will be lost.
  - You are about to drop the column `tva` on the `individual_products` table. All the data in the column will be lost.
  - You are about to drop the column `useFCFA` on the `individual_products` table. All the data in the column will be lost.
  - You are about to drop the column `stockage_ram` on the `product_variants` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[modelId,storeId,colorId]` on the table `product_variants` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."product_variants_modelId_storeId_colorId_stockage_ram_key";

-- AlterTable
ALTER TABLE "individual_products" DROP COLUMN "margin",
DROP COLUMN "marginFCFA",
DROP COLUMN "marginPercent",
DROP COLUMN "oldPrice",
DROP COLUMN "oldPrice_FCFA",
DROP COLUMN "pamp",
DROP COLUMN "pamp_FCFA",
DROP COLUMN "pvTTC",
DROP COLUMN "pvTTC_FCFA",
DROP COLUMN "stockage_ram",
DROP COLUMN "tva",
DROP COLUMN "useFCFA",
ADD COLUMN     "variantPriceId" TEXT;

-- AlterTable
ALTER TABLE "product_variants" DROP COLUMN "stockage_ram",
ADD COLUMN     "variantPriceId" TEXT;

-- CreateTable
CREATE TABLE "variant_prices" (
    "id" TEXT NOT NULL,
    "stockage_ram" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variant_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "variant_prices_stockage_ram_idx" ON "variant_prices"("stockage_ram");

-- CreateIndex
CREATE INDEX "variant_prices_pvTTC_idx" ON "variant_prices"("pvTTC");

-- CreateIndex
CREATE UNIQUE INDEX "variant_prices_stockage_ram_pvTTC_pamp_tva_useFCFA_key" ON "variant_prices"("stockage_ram", "pvTTC", "pamp", "tva", "useFCFA");

-- CreateIndex
CREATE INDEX "individual_products_storeId_status_idx" ON "individual_products"("storeId", "status");

-- CreateIndex
CREATE INDEX "individual_products_variantPriceId_status_idx" ON "individual_products"("variantPriceId", "status");

-- CreateIndex
CREATE INDEX "individual_products_variantId_idx" ON "individual_products"("variantId");

-- CreateIndex
CREATE INDEX "individual_products_variantPriceId_idx" ON "individual_products"("variantPriceId");

-- CreateIndex
CREATE INDEX "product_variants_variantPriceId_idx" ON "product_variants"("variantPriceId");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_modelId_storeId_colorId_key" ON "product_variants"("modelId", "storeId", "colorId");

-- AddForeignKey
ALTER TABLE "individual_products" ADD CONSTRAINT "individual_products_variantPriceId_fkey" FOREIGN KEY ("variantPriceId") REFERENCES "variant_prices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_variantPriceId_fkey" FOREIGN KEY ("variantPriceId") REFERENCES "variant_prices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

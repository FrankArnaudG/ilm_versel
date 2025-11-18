/*
  Warnings:

  - You are about to drop the column `variantPriceId` on the `individual_products` table. All the data in the column will be lost.
  - You are about to drop the column `variantPriceId` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the `variant_prices` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[modelId,storeId,colorId,variantAttribute]` on the table `product_variants` will be added. If there are existing duplicate values, this will fail.
  - Made the column `variantId` on table `individual_products` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "VariantAttributeType" AS ENUM ('STORAGE_RAM', 'SIZE', 'CAPACITY', 'CONNECTOR', 'MEMORY', 'NONE');

-- DropForeignKey
ALTER TABLE "public"."individual_products" DROP CONSTRAINT "individual_products_variantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."individual_products" DROP CONSTRAINT "individual_products_variantPriceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."product_variants" DROP CONSTRAINT "product_variants_variantPriceId_fkey";

-- DropIndex
DROP INDEX "public"."individual_products_variantPriceId_idx";

-- DropIndex
DROP INDEX "public"."individual_products_variantPriceId_status_idx";

-- DropIndex
DROP INDEX "public"."product_variants_availableStock_idx";

-- DropIndex
DROP INDEX "public"."product_variants_modelId_storeId_colorId_key";

-- DropIndex
DROP INDEX "public"."product_variants_variantPriceId_idx";

-- AlterTable
ALTER TABLE "individual_products" DROP COLUMN "variantPriceId",
ALTER COLUMN "variantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "product_variants" DROP COLUMN "variantPriceId",
ADD COLUMN     "attributeType" "VariantAttributeType",
ADD COLUMN     "margin" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "marginFCFA" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "marginPercent" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "oldPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "oldPrice_FCFA" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "pamp" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "pamp_FCFA" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "pvTTC" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "pvTTC_FCFA" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "tva" DECIMAL(5,2) NOT NULL DEFAULT 18,
ADD COLUMN     "useFCFA" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "variantAttribute" TEXT;

-- DropTable
DROP TABLE "public"."variant_prices";

-- CreateIndex
CREATE INDEX "individual_products_variantId_status_idx" ON "individual_products"("variantId", "status");

-- CreateIndex
CREATE INDEX "product_variants_modelId_storeId_idx" ON "product_variants"("modelId", "storeId");

-- CreateIndex
CREATE INDEX "product_variants_storeId_availableStock_idx" ON "product_variants"("storeId", "availableStock");

-- CreateIndex
CREATE INDEX "product_variants_storeId_idx" ON "product_variants"("storeId");

-- CreateIndex
CREATE INDEX "product_variants_attributeType_idx" ON "product_variants"("attributeType");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_modelId_storeId_colorId_variantAttribute_key" ON "product_variants"("modelId", "storeId", "colorId", "variantAttribute");

-- AddForeignKey
ALTER TABLE "individual_products" ADD CONSTRAINT "individual_products_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

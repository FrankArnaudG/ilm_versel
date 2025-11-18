/*
  Warnings:

  - You are about to drop the column `colorId` on the `product_variants` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[modelId,storeId,variantAttribute]` on the table `product_variants` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."product_variants" DROP CONSTRAINT "product_variants_colorId_fkey";

-- DropIndex
DROP INDEX "public"."product_variants_colorId_idx";

-- DropIndex
DROP INDEX "public"."product_variants_modelId_storeId_colorId_variantAttribute_key";

-- AlterTable
ALTER TABLE "product_variants" DROP COLUMN "colorId";

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_modelId_storeId_variantAttribute_key" ON "product_variants"("modelId", "storeId", "variantAttribute");

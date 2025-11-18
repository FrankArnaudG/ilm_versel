/*
  Warnings:

  - A unique constraint covering the columns `[modelId,storeId,colorId,stockage_ram]` on the table `product_variants` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."product_variants_modelId_colorId_stockage_ram_key";

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_modelId_storeId_colorId_stockage_ram_key" ON "product_variants"("modelId", "storeId", "colorId", "stockage_ram");

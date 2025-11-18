-- AlterTable
ALTER TABLE "individual_products" ADD COLUMN     "variantId" TEXT;

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "variantReference" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "colorId" TEXT,
    "stockage_ram" TEXT,
    "totalStock" INTEGER NOT NULL DEFAULT 0,
    "availableStock" INTEGER NOT NULL DEFAULT 0,
    "reservedStock" INTEGER NOT NULL DEFAULT 0,
    "soldStock" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_variantReference_key" ON "product_variants"("variantReference");

-- CreateIndex
CREATE INDEX "product_variants_modelId_idx" ON "product_variants"("modelId");

-- CreateIndex
CREATE INDEX "product_variants_colorId_idx" ON "product_variants"("colorId");

-- CreateIndex
CREATE INDEX "product_variants_variantReference_idx" ON "product_variants"("variantReference");

-- CreateIndex
CREATE INDEX "product_variants_availableStock_idx" ON "product_variants"("availableStock");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_modelId_colorId_stockage_ram_key" ON "product_variants"("modelId", "colorId", "stockage_ram");

-- AddForeignKey
ALTER TABLE "individual_products" ADD CONSTRAINT "individual_products_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "product_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "product_colors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

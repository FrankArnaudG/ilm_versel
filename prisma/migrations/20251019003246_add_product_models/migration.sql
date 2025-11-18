-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'DISCONTINUED', 'COMING_SOON', 'DRAFT');

-- CreateEnum
CREATE TYPE "ProductCondition" AS ENUM ('NEW', 'LIKE_NEW', 'REFURBISHED');

-- CreateEnum
CREATE TYPE "IndividualProductStatus" AS ENUM ('IN_STOCK', 'IN_TRANSIT', 'SOLD', 'RESERVED', 'DEFECTIVE', 'STOLEN');

-- CreateEnum
CREATE TYPE "RecommendationType" AS ENUM ('ACCESSORY', 'COMPLEMENTARY', 'UPGRADE', 'ALTERNATIVE', 'BUNDLE');

-- CreateTable
CREATE TABLE "product_models" (
    "id" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "family" TEXT,
    "subFamily" TEXT,
    "description" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "supplierId" TEXT NOT NULL,
    "specifications" JSONB,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_colors" (
    "id" TEXT NOT NULL,
    "colorName" TEXT NOT NULL,
    "hexaColor" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_colors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "colorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "useFCFA" BOOLEAN NOT NULL DEFAULT false,
    "pvTTC" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "pamp" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "oldPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "margin" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tva" DECIMAL(5,2) NOT NULL DEFAULT 18,
    "pvTTC_FCFA" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "pamp_FCFA" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "oldPrice_FCFA" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "marginFCFA" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "specifications" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recommended_products" (
    "id" TEXT NOT NULL,
    "mainProductId" TEXT NOT NULL,
    "recommendedProductId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 5,
    "relationType" "RecommendationType" NOT NULL DEFAULT 'ACCESSORY',
    "bundleDiscount" DECIMAL(5,2),
    "bundlePrice" DECIMAL(10,2),
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recommended_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_models_reference_key" ON "product_models"("reference");

-- CreateIndex
CREATE INDEX "product_models_brand_idx" ON "product_models"("brand");

-- CreateIndex
CREATE INDEX "product_models_category_idx" ON "product_models"("category");

-- CreateIndex
CREATE INDEX "product_models_status_idx" ON "product_models"("status");

-- CreateIndex
CREATE INDEX "product_models_supplierId_idx" ON "product_models"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_name_key" ON "suppliers"("name");

-- CreateIndex
CREATE INDEX "suppliers_name_idx" ON "suppliers"("name");

-- CreateIndex
CREATE INDEX "product_colors_modelId_idx" ON "product_colors"("modelId");

-- CreateIndex
CREATE INDEX "product_images_colorId_idx" ON "product_images"("colorId");

-- CreateIndex
CREATE INDEX "product_images_displayOrder_idx" ON "product_images"("displayOrder");

-- CreateIndex
CREATE INDEX "product_variants_modelId_idx" ON "product_variants"("modelId");

-- CreateIndex
CREATE INDEX "recommended_products_mainProductId_idx" ON "recommended_products"("mainProductId");

-- CreateIndex
CREATE INDEX "recommended_products_recommendedProductId_idx" ON "recommended_products"("recommendedProductId");

-- CreateIndex
CREATE INDEX "recommended_products_priority_idx" ON "recommended_products"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "recommended_products_mainProductId_recommendedProductId_key" ON "recommended_products"("mainProductId", "recommendedProductId");

-- AddForeignKey
ALTER TABLE "product_models" ADD CONSTRAINT "product_models_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_colors" ADD CONSTRAINT "product_colors_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "product_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "product_colors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "product_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommended_products" ADD CONSTRAINT "recommended_products_mainProductId_fkey" FOREIGN KEY ("mainProductId") REFERENCES "product_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommended_products" ADD CONSTRAINT "recommended_products_recommendedProductId_fkey" FOREIGN KEY ("recommendedProductId") REFERENCES "product_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

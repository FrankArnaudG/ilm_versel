/*
  Warnings:

  - You are about to drop the column `variantId` on the `individual_products` table. All the data in the column will be lost.
  - You are about to drop the `product_variants` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."individual_products" DROP CONSTRAINT "individual_products_variantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."product_variants" DROP CONSTRAINT "product_variants_modelId_fkey";

-- AlterTable
ALTER TABLE "individual_products" DROP COLUMN "variantId",
ADD COLUMN     "stockage_ram" TEXT;

-- DropTable
DROP TABLE "public"."product_variants";

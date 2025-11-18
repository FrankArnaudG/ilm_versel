/*
  Warnings:

  - You are about to drop the column `variantId` on the `individual_products` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."individual_products" DROP CONSTRAINT "individual_products_variantId_fkey";

-- DropIndex
DROP INDEX "public"."individual_products_variantId_idx";

-- AlterTable
ALTER TABLE "individual_products" DROP COLUMN "variantId";

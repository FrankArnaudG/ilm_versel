/*
  Warnings:

  - You are about to drop the column `height` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `length` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `weight` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `width` on the `product_variants` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "product_variants" DROP COLUMN "height",
DROP COLUMN "length",
DROP COLUMN "weight",
DROP COLUMN "width";

/*
  Warnings:

  - You are about to drop the column `margin` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `marginFCFA` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `oldPrice` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `oldPrice_FCFA` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `pamp` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `pamp_FCFA` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `pvTTC` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `pvTTC_FCFA` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `tva` on the `product_variants` table. All the data in the column will be lost.
  - You are about to drop the column `useFCFA` on the `product_variants` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "product_variants" DROP COLUMN "margin",
DROP COLUMN "marginFCFA",
DROP COLUMN "oldPrice",
DROP COLUMN "oldPrice_FCFA",
DROP COLUMN "pamp",
DROP COLUMN "pamp_FCFA",
DROP COLUMN "pvTTC",
DROP COLUMN "pvTTC_FCFA",
DROP COLUMN "tva",
DROP COLUMN "useFCFA";

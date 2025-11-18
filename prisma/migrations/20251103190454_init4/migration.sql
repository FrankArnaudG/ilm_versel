/*
  Warnings:

  - Added the required column `storeId` to the `product_variants` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN     "storeId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "individual_products" ADD COLUMN     "variantId" TEXT;

-- AddForeignKey
ALTER TABLE "individual_products" ADD CONSTRAINT "individual_products_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

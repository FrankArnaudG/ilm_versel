/*
  Warnings:

  - You are about to drop the column `condition` on the `individual_products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "individual_products" DROP COLUMN "condition",
ADD COLUMN     "articleCondition" "ProductCondition" NOT NULL DEFAULT 'NEW';

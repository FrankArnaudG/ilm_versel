/*
  Warnings:

  - You are about to drop the column `purchaseDate` on the `individual_products` table. All the data in the column will be lost.
  - You are about to drop the column `averageMargin` on the `stock_entries` table. All the data in the column will be lost.
  - You are about to drop the column `documentUrl` on the `stock_entries` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `stock_entries` table. All the data in the column will be lost.
  - You are about to drop the column `totalArticlesId` on the `stock_entries` table. All the data in the column will be lost.
  - You are about to drop the column `totalValueEUR` on the `stock_entries` table. All the data in the column will be lost.
  - You are about to drop the column `totalValueFCFA` on the `stock_entries` table. All the data in the column will be lost.
  - Added the required column `documentFile` to the `stock_entries` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "IndividualProductStatus" ADD VALUE 'DRAFT';

-- AlterTable
ALTER TABLE "individual_products" DROP COLUMN "purchaseDate";

-- AlterTable
ALTER TABLE "stock_entries" DROP COLUMN "averageMargin",
DROP COLUMN "documentUrl",
DROP COLUMN "notes",
DROP COLUMN "totalArticlesId",
DROP COLUMN "totalValueEUR",
DROP COLUMN "totalValueFCFA",
ADD COLUMN     "documentFile" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "stock_entries" ADD CONSTRAINT "stock_entries_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

/*
  Warnings:

  - Made the column `documentRefs` on table `stock_entries` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "stock_entries" ALTER COLUMN "documentRefs" SET NOT NULL,
ALTER COLUMN "documentRefs" SET DATA TYPE TEXT;

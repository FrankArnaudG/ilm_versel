-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "totalHeight" DECIMAL(10,2),
ADD COLUMN     "totalLength" DECIMAL(10,2),
ADD COLUMN     "totalWeight" DECIMAL(10,3),
ADD COLUMN     "totalWidth" DECIMAL(10,2);

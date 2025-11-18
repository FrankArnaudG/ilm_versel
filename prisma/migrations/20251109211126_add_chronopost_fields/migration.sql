-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "chronopostLabel" TEXT,
ADD COLUMN     "chronopostSkybillNumber" TEXT,
ADD COLUMN     "labelGeneratedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "product_variants" ADD COLUMN     "height" DECIMAL(10,2),
ADD COLUMN     "length" DECIMAL(10,2),
ADD COLUMN     "weight" DECIMAL(10,3),
ADD COLUMN     "width" DECIMAL(10,2);

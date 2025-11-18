-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "chronopostAccount" TEXT,
ADD COLUMN     "chronopostError" TEXT,
ADD COLUMN     "chronopostProductCode" TEXT,
ADD COLUMN     "chronopostRetries" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pickupConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pickupRequested" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pickupRequestedAt" TIMESTAMP(3);

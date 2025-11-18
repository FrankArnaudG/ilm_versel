-- AlterTable
ALTER TABLE "addresses" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "product_models" ADD COLUMN     "is_new" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_on_deal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_our_best_seller" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_recommanded" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "newsletter_subscribers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscribers_email_key" ON "newsletter_subscribers"("email");

-- CreateIndex
CREATE INDEX "newsletter_subscribers_email_idx" ON "newsletter_subscribers"("email");

-- CreateIndex
CREATE INDEX "newsletter_subscribers_createdAt_idx" ON "newsletter_subscribers"("createdAt");

-- CreateIndex
CREATE INDEX "addresses_userId_deletedAt_idx" ON "addresses"("userId", "deletedAt");

/*
  Warnings:

  - Made the column `userId` on table `product_reviews` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `review_replies` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "product_reviews" ADD COLUMN     "isApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "moderatedAt" TIMESTAMP(3),
ADD COLUMN     "moderatedBy" TEXT,
ADD COLUMN     "moderationNote" TEXT,
ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "review_replies" ALTER COLUMN "userId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "product_reviews_userId_idx" ON "product_reviews"("userId");

-- CreateIndex
CREATE INDEX "product_reviews_isApproved_idx" ON "product_reviews"("isApproved");

-- CreateIndex
CREATE INDEX "product_reviews_moderatedBy_idx" ON "product_reviews"("moderatedBy");

-- CreateIndex
CREATE INDEX "review_replies_userId_idx" ON "review_replies"("userId");

-- AddForeignKey
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_moderatedBy_fkey" FOREIGN KEY ("moderatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_replies" ADD CONSTRAINT "review_replies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

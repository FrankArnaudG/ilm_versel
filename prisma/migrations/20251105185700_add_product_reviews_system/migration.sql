-- AlterTable
ALTER TABLE "product_models" ADD COLUMN     "averageRating" DECIMAL(3,2),
ADD COLUMN     "totalReviews" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "product_reviews" (
    "id" TEXT NOT NULL,
    "productModelId" TEXT NOT NULL,
    "userId" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "authorName" TEXT NOT NULL,
    "authorEmail" TEXT,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isVerifiedPurchase" BOOLEAN NOT NULL DEFAULT false,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_replies" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT,
    "authorName" TEXT NOT NULL,
    "replyText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_replies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_reviews_productModelId_idx" ON "product_reviews"("productModelId");

-- CreateIndex
CREATE INDEX "product_reviews_rating_idx" ON "product_reviews"("rating");

-- CreateIndex
CREATE INDEX "product_reviews_createdAt_idx" ON "product_reviews"("createdAt");

-- CreateIndex
CREATE INDEX "product_reviews_isVisible_idx" ON "product_reviews"("isVisible");

-- CreateIndex
CREATE INDEX "review_replies_reviewId_idx" ON "review_replies"("reviewId");

-- CreateIndex
CREATE INDEX "review_replies_createdAt_idx" ON "review_replies"("createdAt");

-- CreateIndex
CREATE INDEX "product_models_averageRating_idx" ON "product_models"("averageRating");

-- AddForeignKey
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_productModelId_fkey" FOREIGN KEY ("productModelId") REFERENCES "product_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_replies" ADD CONSTRAINT "review_replies_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "product_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

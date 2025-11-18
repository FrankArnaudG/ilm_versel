-- CreateTable
CREATE TABLE "wishlist_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productModelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wishlist_items_userId_idx" ON "wishlist_items"("userId");

-- CreateIndex
CREATE INDEX "wishlist_items_productModelId_idx" ON "wishlist_items"("productModelId");

-- CreateIndex
CREATE INDEX "wishlist_items_createdAt_idx" ON "wishlist_items"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "wishlist_items_userId_productModelId_key" ON "wishlist_items"("userId", "productModelId");

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_productModelId_fkey" FOREIGN KEY ("productModelId") REFERENCES "product_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "product_comparisons" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "productIds" TEXT[],
    "sessionId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_comparisons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offline_stores_locations" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "departement" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "telephone" TEXT,
    "google_map_link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offline_stores_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_comparisons_userId_idx" ON "product_comparisons"("userId");

-- CreateIndex
CREATE INDEX "product_comparisons_createdAt_idx" ON "product_comparisons"("createdAt");

-- CreateIndex
CREATE INDEX "product_comparisons_sessionId_idx" ON "product_comparisons"("sessionId");

-- CreateIndex
CREATE INDEX "offline_stores_locations_departement_idx" ON "offline_stores_locations"("departement");

-- AddForeignKey
ALTER TABLE "product_comparisons" ADD CONSTRAINT "product_comparisons_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

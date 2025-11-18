/*
  Warnings:

  - A unique constraint covering the columns `[clientId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "clientId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_clientId_key" ON "users"("clientId");

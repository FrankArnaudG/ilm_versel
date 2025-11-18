-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "password" TEXT;

-- AlterTable
ALTER TABLE "verification_tokens" ADD COLUMN     "type" "TokenType" NOT NULL DEFAULT 'EMAIL_VERIFICATION';

-- CreateIndex
CREATE INDEX "verification_tokens_identifier_idx" ON "verification_tokens"("identifier");

-- CreateIndex
CREATE INDEX "verification_tokens_type_idx" ON "verification_tokens"("type");

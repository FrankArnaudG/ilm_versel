/*
  Warnings:

  - The values [ADMIN,DELIVERY] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `department` to the `stores` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('USER', 'SUPER_ADMIN', 'OPERATIONS_DIRECTOR', 'FINANCIAL_MANAGER', 'DATA_ANALYST', 'INVENTORY_MANAGER', 'STORE_MANAGER', 'ASSISTANT_MANAGER', 'SALES_REPRESENTATIVE');
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER';
COMMIT;

-- AlterTable
ALTER TABLE "stores" ADD COLUMN     "department" TEXT NOT NULL;

-- DropEnum
DROP TYPE "public"."UserRole";

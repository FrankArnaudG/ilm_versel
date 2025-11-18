-- CreateTable
CREATE TABLE "user_secondary_roles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "assignedById" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "user_secondary_roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_secondary_roles_userId_idx" ON "user_secondary_roles"("userId");

-- CreateIndex
CREATE INDEX "user_secondary_roles_role_idx" ON "user_secondary_roles"("role");

-- CreateIndex
CREATE UNIQUE INDEX "user_secondary_roles_userId_role_key" ON "user_secondary_roles"("userId", "role");

-- AddForeignKey
ALTER TABLE "user_secondary_roles" ADD CONSTRAINT "user_secondary_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

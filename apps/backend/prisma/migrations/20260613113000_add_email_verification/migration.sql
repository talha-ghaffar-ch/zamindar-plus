ALTER TABLE "User" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "emailVerificationTokenHash" TEXT;
ALTER TABLE "User" ADD COLUMN "emailVerificationExpiresAt" TIMESTAMP(3);

UPDATE "User"
SET "emailVerifiedAt" = "createdAt"
WHERE "emailVerified" = true AND "emailVerifiedAt" IS NULL;

CREATE INDEX "User_emailVerificationTokenHash_idx" ON "User"("emailVerificationTokenHash");

ALTER TABLE "User" ADD COLUMN "googleId" TEXT;
ALTER TABLE "User" ADD COLUMN "authProvider" TEXT NOT NULL DEFAULT 'PASSWORD';

CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

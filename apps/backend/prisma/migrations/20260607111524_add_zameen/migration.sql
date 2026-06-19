-- CreateTable
CREATE TABLE "Zameen" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "murabbaNumber" TEXT,
    "zameenName" TEXT NOT NULL,
    "killaNumber" TEXT,
    "khasraNumber" TEXT,
    "totalAreaValue" DOUBLE PRECISION NOT NULL,
    "totalAreaUnit" TEXT NOT NULL,
    "totalAreaSqft" DOUBLE PRECISION NOT NULL,
    "ownershipType" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Zameen_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Zameen_profileId_idx" ON "Zameen"("profileId");

-- AddForeignKey
ALTER TABLE "Zameen" ADD CONSTRAINT "Zameen_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

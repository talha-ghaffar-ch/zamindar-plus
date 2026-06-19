-- CreateTable
CREATE TABLE "Crop" (
    "id" TEXT NOT NULL,
    "zameenId" TEXT NOT NULL,
    "cropName" TEXT NOT NULL,
    "cropAreaValue" DOUBLE PRECISION NOT NULL,
    "cropAreaUnit" TEXT NOT NULL,
    "cropAreaSqft" DOUBLE PRECISION NOT NULL,
    "startMonth" INTEGER,
    "startYear" INTEGER,
    "expectedEndMonth" INTEGER,
    "expectedEndYear" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Crop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Crop_zameenId_idx" ON "Crop"("zameenId");

-- AddForeignKey
ALTER TABLE "Crop" ADD CONSTRAINT "Crop_zameenId_fkey" FOREIGN KEY ("zameenId") REFERENCES "Zameen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

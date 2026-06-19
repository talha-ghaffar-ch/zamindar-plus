-- CreateTable
CREATE TABLE "Income" (
    "id" TEXT NOT NULL,
    "cropId" TEXT NOT NULL,
    "incomeType" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION,
    "quantityUnit" TEXT,
    "rate" DOUBLE PRECISION,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "incomeDate" TIMESTAMP(3) NOT NULL,
    "incomeMonth" INTEGER NOT NULL,
    "incomeYear" INTEGER NOT NULL,
    "paymentStatus" TEXT,
    "buyerName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Income_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Income_cropId_idx" ON "Income"("cropId");

-- CreateIndex
CREATE INDEX "Income_incomeMonth_incomeYear_idx" ON "Income"("incomeMonth", "incomeYear");

-- AddForeignKey
ALTER TABLE "Income" ADD CONSTRAINT "Income_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

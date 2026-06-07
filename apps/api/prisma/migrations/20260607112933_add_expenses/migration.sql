-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "cropId" TEXT NOT NULL,
    "expenseCategory" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "expenseMonth" INTEGER NOT NULL,
    "expenseYear" INTEGER NOT NULL,
    "paymentStatus" TEXT,
    "paymentMethod" TEXT,
    "notes" TEXT,
    "receiptImageUrl" TEXT,
    "sharedGroupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Expense_cropId_idx" ON "Expense"("cropId");

-- CreateIndex
CREATE INDEX "Expense_expenseMonth_expenseYear_idx" ON "Expense"("expenseMonth", "expenseYear");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "Crop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

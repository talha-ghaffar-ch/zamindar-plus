ALTER TABLE "Profile" DROP COLUMN "notes";

ALTER TABLE "Zameen" DROP COLUMN "notes";

ALTER TABLE "Crop" DROP COLUMN "notes";

ALTER TABLE "Expense"
DROP COLUMN "paymentMethod",
DROP COLUMN "notes";

ALTER TABLE "Income"
DROP COLUMN "incomeType",
DROP COLUMN "notes";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dateFormat" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
ADD COLUMN     "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "preferredAreaUnit" TEXT NOT NULL DEFAULT 'Acre',
ADD COLUMN     "preferredCurrency" TEXT NOT NULL DEFAULT 'PKR',
ADD COLUMN     "preferredLanguage" TEXT NOT NULL DEFAULT 'English',
ADD COLUMN     "profileImageUrl" TEXT,
ADD COLUMN     "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "weeklyReport" BOOLEAN NOT NULL DEFAULT true;

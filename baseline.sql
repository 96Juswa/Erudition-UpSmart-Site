-- DropForeignKey
ALTER TABLE `TransactionFeeLog` DROP FOREIGN KEY `TransactionFeeLog_bookingId_fkey`;

-- DropForeignKey
ALTER TABLE `TransactionFeeLog` DROP FOREIGN KEY `TransactionFeeLog_userId_fkey`;

-- AlterTable
ALTER TABLE `CONTRACTS` ADD COLUMN `respondedAt` DATETIME(3) NULL,
    ADD COLUMN `signatureData` TEXT NULL;

-- DropTable
DROP TABLE `PlatformSetting`;

-- DropTable
DROP TABLE `TransactionFeeLog`;


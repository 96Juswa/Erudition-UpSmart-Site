-- AlterTable
ALTER TABLE `Booking` ADD COLUMN `clientAcknowledged` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `completedAt` DATETIME(0) NULL;

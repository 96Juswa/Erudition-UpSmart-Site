/*
  Warnings:

  - You are about to drop the column `conversationId` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `serviceListingId` on the `CONVERSATIONS` table. All the data in the column will be lost.
  - You are about to drop the column `serviceRequestId` on the `CONVERSATIONS` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `Booking` DROP FOREIGN KEY `Booking_conversationId_fkey`;

-- DropForeignKey
ALTER TABLE `CONVERSATIONS` DROP FOREIGN KEY `CONVERSATIONS_serviceListingId_fkey`;

-- DropForeignKey
ALTER TABLE `CONVERSATIONS` DROP FOREIGN KEY `CONVERSATIONS_serviceRequestId_fkey`;

-- DropIndex
DROP INDEX `Booking_conversationId_key` ON `Booking`;

-- DropIndex
DROP INDEX `CONVERSATIONS_serviceListingId_key` ON `CONVERSATIONS`;

-- DropIndex
DROP INDEX `CONVERSATIONS_serviceRequestId_key` ON `CONVERSATIONS`;

-- AlterTable
ALTER TABLE `Booking` DROP COLUMN `conversationId`;

-- AlterTable
ALTER TABLE `CONVERSATIONS` DROP COLUMN `serviceListingId`,
    DROP COLUMN `serviceRequestId`,
    ADD COLUMN `listingId` INTEGER NULL,
    ADD COLUMN `requestId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `CONVERSATIONS` ADD CONSTRAINT `CONVERSATIONS_listingId_fkey` FOREIGN KEY (`listingId`) REFERENCES `SERVICE_LISTINGS`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CONVERSATIONS` ADD CONSTRAINT `CONVERSATIONS_requestId_fkey` FOREIGN KEY (`requestId`) REFERENCES `SERVICE_REQUESTS`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

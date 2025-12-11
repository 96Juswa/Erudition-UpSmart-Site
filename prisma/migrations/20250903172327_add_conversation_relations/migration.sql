/*
  Warnings:

  - You are about to drop the column `listingId` on the `CONVERSATIONS` table. All the data in the column will be lost.
  - You are about to drop the column `requestId` on the `CONVERSATIONS` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[conversationId]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[conversationId]` on the table `SERVICE_REQUESTS` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `CONVERSATIONS` DROP FOREIGN KEY `CONVERSATIONS_listingId_fkey`;

-- DropForeignKey
ALTER TABLE `CONVERSATIONS` DROP FOREIGN KEY `CONVERSATIONS_requestId_fkey`;

-- DropIndex
DROP INDEX `CONVERSATIONS_listingId_fkey` ON `CONVERSATIONS`;

-- DropIndex
DROP INDEX `CONVERSATIONS_requestId_fkey` ON `CONVERSATIONS`;

-- AlterTable
ALTER TABLE `Booking` ADD COLUMN `conversationId` INTEGER NULL;

-- AlterTable
ALTER TABLE `CONVERSATIONS` DROP COLUMN `listingId`,
    DROP COLUMN `requestId`;

-- AlterTable
ALTER TABLE `SERVICE_REQUESTS` ADD COLUMN `conversationId` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Booking_conversationId_key` ON `Booking`(`conversationId`);

-- CreateIndex
CREATE UNIQUE INDEX `SERVICE_REQUESTS_conversationId_key` ON `SERVICE_REQUESTS`(`conversationId`);

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `CONVERSATIONS`(`conversationId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SERVICE_REQUESTS` ADD CONSTRAINT `SERVICE_REQUESTS_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `CONVERSATIONS`(`conversationId`) ON DELETE SET NULL ON UPDATE CASCADE;

/*
  Warnings:

  - A unique constraint covering the columns `[bookingId]` on the table `CONVERSATIONS` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `CONVERSATIONS` ADD COLUMN `bookingId` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `CONVERSATIONS_bookingId_key` ON `CONVERSATIONS`(`bookingId`);

-- AddForeignKey
ALTER TABLE `CONVERSATIONS` ADD CONSTRAINT `CONVERSATIONS_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `Booking`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

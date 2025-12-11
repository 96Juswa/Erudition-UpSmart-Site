/*
  Warnings:

  - You are about to alter the column `paymentStatus` on the `Booking` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(4))` to `Char(50)`.

*/
-- DropForeignKey
ALTER TABLE `Booking` DROP FOREIGN KEY `Booking_serviceListingId_fkey`;

-- DropIndex
DROP INDEX `Booking_serviceListingId_fkey` ON `Booking`;

-- AlterTable
ALTER TABLE `Booking` MODIFY `serviceListingId` INTEGER NULL,
    MODIFY `paymentStatus` CHAR(50) NOT NULL;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_serviceListingId_fkey` FOREIGN KEY (`serviceListingId`) REFERENCES `SERVICE_LISTINGS`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

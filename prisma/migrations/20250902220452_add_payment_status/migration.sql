/*
  Warnings:

  - You are about to alter the column `paymentStatus` on the `Booking` table. The data in that column could be lost. The data in that column will be cast from `Char(50)` to `Enum(EnumId(4))`.

*/
-- AlterTable
ALTER TABLE `Booking` MODIFY `paymentStatus` ENUM('PENDING', 'PAID', 'CANCELED') NOT NULL DEFAULT 'PENDING';

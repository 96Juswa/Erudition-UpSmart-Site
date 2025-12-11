/*
  Warnings:

  - You are about to drop the column `conversationId` on the `SERVICE_REQUESTS` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `SERVICE_REQUESTS` DROP FOREIGN KEY `SERVICE_REQUESTS_conversationId_fkey`;

-- DropIndex
DROP INDEX `SERVICE_REQUESTS_conversationId_key` ON `SERVICE_REQUESTS`;

-- AlterTable
ALTER TABLE `SERVICE_REQUESTS` DROP COLUMN `conversationId`;

-- AddForeignKey
ALTER TABLE `CONVERSATIONS` ADD CONSTRAINT `CONVERSATIONS_serviceRequestId_fkey` FOREIGN KEY (`serviceRequestId`) REFERENCES `SERVICE_REQUESTS`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

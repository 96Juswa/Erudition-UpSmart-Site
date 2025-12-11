/*
  Warnings:

  - A unique constraint covering the columns `[serviceListingId]` on the table `CONVERSATIONS` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[serviceRequestId]` on the table `CONVERSATIONS` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `CONVERSATIONS` ADD COLUMN `serviceListingId` INTEGER NULL,
    ADD COLUMN `serviceRequestId` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `CONVERSATIONS_serviceListingId_key` ON `CONVERSATIONS`(`serviceListingId`);

-- CreateIndex
CREATE UNIQUE INDEX `CONVERSATIONS_serviceRequestId_key` ON `CONVERSATIONS`(`serviceRequestId`);

-- AddForeignKey
ALTER TABLE `CONVERSATIONS` ADD CONSTRAINT `CONVERSATIONS_serviceListingId_fkey` FOREIGN KEY (`serviceListingId`) REFERENCES `SERVICE_LISTINGS`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

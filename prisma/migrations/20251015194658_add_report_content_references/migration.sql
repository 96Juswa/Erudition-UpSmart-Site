-- AlterTable
ALTER TABLE `REPORTS` ADD COLUMN `serviceListingId` INTEGER NULL,
    ADD COLUMN `serviceRequestId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `REPORTS_serviceListingId_idx` ON `REPORTS`(`serviceListingId`);

-- CreateIndex
CREATE INDEX `REPORTS_serviceRequestId_idx` ON `REPORTS`(`serviceRequestId`);

-- AddForeignKey
ALTER TABLE `REPORTS` ADD CONSTRAINT `REPORTS_serviceListingId_fkey` FOREIGN KEY (`serviceListingId`) REFERENCES `SERVICE_LISTINGS`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `REPORTS` ADD CONSTRAINT `REPORTS_serviceRequestId_fkey` FOREIGN KEY (`serviceRequestId`) REFERENCES `SERVICE_REQUESTS`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

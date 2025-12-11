/*
  Warnings:

  - You are about to alter the column `status` on the `REPORTS` table. The data in that column could be lost. The data in that column will be cast from `Char(50)` to `Enum(EnumId(6))`.

*/
-- AlterTable
ALTER TABLE `REPORTS` ADD COLUMN `resolvedAt` DATETIME(3) NULL,
    ADD COLUMN `reviewedAt` DATETIME(3) NULL,
    MODIFY `reportDate` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    MODIFY `status` ENUM('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED') NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX `CONTENT_FLAGS_reportId_idx` ON `CONTENT_FLAGS`(`reportId`);

-- CreateIndex
CREATE INDEX `REPORTS_status_idx` ON `REPORTS`(`status`);

-- AddForeignKey
ALTER TABLE `CONTENT_FLAGS` ADD CONSTRAINT `CONTENT_FLAGS_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `REPORTS`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `CONTENT_FLAGS` RENAME INDEX `CONTENT_FLAGS_reviewedBy_fkey` TO `CONTENT_FLAGS_reviewedBy_idx`;

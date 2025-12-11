/*
  Warnings:

  - Added the required column `text` to the `CONTRACTS` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `CONTRACTS` ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    ADD COLUMN `text` TEXT NOT NULL;

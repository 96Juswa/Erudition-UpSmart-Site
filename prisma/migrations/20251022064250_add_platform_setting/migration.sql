-- CreateTable
CREATE TABLE `PlatformSetting` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `transactionFeeOn` BOOLEAN NOT NULL DEFAULT false,
    `feePercentage` DOUBLE NOT NULL DEFAULT 3.0,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

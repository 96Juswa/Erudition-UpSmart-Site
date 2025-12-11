-- CreateTable
CREATE TABLE `TransactionFeeLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bookingId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `feeAmount` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TransactionFeeLog_bookingId_idx`(`bookingId`),
    INDEX `TransactionFeeLog_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TransactionFeeLog` ADD CONSTRAINT `TransactionFeeLog_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `Booking`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransactionFeeLog` ADD CONSTRAINT `TransactionFeeLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `USERS`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

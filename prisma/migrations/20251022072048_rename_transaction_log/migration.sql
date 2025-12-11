/*
  Warnings:

  - You are about to drop the `transactionfeelog` table. If the table is not empty, all the data it contains will be lost.

*/

/*
-- DropForeignKey
ALTER TABLE `transactionfeelog` DROP FOREIGN KEY `TransactionFeeLog_bookingId_fkey`;

-- DropForeignKey
ALTER TABLE `transactionfeelog` DROP FOREIGN KEY `TransactionFeeLog_userId_fkey`;

-- DropTable
DROP TABLE `transactionfeelog`;
*/
-- CreateTable
CREATE TABLE `TRANSACTION_FEE_LOG` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bookingId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `feeAmount` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TRANSACTION_FEE_LOG_bookingId_idx`(`bookingId`),
    INDEX `TRANSACTION_FEE_LOG_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TRANSACTION_FEE_LOG` ADD CONSTRAINT `TRANSACTION_FEE_LOG_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `Booking`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TRANSACTION_FEE_LOG` ADD CONSTRAINT `TRANSACTION_FEE_LOG_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `USERS`(`userId`) ON DELETE RESTRICT ON UPDATE CASCADE;

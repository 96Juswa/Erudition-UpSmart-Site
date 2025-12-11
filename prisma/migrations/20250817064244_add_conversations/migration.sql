-- AlterTable
ALTER TABLE `MESSAGES` ADD COLUMN `conversationId` INTEGER NULL;

-- CreateTable
CREATE TABLE `CONVERSATIONS` (
    `conversationId` INTEGER NOT NULL AUTO_INCREMENT,
    `listingId` INTEGER NULL,
    `requestId` INTEGER NULL,
    `initiatedById` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`conversationId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ConversationParticipants` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ConversationParticipants_AB_unique`(`A`, `B`),
    INDEX `_ConversationParticipants_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `MESSAGES` ADD CONSTRAINT `MESSAGES_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `CONVERSATIONS`(`conversationId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ConversationParticipants` ADD CONSTRAINT `_ConversationParticipants_A_fkey` FOREIGN KEY (`A`) REFERENCES `CONVERSATIONS`(`conversationId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ConversationParticipants` ADD CONSTRAINT `_ConversationParticipants_B_fkey` FOREIGN KEY (`B`) REFERENCES `USERS`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE;

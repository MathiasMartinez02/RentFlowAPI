-- AlterTable
ALTER TABLE `notifications` MODIFY `tipo` ENUM('PAYMENT', 'CONTRACT', 'MAINTENANCE', 'LEAD', 'SYSTEM') NOT NULL DEFAULT 'SYSTEM';

-- AlterTable
ALTER TABLE `properties` ADD COLUMN `publicado` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `publicadoEn` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `leads` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NOT NULL,
    `mensaje` TEXT NULL,
    `origen` ENUM('WEB', 'WHATSAPP', 'PORTAL', 'REFERIDO', 'OTRO') NOT NULL DEFAULT 'WEB',
    `estado` ENUM('NUEVO', 'CONTACTADO', 'VISITA_AGENDADA', 'VISITA_REALIZADA', 'NEGOCIACION', 'GANADO', 'PERDIDO') NOT NULL DEFAULT 'NUEVO',
    `fechaVisita` DATETIME(3) NULL,
    `visitaConfirmada` BOOLEAN NOT NULL DEFAULT false,
    `notas` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `ownerId` VARCHAR(191) NOT NULL,
    `propertyId` VARCHAR(191) NULL,
    `vendedorId` VARCHAR(191) NULL,

    INDEX `leads_ownerId_idx`(`ownerId`),
    INDEX `leads_estado_idx`(`estado`),
    INDEX `leads_propertyId_idx`(`propertyId`),
    INDEX `leads_vendedorId_idx`(`vendedorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `properties_publicado_idx` ON `properties`(`publicado`);

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leads` ADD CONSTRAINT `leads_vendedorId_fkey` FOREIGN KEY (`vendedorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

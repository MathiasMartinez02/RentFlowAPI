-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `apellido` VARCHAR(191) NOT NULL,
    `empresa` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `avatar` VARCHAR(191) NULL,
    `role` ENUM('SUPER_ADMIN', 'ADMIN', 'FINANZAS', 'VENDEDOR', 'MANTENIMIENTO', 'CLIENTE', 'INQUILINO') NOT NULL DEFAULT 'CLIENTE',
    `organizationId` VARCHAR(191) NULL,
    `linkedTenantId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `ultimoLogin` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_linkedTenantId_key`(`linkedTenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `hashedToken` CHAR(64) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `revoked` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `refresh_tokens_hashedToken_key`(`hashedToken`),
    INDEX `refresh_tokens_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `properties` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` TEXT NULL,
    `direccion` VARCHAR(191) NOT NULL,
    `ciudad` VARCHAR(191) NOT NULL,
    `provincia` VARCHAR(191) NOT NULL,
    `codigoPostal` VARCHAR(191) NOT NULL,
    `pais` VARCHAR(191) NOT NULL DEFAULT 'Argentina',
    `tipoPropiedad` ENUM('APARTAMENTO', 'DUPLEX', 'CASA', 'OFICINA', 'LOCAL') NOT NULL DEFAULT 'APARTAMENTO',
    `estado` ENUM('DISPONIBLE', 'OCUPADA', 'MANTENIMIENTO') NOT NULL DEFAULT 'DISPONIBLE',
    `precioMensual` DECIMAL(10, 2) NOT NULL,
    `expensas` DECIMAL(10, 2) NULL,
    `habitaciones` INTEGER NOT NULL DEFAULT 1,
    `banos` INTEGER NOT NULL DEFAULT 1,
    `metrosCuadrados` DOUBLE NOT NULL,
    `imagenPrincipal` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `ownerId` VARCHAR(191) NOT NULL,

    INDEX `properties_ownerId_idx`(`ownerId`),
    INDEX `properties_estado_idx`(`estado`),
    INDEX `properties_ciudad_idx`(`ciudad`),
    INDEX `properties_tipoPropiedad_idx`(`tipoPropiedad`),
    INDEX `properties_precioMensual_idx`(`precioMensual`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tenants` (
    `id` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `apellido` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NOT NULL,
    `dni` VARCHAR(191) NOT NULL,
    `fechaNacimiento` DATETIME(3) NULL,
    `direccion` VARCHAR(191) NULL,
    `estado` ENUM('ACTIVO', 'MOROSO', 'INACTIVO', 'PENDIENTE') NOT NULL DEFAULT 'PENDIENTE',
    `observaciones` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `ownerId` VARCHAR(191) NOT NULL,
    `propertyId` VARCHAR(191) NULL,

    INDEX `tenants_ownerId_idx`(`ownerId`),
    INDEX `tenants_estado_idx`(`estado`),
    INDEX `tenants_propertyId_idx`(`propertyId`),
    UNIQUE INDEX `tenants_email_ownerId_key`(`email`, `ownerId`),
    UNIQUE INDEX `tenants_dni_ownerId_key`(`dni`, `ownerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contracts` (
    `id` VARCHAR(191) NOT NULL,
    `codigoContrato` VARCHAR(191) NOT NULL,
    `fechaInicio` DATETIME(3) NOT NULL,
    `fechaFin` DATETIME(3) NOT NULL,
    `montoMensual` DECIMAL(10, 2) NOT NULL,
    `deposito` DECIMAL(10, 2) NOT NULL,
    `expensas` DECIMAL(10, 2) NULL,
    `renovacionAutomatica` BOOLEAN NOT NULL DEFAULT false,
    `estado` ENUM('ACTIVO', 'PROXIMO_A_VENCER', 'VENCIDO', 'CANCELADO', 'RENOVADO') NOT NULL DEFAULT 'ACTIVO',
    `observaciones` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `ownerId` VARCHAR(191) NOT NULL,
    `propertyId` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `contracts_codigoContrato_key`(`codigoContrato`),
    INDEX `contracts_ownerId_idx`(`ownerId`),
    INDEX `contracts_propertyId_idx`(`propertyId`),
    INDEX `contracts_tenantId_idx`(`tenantId`),
    INDEX `contracts_estado_idx`(`estado`),
    INDEX `contracts_fechaFin_idx`(`fechaFin`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` VARCHAR(191) NOT NULL,
    `periodo` VARCHAR(191) NOT NULL,
    `fechaVencimiento` DATETIME(3) NOT NULL,
    `fechaPago` DATETIME(3) NULL,
    `monto` DECIMAL(10, 2) NOT NULL,
    `mora` DECIMAL(10, 2) NULL,
    `totalPagado` DECIMAL(10, 2) NULL,
    `metodoPago` ENUM('TRANSFERENCIA', 'EFECTIVO', 'TARJETA', 'DEBITO_AUTOMATICO') NULL,
    `referenciaPago` VARCHAR(191) NULL,
    `estado` ENUM('PENDIENTE', 'PAGADO', 'VENCIDO', 'PARCIAL', 'CANCELADO') NOT NULL DEFAULT 'PENDIENTE',
    `observaciones` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `contractId` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `propertyId` VARCHAR(191) NOT NULL,
    `ownerId` VARCHAR(191) NOT NULL,

    INDEX `payments_ownerId_idx`(`ownerId`),
    INDEX `payments_contractId_idx`(`contractId`),
    INDEX `payments_tenantId_idx`(`tenantId`),
    INDEX `payments_propertyId_idx`(`propertyId`),
    INDEX `payments_estado_idx`(`estado`),
    INDEX `payments_fechaVencimiento_idx`(`fechaVencimiento`),
    UNIQUE INDEX `payments_contractId_periodo_key`(`contractId`, `periodo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `maintenance_tickets` (
    `id` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `descripcion` TEXT NOT NULL,
    `categoria` ENUM('PLOMERIA', 'ELECTRICIDAD', 'PINTURA', 'LIMPIEZA', 'SEGURIDAD', 'GENERAL') NOT NULL DEFAULT 'GENERAL',
    `prioridad` ENUM('BAJA', 'MEDIA', 'ALTA', 'URGENTE') NOT NULL DEFAULT 'MEDIA',
    `estado` ENUM('PENDIENTE', 'EN_PROGRESO', 'ESPERANDO_REPUESTOS', 'RESUELTO', 'CERRADO') NOT NULL DEFAULT 'PENDIENTE',
    `costoEstimado` DECIMAL(10, 2) NULL,
    `costoFinal` DECIMAL(10, 2) NULL,
    `fechaResolucion` DATETIME(3) NULL,
    `assignedTo` VARCHAR(191) NULL,
    `observaciones` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `ownerId` VARCHAR(191) NOT NULL,
    `propertyId` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NULL,

    INDEX `maintenance_tickets_ownerId_idx`(`ownerId`),
    INDEX `maintenance_tickets_propertyId_idx`(`propertyId`),
    INDEX `maintenance_tickets_tenantId_idx`(`tenantId`),
    INDEX `maintenance_tickets_estado_idx`(`estado`),
    INDEX `maintenance_tickets_prioridad_idx`(`prioridad`),
    INDEX `maintenance_tickets_categoria_idx`(`categoria`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `property_images` (
    `id` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `size` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `propertyId` VARCHAR(191) NOT NULL,

    INDEX `property_images_propertyId_idx`(`propertyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `mensaje` TEXT NOT NULL,
    `tipo` ENUM('PAYMENT', 'CONTRACT', 'MAINTENANCE', 'SYSTEM') NOT NULL DEFAULT 'SYSTEM',
    `prioridad` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
    `leida` BOOLEAN NOT NULL DEFAULT false,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` VARCHAR(191) NOT NULL,

    INDEX `notifications_userId_idx`(`userId`),
    INDEX `notifications_leida_idx`(`leida`),
    INDEX `notifications_tipo_idx`(`tipo`),
    INDEX `notifications_prioridad_idx`(`prioridad`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity_logs` (
    `id` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `userId` VARCHAR(191) NOT NULL,

    INDEX `activity_logs_userId_idx`(`userId`),
    INDEX `activity_logs_entityType_idx`(`entityType`),
    INDEX `activity_logs_action_idx`(`action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_linkedTenantId_fkey` FOREIGN KEY (`linkedTenantId`) REFERENCES `tenants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `properties` ADD CONSTRAINT `properties_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tenants` ADD CONSTRAINT `tenants_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tenants` ADD CONSTRAINT `tenants_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_contractId_fkey` FOREIGN KEY (`contractId`) REFERENCES `contracts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `maintenance_tickets` ADD CONSTRAINT `maintenance_tickets_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `maintenance_tickets` ADD CONSTRAINT `maintenance_tickets_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `maintenance_tickets` ADD CONSTRAINT `maintenance_tickets_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `property_images` ADD CONSTRAINT `property_images_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `properties`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

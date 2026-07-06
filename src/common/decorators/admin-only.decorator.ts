import { applyDecorators } from '@nestjs/common';
import { ApiForbiddenResponse } from '@nestjs/swagger';
import { Role } from '../enums/role.enum';
import { Roles } from './roles.decorator';

export const AdminOnly = () =>
  applyDecorators(
    Roles(Role.ADMIN, Role.SUPER_ADMIN),
    ApiForbiddenResponse({ description: 'Forbidden — requires ADMIN or SUPER_ADMIN role' }),
  );

export const CanManageProperties = () =>
  applyDecorators(
    Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CLIENTE),
    ApiForbiddenResponse({
      description: 'Forbidden — requires ADMIN, SUPER_ADMIN or CLIENTE role',
    }),
  );

export const CanManageTenants = () =>
  applyDecorators(
    Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CLIENTE, Role.VENDEDOR),
    ApiForbiddenResponse({
      description: 'Forbidden — requires ADMIN, SUPER_ADMIN, CLIENTE or VENDEDOR role',
    }),
  );

export const CanManageContracts = () =>
  applyDecorators(
    Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CLIENTE, Role.VENDEDOR),
    ApiForbiddenResponse({
      description: 'Forbidden — requires ADMIN, SUPER_ADMIN, CLIENTE or VENDEDOR role',
    }),
  );

export const CanManagePayments = () =>
  applyDecorators(
    Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CLIENTE, Role.FINANZAS),
    ApiForbiddenResponse({
      description: 'Forbidden — requires ADMIN, SUPER_ADMIN, CLIENTE or FINANZAS role',
    }),
  );

export const CanManageMaintenance = () =>
  applyDecorators(
    Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CLIENTE, Role.MANTENIMIENTO),
    ApiForbiddenResponse({
      description: 'Forbidden — requires ADMIN, SUPER_ADMIN, CLIENTE or MANTENIMIENTO role',
    }),
  );

export const CanManageLeads = () =>
  applyDecorators(
    Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CLIENTE, Role.VENDEDOR),
    ApiForbiddenResponse({
      description: 'Forbidden — requires ADMIN, SUPER_ADMIN, CLIENTE or VENDEDOR role',
    }),
  );

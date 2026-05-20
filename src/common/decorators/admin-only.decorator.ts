import { applyDecorators } from '@nestjs/common';
import { ApiForbiddenResponse } from '@nestjs/swagger';
import { Role } from '../enums/role.enum';
import { Roles } from './roles.decorator';

/**
 * Shorthand for @Roles(Role.ADMIN) + Swagger forbidden response.
 * Usage: @AdminOnly()
 */
export const AdminOnly = () =>
  applyDecorators(
    Roles(Role.ADMIN),
    ApiForbiddenResponse({ description: 'Forbidden — requires ADMIN role' }),
  );

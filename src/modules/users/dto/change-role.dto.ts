import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Role } from '../../../common/enums/role.enum';

export class ChangeRoleDto {
  @ApiProperty({ enum: Role, description: 'Nuevo rol del usuario' })
  @IsEnum(Role)
  role: Role;

  @ApiPropertyOptional({
    description: 'ID del ADMIN al que pertenece este usuario (requerido para FINANZAS, VENDEDOR, MANTENIMIENTO)',
  })
  @IsOptional()
  @IsString()
  organizationId?: string;

  @ApiPropertyOptional({
    description: 'ID del Tenant vinculado (requerido para INQUILINO)',
  })
  @IsOptional()
  @IsString()
  linkedTenantId?: string;
}

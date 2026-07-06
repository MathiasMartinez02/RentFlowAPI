import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TenantStatus } from '../../../common/enums/tenant.enum';

export class TenantEntity {
  @ApiProperty({ example: 'clxyz123abc' })
  id: string;

  @ApiProperty({ example: 'Juan' })
  nombre: string;

  @ApiProperty({ example: 'García' })
  apellido: string;

  @ApiProperty({ example: 'juan.garcia@email.com' })
  email: string;

  @ApiProperty({ example: '+54 11 9876-5432' })
  telefono: string;

  @ApiProperty({ example: '30123456' })
  dni: string;

  @ApiPropertyOptional({ example: '1990-05-15T00:00:00.000Z', nullable: true })
  fechaNacimiento: Date | null;

  @ApiPropertyOptional({ example: 'Av. Corrientes 1234, Buenos Aires', nullable: true })
  direccion: string | null;

  @ApiProperty({ enum: TenantStatus, example: TenantStatus.ACTIVO })
  estado: TenantStatus;

  @ApiPropertyOptional({
    example: 'Buen pagador, empleado en relación de dependencia.',
    nullable: true,
  })
  observaciones: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 'clxyz_owner_id' })
  ownerId: string;

  @ApiPropertyOptional({ example: 'clxyz_property_id', nullable: true })
  propertyId: string | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-03-15T10:30:00.000Z' })
  updatedAt: Date;
}

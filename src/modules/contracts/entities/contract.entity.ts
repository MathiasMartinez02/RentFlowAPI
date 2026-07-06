import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContractStatus } from '../../../common/enums/contract.enum';
import { PropertyStatus } from '../../../common/enums/property.enum';
import { TenantStatus } from '../../../common/enums/tenant.enum';

class NestedPropertyDto {
  @ApiProperty({ example: 'clxyz_property_id' }) id: string;
  @ApiProperty({ example: 'Departamento en Palermo' }) nombre: string;
  @ApiProperty({ example: 'Av. Santa Fe 3250' }) direccion: string;
  @ApiProperty({ example: 'Buenos Aires' }) ciudad: string;
  @ApiProperty({ enum: PropertyStatus }) estado: PropertyStatus;
}

class NestedTenantDto {
  @ApiProperty({ example: 'clxyz_tenant_id' }) id: string;
  @ApiProperty({ example: 'Juan' }) nombre: string;
  @ApiProperty({ example: 'García' }) apellido: string;
  @ApiProperty({ example: 'juan.garcia@email.com' }) email: string;
  @ApiProperty({ example: '+54 11 9876-5432' }) telefono: string;
  @ApiProperty({ enum: TenantStatus }) estado: TenantStatus;
}

class ContractCountsDto {
  @ApiProperty({ example: 12 }) payments: number;
}

export class ContractEntity {
  @ApiProperty({ example: 'clxyz123abc' })
  id: string;

  @ApiProperty({ example: 'CTR-2024-K7MNP' })
  codigoContrato: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  fechaInicio: Date;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  fechaFin: Date;

  @ApiProperty({ example: 180000, description: 'Monto mensual en ARS' })
  montoMensual: number;

  @ApiProperty({ example: 360000, description: 'Depósito en ARS' })
  deposito: number;

  @ApiPropertyOptional({ example: 15000, description: 'Expensas mensuales en ARS', nullable: true })
  expensas: number | null;

  @ApiProperty({ example: false })
  renovacionAutomatica: boolean;

  @ApiProperty({ enum: ContractStatus, example: ContractStatus.ACTIVO })
  estado: ContractStatus;

  @ApiPropertyOptional({
    example: 'Contrato bajo ley 23.091. Ajuste semestral por IPC.',
    nullable: true,
  })
  observaciones: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 'clxyz_owner_id' })
  ownerId: string;

  @ApiProperty({ example: 'clxyz_property_id' })
  propertyId: string;

  @ApiProperty({ example: 'clxyz_tenant_id' })
  tenantId: string;

  @ApiPropertyOptional({ type: NestedPropertyDto })
  property?: NestedPropertyDto;

  @ApiPropertyOptional({ type: NestedTenantDto })
  tenant?: NestedTenantDto;

  @ApiPropertyOptional({ type: ContractCountsDto })
  _count?: ContractCountsDto;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-03-15T10:30:00.000Z' })
  updatedAt: Date;
}

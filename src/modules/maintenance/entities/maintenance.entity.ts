import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  MaintenanceCategory,
  MaintenancePriority,
  MaintenanceStatus,
} from '../../../common/enums/maintenance.enum';

export class MaintenanceEntity {
  @ApiProperty() id: string;
  @ApiProperty() titulo: string;
  @ApiProperty() descripcion: string;
  @ApiProperty({ enum: MaintenanceCategory }) categoria: MaintenanceCategory;
  @ApiProperty({ enum: MaintenancePriority }) prioridad: MaintenancePriority;
  @ApiProperty({ enum: MaintenanceStatus }) estado: MaintenanceStatus;
  @ApiPropertyOptional() costoEstimado: number | null;
  @ApiPropertyOptional() costoFinal: number | null;
  @ApiPropertyOptional() fechaResolucion: Date | null;
  @ApiPropertyOptional() assignedTo: string | null;
  @ApiPropertyOptional() observaciones: string | null;
  @ApiProperty() isActive: boolean;
  @ApiProperty() ownerId: string;
  @ApiProperty() propertyId: string;
  @ApiPropertyOptional() tenantId: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

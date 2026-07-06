import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeadOrigin, LeadStatus } from '../../../common/enums/lead.enum';

export class LeadEntity {
  @ApiProperty() id: string;
  @ApiProperty() nombre: string;
  @ApiProperty() email: string;
  @ApiProperty() telefono: string;
  @ApiPropertyOptional() mensaje: string | null;
  @ApiProperty({ enum: LeadOrigin }) origen: LeadOrigin;
  @ApiProperty({ enum: LeadStatus }) estado: LeadStatus;
  @ApiPropertyOptional() propertyId: string | null;
  @ApiPropertyOptional() vendedorId: string | null;
  @ApiPropertyOptional() fechaVisita: Date | null;
  @ApiProperty() visitaConfirmada: boolean;
  @ApiPropertyOptional() notas: string | null;
  @ApiProperty() isActive: boolean;
  @ApiProperty() ownerId: string;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

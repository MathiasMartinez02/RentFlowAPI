import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { LeadOrigin, LeadStatus } from '../../../common/enums/lead.enum';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export enum SortByLead {
  CREATED_AT = 'createdAt',
  ESTADO = 'estado',
  FECHA_VISITA = 'fechaVisita',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class QueryLeadsDto extends PaginationDto {
  @ApiPropertyOptional({ enum: LeadStatus })
  @IsOptional()
  @IsEnum(LeadStatus)
  estado?: LeadStatus;

  @ApiPropertyOptional({ enum: LeadOrigin })
  @IsOptional()
  @IsEnum(LeadOrigin)
  origen?: LeadOrigin;

  @ApiPropertyOptional({ example: 'property-id-here' })
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiPropertyOptional({ example: 'user-id-here' })
  @IsOptional()
  @IsString()
  vendedorId?: string;

  @ApiPropertyOptional({ example: 'juan perez' })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => value?.trim())
  search?: string;

  @ApiPropertyOptional({ enum: SortByLead, default: SortByLead.CREATED_AT })
  @IsOptional()
  @IsEnum(SortByLead)
  sortBy?: SortByLead;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;
}

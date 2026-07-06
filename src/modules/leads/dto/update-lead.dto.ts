import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { LeadStatus } from '../../../common/enums/lead.enum';
import { CreateLeadDto } from './create-lead.dto';

export class UpdateLeadDto extends PartialType(CreateLeadDto) {
  @ApiPropertyOptional({ enum: LeadStatus })
  @IsOptional()
  @IsEnum(LeadStatus)
  estado?: LeadStatus;

  @ApiPropertyOptional({ example: 'clxyz_user_id', description: 'Vendedor asignado' })
  @IsOptional()
  @IsString()
  vendedorId?: string;

  @ApiPropertyOptional({ example: '2026-07-10T15:00:00Z' })
  @IsOptional()
  @IsDateString()
  fechaVisita?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  visitaConfirmada?: boolean;

  @ApiPropertyOptional({ example: 'Pidió tiempo para pensarlo, volver a contactar en una semana.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @Transform(({ value }: { value: string }) => value?.trim())
  notas?: string;
}

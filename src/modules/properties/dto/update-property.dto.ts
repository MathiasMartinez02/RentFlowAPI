import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { PropertyStatus } from '../../../common/enums/property.enum';
import { CreatePropertyDto } from './create-property.dto';

export class UpdatePropertyDto extends PartialType(CreatePropertyDto) {
  @ApiPropertyOptional({
    enum: PropertyStatus,
    description: 'Cambiar el estado de la propiedad',
  })
  @IsOptional()
  @IsEnum(PropertyStatus)
  estado?: PropertyStatus;

  @ApiPropertyOptional({
    description: 'Publicar/despublicar la propiedad en el sitio público (sin login)',
  })
  @IsOptional()
  @IsBoolean()
  publicado?: boolean;
}

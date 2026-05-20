import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
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
}

import { ApiProperty } from '@nestjs/swagger';
import { PropertyEntity } from '../entities/property.entity';

export class PropertyResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Propiedad creada correctamente' })
  message: string;

  @ApiProperty({ type: PropertyEntity })
  data: PropertyEntity;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;
}

class PaginatedPropertiesDataDto {
  @ApiProperty({ type: [PropertyEntity] })
  items: PropertyEntity[];

  @ApiProperty({ example: 24 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

export class PaginatedPropertiesResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Propiedades recuperadas correctamente' })
  message: string;

  @ApiProperty({ type: PaginatedPropertiesDataDto })
  data: PaginatedPropertiesDataDto;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PropertyStatus, PropertyType } from '../../../common/enums/property.enum';

export class PropertyEntity {
  @ApiProperty({ example: 'clxyz123abc' })
  id: string;

  @ApiProperty({ example: 'Departamento en Palermo' })
  nombre: string;

  @ApiPropertyOptional({ example: 'Luminoso 2 ambientes con balcón y amenities.' })
  descripcion: string | null;

  @ApiProperty({ example: 'Av. Santa Fe 3250 Piso 4 B' })
  direccion: string;

  @ApiProperty({ example: 'Buenos Aires' })
  ciudad: string;

  @ApiProperty({ example: 'CABA' })
  provincia: string;

  @ApiProperty({ example: 'C1425BHH' })
  codigoPostal: string;

  @ApiProperty({ example: 'Argentina' })
  pais: string;

  @ApiProperty({ enum: PropertyType, example: PropertyType.APARTAMENTO })
  tipoPropiedad: PropertyType;

  @ApiProperty({ enum: PropertyStatus, example: PropertyStatus.DISPONIBLE })
  estado: PropertyStatus;

  @ApiProperty({ example: 180000, description: 'Precio mensual en ARS' })
  precioMensual: number;

  @ApiPropertyOptional({ example: 15000, description: 'Expensas mensuales en ARS', nullable: true })
  expensas: number | null;

  @ApiProperty({ example: 2, description: 'Número de habitaciones' })
  habitaciones: number;

  @ApiProperty({ example: 1, description: 'Número de baños' })
  banos: number;

  @ApiProperty({ example: 65.5, description: 'Superficie en m²' })
  metrosCuadrados: number;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/prop-1.jpg', nullable: true })
  imagenPrincipal: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 'clxyz_owner_id' })
  ownerId: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-03-15T10:30:00.000Z' })
  updatedAt: Date;
}

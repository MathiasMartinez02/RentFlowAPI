import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../../common/enums/role.enum';

/**
 * Swagger entity — mirrors the User model without the password field.
 * Used as the `type` in @ApiResponse decorators.
 */
export class UserEntity {
  @ApiProperty({ example: 'clxyz123abc456' })
  id: string;

  @ApiProperty({ example: 'juan.perez@email.com' })
  email: string;

  @ApiProperty({ example: 'Juan' })
  nombre: string;

  @ApiProperty({ example: 'Pérez' })
  apellido: string;

  @ApiPropertyOptional({ example: 'Grupo Tagle S.A.' })
  empresa: string | null;

  @ApiPropertyOptional({ example: '+54 11 1234-5678' })
  phone: string | null;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatars/user.jpg' })
  avatar: string | null;

  @ApiProperty({ enum: Role, example: Role.ADMIN })
  role: Role;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiPropertyOptional({ example: '2024-03-15T10:30:00.000Z', nullable: true })
  ultimoLogin: Date | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-03-15T10:30:00.000Z' })
  updatedAt: Date;
}

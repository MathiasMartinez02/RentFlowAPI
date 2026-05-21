import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Role } from '../../../common/enums/role.enum';

export class RegisterDto {
  @ApiProperty({ example: 'Juan' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  nombre: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Transform(({ value }) => value?.trim())
  apellido: string;

  @ApiProperty({ example: 'juan.perez@email.com' })
  @IsEmail()
  @MaxLength(100)
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Min 8 chars. Must include uppercase, lowercase, number and special character.',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/, {
    message:
      'Password must contain uppercase, lowercase, number and special character (!@#$%...)',
  })
  password: string;

  @ApiPropertyOptional({ example: 'Grupo Tagle S.A.' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  empresa?: string;

  @ApiPropertyOptional({ enum: Role, default: Role.CLIENTE })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

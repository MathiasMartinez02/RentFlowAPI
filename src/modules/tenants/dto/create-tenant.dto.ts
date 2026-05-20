import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNumber, IsOptional, IsPositive, IsString, MinLength } from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({ example: 'tenant@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Jane' })
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiProperty({ example: 'Smith' })
  @IsString()
  @MinLength(2)
  lastName: string;

  @ApiProperty({ example: '+54 11 9876-5432' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '30123456', description: 'National ID number' })
  @IsString()
  dni: string;

  @ApiPropertyOptional({ example: 'Software Engineer' })
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiPropertyOptional({ example: 200000, description: 'Monthly income in ARS' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  monthlyIncome?: number;

  @ApiPropertyOptional({ example: '+54 11 1111-2222' })
  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

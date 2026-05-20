import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ example: 'contract-id-here' })
  @IsString()
  contractId: string;

  @ApiProperty({ example: 150000 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ example: '2024-02-01' })
  @IsDate()
  @Type(() => Date)
  dueDate: Date;

  @ApiPropertyOptional({ example: '2024-01-30' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  paidDate?: Date;

  @ApiPropertyOptional({ example: 'bank_transfer', enum: ['cash', 'bank_transfer', 'card'] })
  @IsOptional()
  @IsString()
  method?: string;

  @ApiPropertyOptional({ example: 'TRF-123456' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

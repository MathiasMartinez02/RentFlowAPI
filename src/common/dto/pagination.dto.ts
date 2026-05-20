import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Max } from 'class-validator';

export class PaginationDto {
  @ApiPropertyOptional({ minimum: 1, default: 1, description: 'Page number' })
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 10, description: 'Items per page' })
  @IsOptional()
  @IsPositive()
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;
}

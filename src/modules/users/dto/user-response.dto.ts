import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '../entities/user.entity';

export class UserResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Operation successful' })
  message: string;

  @ApiProperty({ type: UserEntity })
  data: UserEntity;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;
}

class PaginatedUsersDataDto {
  @ApiProperty({ type: [UserEntity] })
  items: UserEntity[];

  @ApiProperty({ example: 42, description: 'Total number of users matching the filter' })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}

export class PaginatedUsersResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Users retrieved successfully' })
  message: string;

  @ApiProperty({ type: PaginatedUsersDataDto })
  data: PaginatedUsersDataDto;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;
}

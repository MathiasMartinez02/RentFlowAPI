import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AdminOnly } from '../../common/decorators/admin-only.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FilterUsersDto } from './dto/filter-users.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PaginatedUsersResponseDto, UserResponseDto } from './dto/user-response.dto';
import { UserEntity } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
@ApiExtraModels(UserEntity)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─────────────────────────────────────────────────────────────
  // GET /users/me  — Any authenticated user
  // ─────────────────────────────────────────────────────────────
  @Get('me')
  @ApiOperation({
    summary: 'Get my profile',
    description: 'Returns the profile of the currently authenticated user.',
  })
  @ApiOkResponse({ type: UserResponseDto })
  getProfile(@CurrentUser() user: any) {
    return { message: 'Profile retrieved successfully', data: user };
  }

  // ─────────────────────────────────────────────────────────────
  // PATCH /users/me  — Any authenticated user
  // ─────────────────────────────────────────────────────────────
  @Patch('me')
  @ApiOperation({
    summary: 'Update my profile',
    description: 'Updates nombre, apellido, empresa, phone or avatar. Email and role cannot be changed here.',
  })
  @ApiOkResponse({ type: UserResponseDto })
  updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  // ─────────────────────────────────────────────────────────────
  // GET /users  — ADMIN only
  // ─────────────────────────────────────────────────────────────
  @Get()
  @AdminOnly()
  @ApiOperation({
    summary: 'List all users [ADMIN]',
    description: 'Paginated list with optional filters: role, isActive, search (nombre/apellido/email).',
  })
  @ApiOkResponse({ type: PaginatedUsersResponseDto })
  findAll(@Query() filters: FilterUsersDto) {
    return this.usersService.findAll(filters);
  }

  // ─────────────────────────────────────────────────────────────
  // GET /users/:id  — ADMIN only
  // ─────────────────────────────────────────────────────────────
  @Get(':id')
  @AdminOnly()
  @ApiOperation({ summary: 'Get user by ID [ADMIN]' })
  @ApiParam({ name: 'id', description: 'User CUID', example: 'clxyz123abc456' })
  @ApiOkResponse({ type: UserResponseDto })
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id).then((user) => ({
      message: 'User retrieved successfully',
      data: user,
    }));
  }

  // ─────────────────────────────────────────────────────────────
  // DELETE /users/:id/deactivate  — ADMIN only
  // ─────────────────────────────────────────────────────────────
  @Delete(':id/deactivate')
  @AdminOnly()
  @ApiOperation({
    summary: 'Deactivate user [ADMIN]',
    description: 'Soft delete — sets isActive to false. The user cannot log in afterwards.',
  })
  @ApiParam({ name: 'id', description: 'User CUID' })
  @ApiOkResponse({ description: 'User deactivated successfully' })
  deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }
}

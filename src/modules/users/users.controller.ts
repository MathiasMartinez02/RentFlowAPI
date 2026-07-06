import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Role } from '../../common/enums/role.enum';
import { FilterUsersDto } from './dto/filter-users.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { PaginatedUsersResponseDto, UserResponseDto } from './dto/user-response.dto';
import { UserEntity } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiTags('Usuarios')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
@ApiExtraModels(UserEntity)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obtener mi perfil' })
  @ApiOkResponse({ type: UserResponseDto })
  getProfile(@CurrentUser() user: any) {
    return { message: 'Profile retrieved successfully', data: user };
  }

  @Patch('me')
  @ApiOperation({ summary: 'Actualizar mi perfil (nombre, empresa, teléfono, avatar)' })
  @ApiOkResponse({ type: UserResponseDto })
  updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CLIENTE)
  @ApiOperation({
    summary: 'Listar usuarios [ADMIN/SUPER_ADMIN/CLIENTE]',
    description:
      'SUPER_ADMIN ve todos. ADMIN y CLIENTE ven solo sus usuarios de organización (staff + ellos mismos).',
  })
  @ApiOkResponse({ type: PaginatedUsersResponseDto })
  findAll(@Query() filters: FilterUsersDto, @CurrentUser() user: any) {
    return this.usersService.findAll(filters, user);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.CLIENTE)
  @ApiOperation({ summary: 'Obtener usuario por ID [ADMIN/SUPER_ADMIN/CLIENTE]' })
  @ApiParam({ name: 'id', description: 'User CUID' })
  @ApiOkResponse({ type: UserResponseDto })
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id).then((user) => ({
      message: 'User retrieved successfully',
      data: user,
    }));
  }

  @Patch(':id/role')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Cambiar rol de un usuario [ADMIN/SUPER_ADMIN]',
    description:
      'ADMIN puede asignar: FINANZAS, VENDEDOR, MANTENIMIENTO, INQUILINO. ' +
      'SUPER_ADMIN puede asignar cualquier rol. ' +
      'Para roles staff incluir organizationId; para INQUILINO incluir linkedTenantId.',
  })
  @ApiParam({ name: 'id', description: 'User CUID' })
  @ApiOkResponse({ type: UserResponseDto })
  changeRole(
    @Param('id') id: string,
    @Body() dto: ChangeRoleDto,
    @CurrentUser('role') callerRole: string,
    @CurrentUser('id') callerId: string,
  ) {
    // ADMIN no puede promover a SUPER_ADMIN ni a otro ADMIN
    if (callerRole === Role.ADMIN && [Role.SUPER_ADMIN, Role.ADMIN].includes(dto.role)) {
      throw new Error('ADMIN cannot assign SUPER_ADMIN or ADMIN roles');
    }
    return this.usersService.changeRole(id, dto, callerId);
  }

  @Post(':id/activate')
  @AdminOnly()
  @ApiOperation({ summary: 'Reactivar un usuario desactivado [ADMIN/SUPER_ADMIN]' })
  @ApiParam({ name: 'id', description: 'User CUID' })
  @ApiOkResponse({ description: 'User activated successfully' })
  activate(@Param('id') id: string, @CurrentUser('id') callerId: string) {
    return this.usersService.activate(id, callerId);
  }

  @Delete(':id/deactivate')
  @AdminOnly()
  @ApiOperation({ summary: 'Desactivar usuario (soft delete) [ADMIN/SUPER_ADMIN]' })
  @ApiParam({ name: 'id', description: 'User CUID' })
  @ApiOkResponse({ description: 'User deactivated successfully' })
  deactivate(@Param('id') id: string, @CurrentUser('id') callerId: string) {
    return this.usersService.deactivate(id, callerId);
  }
}

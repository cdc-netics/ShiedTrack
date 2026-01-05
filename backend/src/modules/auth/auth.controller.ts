import { Controller, Post, Body, Get, UseGuards, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UserAreaService } from './user-area.service';
import { RegisterUserDto, LoginDto, EnableMfaDto, UpdateUserDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { UserRole } from '../../common/enums';

/**
 * Controller de autenticación y gestión de usuarios
 */
@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userAreaService: UserAreaService,
  ) {}

  @Post('register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.PLATFORM_ADMIN, UserRole.CLIENT_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Registrar un nuevo usuario (solo admins)' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  @ApiResponse({ status: 403, description: 'CLIENT_ADMIN no puede crear otros admins' })
  @ApiResponse({ status: 409, description: 'Email ya registrado' })
  async register(@Body() dto: RegisterUserDto, @CurrentUser() currentUser: any) {
    return this.authService.register(dto, currentUser);
  }

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Login exitoso' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('mfa/setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Iniciar configuración de MFA' })
  @ApiResponse({ status: 200, description: 'QR code generado' })
  async setupMfa(@CurrentUser() user: any) {
    return this.authService.setupMfa(user.userId);
  }

  @Post('mfa/enable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Habilitar MFA después de verificar código' })
  @ApiResponse({ status: 200, description: 'MFA habilitado' })
  async enableMfa(@CurrentUser() user: any, @Body() dto: EnableMfaDto) {
    return this.authService.enableMfa(user.userId, dto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener perfil del usuario actual' })
  @ApiResponse({ status: 200, description: 'Perfil del usuario' })
  async getProfile(@CurrentUser() user: any) {
    return this.authService.findById(user.userId);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.PLATFORM_ADMIN, UserRole.CLIENT_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar usuarios (solo admins)' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios' })
  async listUsers(@CurrentUser() user: any) {
    // Client admins solo ven usuarios de su tenant
    const clientId = user.role === UserRole.CLIENT_ADMIN ? user.clientId : undefined;
    return this.authService.findAll(clientId);
  }

  @Patch('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.PLATFORM_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Actualizar usuario' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado' })
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.authService.updateUser(id, dto);
  }

  // ============================================
  // ENDPOINTS DE ASIGNACIÓN DE ÁREAS
  // ============================================

  @Post('users/:userId/areas/bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Asignar múltiples áreas a un usuario de una vez (solo OWNER)' })
  @ApiResponse({ status: 201, description: 'Áreas asignadas exitosamente' })
  async assignMultipleAreas(
    @Param('userId') userId: string,
    @Body() body: { areaIds: string[] },
    @CurrentUser() currentUser: any,
  ) {
    return this.userAreaService.replaceUserAreas(userId, body.areaIds, currentUser.userId);
  }

  @Post('users/:userId/areas/:areaId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Asignar un área a un usuario (solo OWNER)' })
  @ApiResponse({ status: 201, description: 'Área asignada exitosamente' })
  async assignAreaToUser(
    @Param('userId') userId: string,
    @Param('areaId') areaId: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.userAreaService.assignArea(userId, areaId, currentUser.userId);
  }

  @Delete('users/:userId/areas/:areaId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Remover un área de un usuario (solo OWNER)' })
  @ApiResponse({ status: 200, description: 'Área removida exitosamente' })
  async removeAreaFromUser(
    @Param('userId') userId: string,
    @Param('areaId') areaId: string,
  ) {
    return this.userAreaService.removeArea(userId, areaId);
  }

  @Get('users/:userId/areas')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener áreas asignadas a un usuario' })
  @ApiResponse({ status: 200, description: 'Lista de áreas' })
  async getUserAreas(@Param('userId') userId: string) {
    return this.userAreaService.getUserAreas(userId);
  }

  @Get('areas/:areaId/users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.PLATFORM_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obtener usuarios asignados a un área' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios' })
  async getAreaUsers(@Param('areaId') areaId: string) {
    return this.userAreaService.getAreaUsers(areaId);
  }
}

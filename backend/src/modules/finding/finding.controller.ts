import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FindingService } from './finding.service';
import { CreateFindingDto, UpdateFindingDto, CloseFindingDto } from './dto/finding.dto';
import { CreateFindingUpdateDto } from './dto/finding-update.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, FindingStatus, FindingSeverity } from '../../common/enums';

@ApiTags('Findings')
@Controller('api/findings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class FindingController {
  constructor(private readonly findingService: FindingService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.PLATFORM_ADMIN, UserRole.CLIENT_ADMIN, UserRole.AREA_ADMIN, UserRole.ANALYST)
  @ApiOperation({ summary: 'Crear un nuevo hallazgo' })
  async create(@Body() dto: CreateFindingDto, @CurrentUser() user: any) {
    return this.findingService.create(dto, user.userId, user);
  }

  @Get()
  @ApiOperation({ summary: 'Listar hallazgos con filtros' })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: FindingStatus })
  @ApiQuery({ name: 'severity', required: false, enum: FindingSeverity })
  @ApiQuery({ name: 'assignedTo', required: false })
  @ApiQuery({ name: 'includeClosed', required: false, type: Boolean })
  async findAll(
    @Query('projectId') projectId?: string,
    @Query('status') status?: FindingStatus,
    @Query('severity') severity?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('includeClosed') includeClosed?: boolean,
    @CurrentUser() user?: any,
  ) {
    return this.findingService.findAll({
      projectId,
      status,
      severity,
      assignedTo,
      includeClosed,
    }, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener hallazgo por ID' })
  async findById(@Param('id') id: string, @CurrentUser() user?: any) {
    return this.findingService.findById(id, user);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Obtener timeline de un hallazgo' })
  async getTimeline(@Param('id') id: string) {
    return this.findingService.getTimeline(id);
  }

  @Put(':id')
  @Roles(UserRole.OWNER, UserRole.PLATFORM_ADMIN, UserRole.CLIENT_ADMIN, UserRole.AREA_ADMIN, UserRole.ANALYST)
  @ApiOperation({ summary: 'Actualizar hallazgo' })
  async update(@Param('id') id: string, @Body() dto: UpdateFindingDto, @CurrentUser() user: any) {
    return this.findingService.update(id, dto, user.userId, user);
  }

  @Post(':id/close')
  @Roles(UserRole.OWNER, UserRole.PLATFORM_ADMIN, UserRole.CLIENT_ADMIN, UserRole.AREA_ADMIN, UserRole.ANALYST)
  @ApiOperation({ summary: 'Cerrar un hallazgo con motivo específico' })
  async close(@Param('id') id: string, @Body() dto: CloseFindingDto, @CurrentUser() user: any) {
    return this.findingService.close(id, dto, user.userId);
  }

  @Post('updates')
  @Roles(UserRole.OWNER, UserRole.PLATFORM_ADMIN, UserRole.CLIENT_ADMIN, UserRole.AREA_ADMIN, UserRole.ANALYST)
  @ApiOperation({ summary: 'Agregar actualización al timeline de hallazgo' })
  async createUpdate(@Body() dto: CreateFindingUpdateDto, @CurrentUser() user: any) {
    return this.findingService.createUpdate(dto, user.userId, user);
  }

  @Delete(':id/hard')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Eliminar hallazgo permanentemente' })
  async hardDelete(@Param('id') id: string) {
    await this.findingService.hardDelete(id);
    return { message: 'Hallazgo eliminado permanentemente' };
  }
}

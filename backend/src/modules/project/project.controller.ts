import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

import { ProjectService } from './project.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { UserRole, ProjectStatus } from '../../common/enums';

@ApiTags('Projects')
@Controller('api/projects')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get('ping')
  @ApiOperation({ summary: 'Ping de Projects' })
  ping() {
    return {
      ok: true,
      at: new Date().toISOString(),
      build: 'PING_V1',
    };
  }

  // ✅ CREATE
  @Post()
  @Roles(
    UserRole.OWNER,
    UserRole.PLATFORM_ADMIN,
    UserRole.CLIENT_ADMIN,
    UserRole.AREA_ADMIN,
  )
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false, // 🔥 Permite clientId
    }),
  )
  @ApiOperation({ summary: 'Crear un nuevo proyecto' })
  async create(@Body() dto: CreateProjectDto) {
    return this.projectService.create(dto);
  }

  // ✅ LIST
  @Get()
  @ApiOperation({ summary: 'Listar proyectos con filtros opcionales' })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ProjectStatus })
  async findAll(
    @Query('tenantId') tenantId?: string,
    @Query('status') status?: ProjectStatus,
    @CurrentUser() user?: any,
  ) {
    const effectiveTenantId = tenantId ?? user?.clientId?.toString();
    return this.projectService.findAll(effectiveTenantId, status, user);
  }

  // ✅ FIND BY ID
  @Get(':id')
  @ApiOperation({ summary: 'Obtener proyecto por ID' })
  async findById(@Param('id') id: string, @CurrentUser() user?: any) {
    return this.projectService.findById(id, user);
  }

  // ✅ UPDATE
  @Put(':id')
  @Roles(
    UserRole.OWNER,
    UserRole.PLATFORM_ADMIN,
    UserRole.CLIENT_ADMIN,
    UserRole.AREA_ADMIN,
  )
  @ApiOperation({
    summary: 'Actualizar proyecto',
    description:
      'Al cambiar a CLOSED, cierra automáticamente todos los hallazgos abiertos',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectService.update(id, dto);
  }

  // ✅ PATCH
  @Patch(':id')
  @Roles(
    UserRole.OWNER,
    UserRole.PLATFORM_ADMIN,
    UserRole.CLIENT_ADMIN,
    UserRole.AREA_ADMIN,
  )
  @ApiOperation({
    summary: 'Actualizar parcialmente un proyecto',
  })
  async patch(
    @Param('id') id: string,
    @Body() dto: Partial<UpdateProjectDto>,
  ) {
    return this.projectService.update(id, dto as UpdateProjectDto);
  }

  // ✅ ARCHIVE
  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Archivar proyecto' })
  async archive(@Param('id') id: string) {
    return this.projectService.archive(id);
  }

  // ✅ HARD DELETE
  @Delete(':id/hard')
  @Roles(UserRole.OWNER)
  @ApiOperation({
    summary: 'Eliminar proyecto permanentemente',
  })
  async hardDelete(@Param('id') id: string) {
    await this.projectService.hardDelete(id);
    return { message: 'Proyecto eliminado permanentemente' };
  }

  // ✅ MERGE
  @Post('merge')
  @Roles(UserRole.OWNER, UserRole.PLATFORM_ADMIN)
  @ApiOperation({
    summary: 'Fusionar dos proyectos',
  })
  async mergeProjects(
    @Body() body: { sourceProjectId: string; targetProjectId: string },
  ) {
    return this.projectService.mergeProjects(
      body.sourceProjectId,
      body.targetProjectId,
    );
  }
}

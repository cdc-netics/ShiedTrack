import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TemplateService } from './template.service';
import { CreateTemplateDto, SearchTemplateDto } from './dto/template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../common/enums';

/**
 * Controller de Plantillas de Hallazgos
 * Base de conocimiento para acelerar la carga de hallazgos repetitivos
 */
@ApiTags('Templates')
@Controller('api/templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  /**
   * Buscar plantillas con autocomplete
   * Todos los roles pueden buscar (multi-tenant aplicado en servicio)
   */
  @Get('search')
  @ApiOperation({ summary: 'Buscar plantillas (autocomplete)' })
  @ApiQuery({ name: 'q', required: false, description: 'Búsqueda por texto' })
  @ApiQuery({ name: 'limit', required: false, description: 'Límite de resultados' })
  async searchTemplates(
    @Query() query: SearchTemplateDto,
    @CurrentUser() user: any
  ) {
    return this.templateService.searchTemplates(query, user);
  }

  /**
   * Listar todas las plantillas
   */
  @Get()
  @ApiOperation({ summary: 'Listar plantillas' })
  @ApiQuery({ name: 'scope', required: false, enum: ['GLOBAL', 'TENANT'] })
  async listTemplates(
    @CurrentUser() user: any,
    @Query('scope') scope?: string
  ) {
    return this.templateService.listTemplates(user, scope);
  }

  /**
   * Crear nueva plantilla
   * GLOBAL: Solo OWNER/PLATFORM_ADMIN
   * TENANT: CLIENT_ADMIN del cliente
   */
  @Post()
  @Roles(UserRole.CLIENT_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Crear plantilla (admins)' })
  async createTemplate(
    @Body() dto: CreateTemplateDto,
    @CurrentUser() user: any
  ) {
    return this.templateService.createTemplate(dto, user);
  }

  /**
   * Obtener plantilla por ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener plantilla por ID' })
  async getTemplateById(
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    return this.templateService.getTemplateById(id, user);
  }

  /**
   * Aplicar plantilla (copiar campos al hallazgo)
   * Incrementa usageCount
   */
  @Post(':id/apply')
  @ApiOperation({ summary: 'Aplicar plantilla (copiar campos)' })
  async applyTemplate(
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    return this.templateService.applyTemplate(id, user);
  }

  /**
   * Actualizar plantilla
   */
  @Patch(':id')
  @Roles(UserRole.CLIENT_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Actualizar plantilla' })
  async updateTemplate(
    @Param('id') id: string,
    @Body() dto: Partial<CreateTemplateDto>,
    @CurrentUser() user: any
  ) {
    return this.templateService.updateTemplate(id, dto, user);
  }

  /**
   * Desactivar plantilla (soft delete)
   */
  @Delete(':id')
  @Roles(UserRole.CLIENT_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: 'Desactivar plantilla' })
  async deactivateTemplate(
    @Param('id') id: string,
    @CurrentUser() user: any
  ) {
    await this.templateService.deactivateTemplate(id, user);
    return { message: 'Plantilla desactivada exitosamente' };
  }
}

import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AreaService } from './area.service';
import { CreateAreaDto, UpdateAreaDto } from './dto/area.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums';

@ApiTags('Areas')
@Controller('api/areas')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class AreaController {
  constructor(private readonly areaService: AreaService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.PLATFORM_ADMIN, UserRole.CLIENT_ADMIN)
  @ApiOperation({ summary: 'Crear una nueva área' })
  async create(@Body() dto: CreateAreaDto) {
    return this.areaService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar áreas' })
  @ApiQuery({ name: 'clientId', required: false })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  async findByClient(
    @Query('clientId') clientId?: string,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    return this.areaService.findByClient(clientId, includeInactive);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener área por ID' })
  async findById(@Param('id') id: string) {
    return this.areaService.findById(id);
  }

  @Put(':id')
  @Roles(UserRole.OWNER, UserRole.PLATFORM_ADMIN, UserRole.CLIENT_ADMIN, UserRole.AREA_ADMIN)
  @ApiOperation({ summary: 'Actualizar área' })
  async update(@Param('id') id: string, @Body() dto: UpdateAreaDto) {
    return this.areaService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Desactivar área' })
  async deactivate(@Param('id') id: string) {
    return this.areaService.deactivate(id);
  }

  @Delete(':id/hard')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Eliminar área permanentemente' })
  async hardDelete(@Param('id') id: string) {
    await this.areaService.hardDelete(id);
    return { message: 'Área eliminada permanentemente' };
  }
}

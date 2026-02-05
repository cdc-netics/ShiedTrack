import { 
  Controller, 
  Get, 
  Post, 
  Delete, 
  Param, 
  UseGuards, 
  UseInterceptors, 
  UploadedFile, 
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { EvidenceService } from './evidence.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../common/enums';

/**
 * Controller de gestión de Evidencias
 * Maneja upload y download seguro de archivos con validación JWT
 */
@ApiTags('Evidence')
@Controller('api/evidence')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @Post('upload')
  @Roles(UserRole.OWNER, UserRole.PLATFORM_ADMIN, UserRole.CLIENT_ADMIN, UserRole.AREA_ADMIN, UserRole.ANALYST)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Subir archivo de evidencia' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        findingId: { type: 'string' },
        description: { type: 'string' },
        updateId: { type: 'string' },
      },
    },
  })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('findingId') findingId: string,
    @Query('description') description: string,
    @Query('updateId') updateId: string,
    @CurrentUser() user: any,
  ) {
    return this.evidenceService.upload(file, findingId, user.userId, description, updateId);
  }

  @Get('finding/:findingId')
  @ApiOperation({ summary: 'Listar evidencias de un hallazgo' })
  async findByFinding(@Param('findingId') findingId: string) {
    return this.evidenceService.findByFinding(findingId);
  }

  @Get(':id/download')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // SECURITY FIX M2: Rate limiting
  @ApiOperation({ 
    summary: 'Descargar archivo de evidencia',
    description: 'Descarga segura con validación JWT antes del stream'
  })
  async download(@Param('id') id: string, @Res({ passthrough: true }) res: Response): Promise<StreamableFile> {
    const { stream, evidence } = await this.evidenceService.downloadFile(id);

    // Configurar headers para descarga
    res.set({
      'Content-Type': evidence.mimeType,
      'Content-Disposition': `attachment; filename="${evidence.filename}"`,
      'Content-Length': evidence.size,
    });

    return stream;
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.PLATFORM_ADMIN, UserRole.CLIENT_ADMIN, UserRole.AREA_ADMIN)
  @ApiOperation({ summary: 'Eliminar evidencia' })
  async delete(@Param('id') id: string) {
    await this.evidenceService.delete(id);
    return { message: 'Evidencia eliminada' };
  }
}

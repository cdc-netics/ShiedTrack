import { Controller, Get, Put, Body, UseGuards, Request, Post, Delete, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { SystemConfigService } from './system-config.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { diskStorage } from 'multer';
import { extname } from 'path';

/**
 * Controller de Configuración del Sistema
 * SOLO accesible por rol OWNER
 */
@ApiTags('System Config')
@Controller('api/system-config')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  @Delete('database/reset')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Danger Zone: Borrar toda la data de negocio (Findings, Projects, etc)' })
  async resetDatabase(@Body() body: { confirmation: string }) {
    return this.systemConfigService.resetDatabase(body.confirmation);
  }

  // ============================================================================
  // SMTP Configuration Endpoints
  // ============================================================================

  @Get('smtp')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Obtener configuración SMTP (solo OWNER)' })
  async getSmtpConfig() {
    return this.systemConfigService.getSmtpConfigMasked();
  }

  @Put('smtp')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Actualizar configuración SMTP (solo OWNER)' })
  async updateSmtpConfig(
    @Body() data: {
      smtp_host: string;
      smtp_port: number;
      smtp_secure: boolean;
      smtp_user: string;
      smtp_pass: string;
      smtp_from_email: string;
      smtp_from_name: string;
    },
    @Request() req: any
  ) {
    return this.systemConfigService.updateSmtpConfig(data, req.user.id);
  }

  @Post('smtp/test')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Probar conexión SMTP (solo OWNER)' })
  async testSmtpConnection() {
    return this.systemConfigService.testSmtpConnection();
  }

  // ============================================================================
  // Branding Configuration Endpoints
  // ============================================================================

  @Get('branding')
  @Roles(UserRole.OWNER, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Obtener configuración de branding' })
  async getBranding() {
    return this.systemConfigService.getBrandingConfig();
  }

  @Put('branding')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Actualizar configuración de branding (solo OWNER)' })
  async updateBranding(
    @Body() data: {
      appName?: string;
      faviconUrl?: string;
      logoUrl?: string;
      primaryColor?: string;
      secondaryColor?: string;
      isActive?: boolean;
    },
    @Request() req: any
  ) {
    return this.systemConfigService.updateBrandingConfig(data, req.user.id);
  }

  @Post('branding/favicon')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Subir favicon (solo OWNER)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/branding',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, `favicon-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        // Solo permitir imágenes ICO, PNG, SVG
        if (!file.originalname.match(/\.(ico|png|svg)$/i)) {
          return callback(new Error('Solo se permiten archivos .ico, .png, .svg'), false);
        }
        callback(null, true);
      },
      limits: { fileSize: 1024 * 1024 }, // 1MB max
    }),
  )
  async uploadFavicon(@UploadedFile() file: Express.Multer.File) {
    const faviconUrl = `/uploads/branding/${file.filename}`;
    return { faviconUrl };
  }

  @Post('branding/logo')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Subir logo (solo OWNER)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/branding',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, `logo-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        // Solo permitir imágenes PNG, JPG, SVG
        if (!file.originalname.match(/\.(png|jpg|jpeg|svg)$/i)) {
          return callback(new Error('Solo se permiten archivos .png, .jpg, .svg'), false);
        }
        callback(null, true);
      },
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
    }),
  )
  async uploadLogo(@UploadedFile() file: Express.Multer.File) {
    const logoUrl = `/uploads/branding/${file.filename}`;
    return { logoUrl };
  }
}

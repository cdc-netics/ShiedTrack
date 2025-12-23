import { Controller, Get, Put, Body, UseGuards, Request, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SystemConfigService } from './system-config.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums';

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
}

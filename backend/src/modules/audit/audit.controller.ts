import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { runWithTenant } from '../../common/utils/tenant-context';

/**
 * Controlador de Auditoría
 * Solo accesible por OWNER y PLATFORM_ADMIN (roles globales, no tenant-scoped)
 * 
 * ⚠️ IMPORTANTE: Auditoría debe ser visible a nivel global
 * La tenant context NO debe aplicarse aquí
 */
@ApiTags('audit')
@ApiBearerAuth()
@Controller('api/audit')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @Roles(UserRole.OWNER, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Obtener logs de auditoría (Global, sin filtro de tenant)' })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'entityId', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'severity', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getLogs(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('action') action?: string,
    @Query('severity') severity?: string,
    @Query('limit') limit?: number,
    @Req() req?: Request,
  ) {
    // Ejecutar sin contexto de tenant (undefined permite que el plugin NO aplique filtro)
    return runWithTenant(undefined, () =>
      this.auditService.findLogs({
        entityType,
        entityId,
        action,
        severity,
        limit: limit ? parseInt(limit.toString()) : 100,
      }),
    );
  }
}

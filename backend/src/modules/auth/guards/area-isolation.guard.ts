import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../../common/enums';

/**
 * Guard de Aislamiento por Área
 * 
 * Asegura que usuarios con roles restringidos (AREA_ADMIN, ANALYST, VIEWER)
 * solo accedan a recursos de sus áreas asignadas.
 * 
 * OWNER y PLATFORM_ADMIN tienen acceso global (bypass)
 */
@Injectable()
export class AreaIsolationGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // OWNER y PLATFORM_ADMIN tienen acceso total (bypass)
    if (user.role === UserRole.OWNER || user.role === UserRole.PLATFORM_ADMIN) {
      return true;
    }

    // CLIENT_ADMIN tiene acceso a todas las áreas de su cliente
    if (user.role === UserRole.CLIENT_ADMIN) {
      // El filtro se aplicará a nivel de clientId, no de área
      return true;
    }

    // AREA_ADMIN, ANALYST, VIEWER: verificar áreas asignadas
    if (!user.areaIds || user.areaIds.length === 0) {
      // Usuario sin áreas asignadas: denegar acceso
      return false;
    }

    // Inyectar areaIds en el request para que los services lo usen
    request.allowedAreaIds = user.areaIds.map((id: any) => id.toString());
    
    return true;
  }
}

/**
 * Decorador para marcar endpoints que requieren filtrado por área
 * Uso: @UseGuards(JwtAuthGuard, AreaIsolationGuard)
 */
export const AREA_ISOLATION_KEY = 'requireAreaIsolation';

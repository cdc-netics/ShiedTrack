import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../../../common/enums';

/**
 * Decorador para obtener el filtro de áreas del usuario actual
 * 
 * Retorna:
 * - null si el usuario es OWNER/PLATFORM_ADMIN (acceso global)
 * - array de areaIds si el usuario tiene restricción por área
 * 
 * Uso en controller:
 * async findAll(@AreaFilter() areaFilter: string[] | null)
 * 
 * Uso en service:
 * if (areaFilter) {
 *   query.where('areaId').in(areaFilter);
 * }
 */
export const AreaFilter = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string[] | null => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return null;
    }

    // Acceso global para OWNER y PLATFORM_ADMIN
    if (user.role === UserRole.OWNER || user.role === UserRole.PLATFORM_ADMIN) {
      return null;
    }

    // CLIENT_ADMIN: acceso a todas las áreas de su cliente (filtro por clientId, no área)
    if (user.role === UserRole.CLIENT_ADMIN) {
      return null; // El filtro se aplica por clientId en otro nivel
    }

    // AREA_ADMIN, ANALYST, VIEWER: retornar áreas asignadas
    if (user.areaIds && user.areaIds.length > 0) {
      return user.areaIds.map((id: any) => id.toString());
    }

    // Sin áreas asignadas: retornar array vacío (no verá nada)
    return [];
  },
);

/**
 * Decorador para obtener el clientId del usuario actual
 * Útil para filtrado a nivel de tenant/cliente
 */
export const ClientFilter = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | null => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return null;
    }

    // OWNER y PLATFORM_ADMIN: acceso global
    if (user.role === UserRole.OWNER || user.role === UserRole.PLATFORM_ADMIN) {
      return null;
    }

    // Retornar clientId del usuario
    return user.clientId ? user.clientId.toString() : null;
  },
);

import { Injectable, NestInterceptor, ExecutionContext, CallHandler, BadRequestException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { createNamespace, getNamespace } from 'cls-hooked';

/**
 * Interceptor global para establecer el contexto de tenant usando CLS.
 * Asegura que toda la cadena async del request quede dentro del namespace.
 */
@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const user = req.user; // Establecido por JwtAuthGuard
    const headerTenant = req.headers['x-tenant-id'] as string | undefined;

    const namespace = getNamespace('tenant-context') || createNamespace('tenant-context');

    // Si no hay usuario (ruta pública como login/register), no forzamos tenant
    if (!user) {
      return next.handle();
    }

    const isOwner = user.role === 'OWNER' || user.role === 'PLATFORM_ADMIN';
    namespace.set('isOwner', isOwner);
    namespace.set('userId', user.userId || user._id);

    if (isOwner) {
      // Owner puede especificar tenant via header, o ver todos si no lo envía
      if (headerTenant) {
        namespace.set('tenantId', headerTenant);
      }
      return next.handle();
    }

    // Para roles no OWNER/PLATFORM_ADMIN, resolvemos el tenant
    let tenantId = headerTenant || user?.activeTenantId || user?.clientId;
    if (!tenantId && user?.tenantIds && Array.isArray(user.tenantIds) && user.tenantIds.length > 0) {
      tenantId = user.tenantIds[0];
    }

    if (!tenantId) {
      // Lanzamos error coherente antes de ejecutar lógica de servicio
      throw new BadRequestException('Falta X-TENANT-ID o tenant activo en el usuario');
    }

    namespace.set('tenantId', String(tenantId));
    return next.handle();
  }
}

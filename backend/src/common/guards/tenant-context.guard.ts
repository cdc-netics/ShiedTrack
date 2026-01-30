import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { createNamespace, getNamespace } from 'cls-hooked';

/**
 * Guard para Multi-Tenancy
 * Establece el contexto de tenant usando CLS (Continuation-Local Storage)
 * 
 * Reglas:
 * 1. OWNER/PLATFORM_ADMIN: Pueden especificar X-TENANT-ID header o ver todos
 * 2. TENANT_ADMIN y otros roles: Solo ven SU tenant (clientId o activeTenantId)
 * 3. Si no hay usuario (login, register): permitir sin tenant
 */
@Injectable()
export class TenantContextGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user; // Establecido por AuthGuard/JWT
    const headerTenant = req.headers['x-tenant-id'] as string | undefined;

    // Si no hay usuario (request sin autenticar), permitir (ej: login, registro)
    if (!user) {
      return true;
    }

    // Crear namespace CLS si no existe
    const namespace = getNamespace('tenant-context') || createNamespace('tenant-context');

    namespace.run(() => {
      // OWNER y PLATFORM_ADMIN pueden cruzar tenants
      const isOwner = user.role === 'OWNER' || user.role === 'PLATFORM_ADMIN';
      namespace.set('isOwner', isOwner);
      namespace.set('userId', user.userId || user._id);

      if (isOwner) {
        // Owner puede especificar tenant via header, o ver todos
        if (headerTenant) {
          namespace.set('tenantId', headerTenant);
        }
        // Si no especifica header, puede ver todos (no se setea tenantId)
        return true;
      }

      // Para roles no OWNER/PLATFORM_ADMIN, se requiere un tenantId en contexto
      // Prioridad: header > activeTenantId > clientId > first tenantId
      let tenantId = headerTenant || user.activeTenantId || user.clientId;
      
      // Si no tiene ninguno, pero tiene tenantIds, usar el primero
      if (!tenantId && user.tenantIds && Array.isArray(user.tenantIds) && user.tenantIds.length > 0) {
        tenantId = user.tenantIds[0];
      }
      
      if (!tenantId) {
        throw new BadRequestException('Falta X-TENANT-ID o tenant activo en el usuario');
      }

      namespace.set('tenantId', String(tenantId));
    });

    return true;
  }
}
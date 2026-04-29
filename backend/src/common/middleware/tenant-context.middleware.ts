import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createNamespace, getNamespace } from 'cls-hooked';
import { runWithTenant } from '../utils/tenant-context';

/**
 * Middleware para establecer contexto de tenant usando CLS (Continuation-Local Storage)
 * y AsyncLocalStorage para compatibilidad con diferentes plugins de Mongoose.
 * Permite que el tenantId esté disponible en toda la cadena de ejecución.
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const namespace = getNamespace('tenant-context') || createNamespace('tenant-context');
    // Enlazar los emisores de eventos para preservar el contexto CLS durante el request
    (namespace as any).bindEmitter?.(req as any);
    (namespace as any).bindEmitter?.(res as any);

    const user = (req as any).user;
    const headerTenantId = req.headers['x-tenant-id'] as string | undefined;
    
    // Resolvemos el tenantId inicial si es posible
    let initialTenantId: string | undefined = headerTenantId;
    if (user && !initialTenantId) {
      initialTenantId = user.activeTenantId || user.clientId || (user.tenantIds && user.tenantIds[0]);
    }

    // Correr AMBOS contextos (CLS y AsyncLocalStorage)
    runWithTenant(initialTenantId, () => {
      namespace.run(() => {
        if (user) {
          const isOwner = user.role === 'OWNER' || user.role === 'PLATFORM_ADMIN';
          namespace.set('isOwner', isOwner);
          namespace.set('userId', user.userId || user._id);

          if (isOwner) {
            if (headerTenantId) namespace.set('tenantId', headerTenantId);
          } else if (initialTenantId) {
            namespace.set('tenantId', String(initialTenantId));
          }
        } else if (headerTenantId) {
          // Si no hay usuario pero hay header (ej: registro con tenant pre-seleccionado)
          namespace.set('tenantId', headerTenantId);
        }

        next();
      });
    });
  }
}

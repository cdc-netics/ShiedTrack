import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { createNamespace, getNamespace } from 'cls-hooked';

/**
 * Middleware para establecer contexto de tenant usando CLS (Continuation-Local Storage)
 * Permite que el tenantId esté disponible en toda la cadena de ejecución
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const namespace = getNamespace('tenant-context') || createNamespace('tenant-context');
    // Enlazar los emisores de eventos para preservar el contexto CLS durante el request
    // Esto es crítico para que Mongoose y otros callbacks mantengan el tenantId
    // a lo largo de toda la cadena async del request/response.
    (namespace as any).bindEmitter?.(req as any);
    (namespace as any).bindEmitter?.(res as any);

    namespace.run(() => {
      const user = (req as any).user;
      const headerTenantId = req.headers['x-tenant-id'] as string | undefined;

      if (user) {
        const isOwner = user.role === 'OWNER' || user.role === 'PLATFORM_ADMIN';
        namespace.set('isOwner', isOwner);
        namespace.set('userId', user.userId || user._id);

        if (isOwner) {
          if (headerTenantId) namespace.set('tenantId', headerTenantId);
        } else {
          const tenantId = headerTenantId || user.activeTenantId || user.clientId || (user.tenantIds && user.tenantIds[0]);
          if (tenantId) namespace.set('tenantId', String(tenantId));
        }
      }

      next();
    });
  }
}

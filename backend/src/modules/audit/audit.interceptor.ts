import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

/**
 * Interceptor global de auditoría
 * Registra operaciones CRUD (POST/PUT/PATCH/DELETE) con metadatos básicos
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, user, body, ip, headers, params } = req;

    return next.handle().pipe(
      tap(async (response) => {
        const isExport = method === 'GET' && url.includes('/export/');
        const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

        if (!isMutation && !isExport) {
          return;
        }

        await this.auditService.log({
          action: `${method} ${url}`,
          entityType: isExport ? 'EXPORT' : 'HTTP',
          entityId: body?.id || body?._id || params?.id || params?._id || 'N/A',
          performedBy: user?.userId || 'anonymous',
          ip,
          userAgent: headers['user-agent'],
          metadata: {
            body: isExport ? {} : body, // No logear body en exports (usualmente vacío)
            params,
            // response: isExport ? 'Stream' : response, // Evitar logear streams grandes
          },
        });
      }),
    );
  }
}

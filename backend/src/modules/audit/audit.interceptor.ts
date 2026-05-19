import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, throwError } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { AuditService } from "./audit.service";

/**
 * Interceptor global de auditoría
 * Registra operaciones CRUD (POST/PUT/PATCH/DELETE) con metadatos básicos
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const startedAt = Date.now();
    const { method, url, user, body, query, ip, headers, params } = req;
    const normalizedPath = String(url || "").split("?")[0];
    const shouldSkip =
      normalizedPath === "/" ||
      normalizedPath.startsWith("/api/docs") ||
      normalizedPath.includes("favicon.ico");

    if (shouldSkip) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async () => {
        await this.auditService.log({
          action: `${method} ${normalizedPath}`,
          method,
          path: normalizedPath,
          entityType: method === "GET" && normalizedPath.includes("/export/")
            ? "EXPORT"
            : "HTTP",
          entityId: body?.id || body?._id || params?.id || params?._id || "N/A",
          performedBy: user?.userId ?? null,
          performedByLabel: user?.email ?? (user?.userId ? String(user.userId) : "anonymous"),
          clientId: user?.clientId,
          ip,
          userAgent: headers["user-agent"],
          statusCode: res?.statusCode ?? 200,
          durationMs: Date.now() - startedAt,
          severity: res?.statusCode >= 500 ? "CRITICAL" : "INFO",
          metadata: {
            params: this.sanitize(params),
            query: this.sanitize(query),
            body: method === "GET" ? {} : this.sanitize(body),
          },
        });
      }),
      catchError((error) => {
        void this.auditService.log({
          action: `${method} ${normalizedPath}`,
          method,
          path: normalizedPath,
          entityType: "HTTP_ERROR",
          entityId: params?.id || params?._id || "N/A",
          performedBy: user?.userId ?? null,
          performedByLabel: user?.email ?? (user?.userId ? String(user.userId) : "anonymous"),
          clientId: user?.clientId,
          ip,
          userAgent: headers["user-agent"],
          statusCode: typeof error?.status === "number" ? error.status : 500,
          durationMs: Date.now() - startedAt,
          severity: "CRITICAL",
          metadata: {
            errorName: error?.name ?? "UnknownError",
            errorMessage: error?.message ?? "Unknown error",
            params: this.sanitize(params),
            query: this.sanitize(query),
            body: method === "GET" ? {} : this.sanitize(body),
          },
        });
        return throwError(() => error);
      }),
    );
  }

  private sanitize(value: unknown): unknown {
    if (value == null) {
      return value;
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.sanitize(item));
    }
    if (typeof value !== "object") {
      return value;
    }

    const redactedKeys = [
      "password",
      "token",
      "accessToken",
      "refreshToken",
      "secret",
      "mfaToken",
      "authorization",
    ];
    const obj = value as Record<string, unknown>;
    const sanitized: Record<string, unknown> = {};

    for (const [key, val] of Object.entries(obj)) {
      const keyLc = key.toLowerCase();
      if (redactedKeys.some((redacted) => keyLc.includes(redacted.toLowerCase()))) {
        sanitized[key] = "[REDACTED]";
      } else {
        sanitized[key] = this.sanitize(val);
      }
    }

    return sanitized;
  }
}

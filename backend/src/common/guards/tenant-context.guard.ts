import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { createNamespace, getNamespace } from "cls-hooked";
import { setTenant } from "../utils/tenant-context";

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
    const headerTenant = req.headers["x-tenant-id"] as string | undefined;
    const path = req.originalUrl || req.url || "";

    if (path.includes("/api/auth/profile")) {
      return true;
    }

    // Si no hay usuario (request sin autenticar), permitir (ej: login, registro)
    if (!user) {
      return true;
    }

    // Crear namespace CLS si no existe
    const namespace =
      getNamespace("tenant-context") || createNamespace("tenant-context");

    // OWNER y PLATFORM_ADMIN pueden cruzar tenants sin tenant obligatorio
    const isOwner = user.role === "OWNER" || user.role === "PLATFORM_ADMIN";
    // PENTESTER, QA y ANALYST son roles operativos de plataforma que pueden
    // trabajar sin un tenant fijo asignado (su scope lo controlan los servicios)
    const isOperationalRole =
      user.role === "PENTESTER" ||
      user.role === "QA" ||
      user.role === "ANALYST" ||
      user.role === "ADMIN_AREA";

    namespace.set("isOwner", isOwner);
    namespace.set("userId", user.userId || user._id);

    // Prioridad de tenant: header > activeTenantId > clientId > tenantIds[0]
    let tenantId: string | undefined =
      headerTenant || user.activeTenantId || user.clientId;

    if (
      !tenantId &&
      user.tenantIds &&
      Array.isArray(user.tenantIds) &&
      user.tenantIds.length > 0
    ) {
      tenantId = user.tenantIds[0];
    }

    if (tenantId) {
      namespace.set("tenantId", String(tenantId));
      setTenant(String(tenantId));
    }

    // OWNER y roles operativos pasan aunque no tengan tenant asignado
    if (isOwner || isOperationalRole) {
      return true;
    }

    if (!tenantId) {
      throw new BadRequestException(
        "Falta X-TENANT-ID o tenant activo en el usuario",
      );
    }

    return true;
  }
}

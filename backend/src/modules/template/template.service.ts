import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { FindingTemplate } from "./schemas/finding-template.schema";
import { CreateTemplateDto, SearchTemplateDto } from "./dto/template.dto";
import { UserRole } from "../../common/enums";
import { normalizeRole, roleSatisfies } from "../../common/rbac/rbac-policy";

/**
 * Servicio de Plantillas de Hallazgos
 * Base de conocimiento para acelerar la carga de hallazgos repetitivos
 */
@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  constructor(
    @InjectModel(FindingTemplate.name)
    private templateModel: Model<FindingTemplate>,
  ) {}

  private isGlobalUser(currentUser?: any): boolean {
    return roleSatisfies(UserRole.OWNER, currentUser?.role);
  }

  private isTenantAdmin(currentUser?: any): boolean {
    return normalizeRole(currentUser?.role) === "ADMIN_AREA";
  }

  /**
   * Crear nueva plantilla
   * GLOBAL: Solo OWNER/PLATFORM_ADMIN
   * TENANT: CLIENT_ADMIN de ese cliente
   */
  async createTemplate(
    dto: CreateTemplateDto,
    currentUser: any,
  ): Promise<FindingTemplate> {
    // RBAC: Validar permisos según scope
    if (dto.scope === "USER") {
      dto.tenantId = undefined;
    } else if (dto.scope === "GLOBAL") {
      if (!this.isGlobalUser(currentUser)) {
        throw new ForbiddenException(
          "Solo OWNER/PLATFORM_ADMIN pueden crear plantillas globales",
        );
      }
    } else if (dto.scope === "TENANT") {
      if (!this.isGlobalUser(currentUser) && !this.isTenantAdmin(currentUser)) {
        throw new ForbiddenException("Solo admins pueden crear plantillas");
      }
      if (this.isTenantAdmin(currentUser)) {
        // Tenant-scoped: usar tenantId activo del usuario
        dto.tenantId = currentUser.activeTenantId || currentUser.clientId;
      }
    }

    const template = new this.templateModel({
      ...dto,
      createdBy: currentUser.userId,
      usageCount: 0,
    });

    await template.save();
    this.logger.log(
      `Plantilla creada: ${template.title} (${template.scope}) por ${currentUser.email}`,
    );

    return template;
  }

  /**
   * Buscar plantillas con autocomplete
   * Búsqueda por texto completo en title, description, tags
   *
   * Scope:
   * - GLOBAL: Todos los usuarios ven plantillas globales
   * - TENANT: Solo el cliente específico + GLOBAL
   */
  async searchTemplates(
    query: SearchTemplateDto,
    currentUser: any,
  ): Promise<FindingTemplate[]> {
    const filter: any = { isActive: true };

    // Multi-tenant: Mostrar plantillas GLOBAL + del cliente del usuario
    if (!this.isGlobalUser(currentUser)) {
      filter.$or = [
        { scope: "USER", createdBy: currentUser.userId },
        { scope: "GLOBAL" },
        {
          scope: "TENANT",
          tenantId: currentUser.activeTenantId || currentUser.clientId,
        },
      ];
    }

    // Búsqueda por texto (si se proporciona query)
    if (query.q) {
      filter.$text = { $search: query.q };

      // Buscar con score de relevancia
      const results = await this.templateModel
        .find(filter, { score: { $meta: "textScore" } })
        .sort({ score: { $meta: "textScore" }, usageCount: -1, createdAt: -1 })
        .limit(query.limit || 20)
        .lean();

      return results;
    }

    // Sin query: Mostrar las más usadas
    const templates = await this.templateModel
      .find(filter)
      .sort({ usageCount: -1, createdAt: -1 })
      .limit(query.limit || 20)
      .lean();

    return this.prioritizeUserTemplates(templates as any[], currentUser.userId);
  }

  /**
   * Obtener plantilla por ID
   */
  async getTemplateById(
    id: string,
    currentUser: any,
  ): Promise<FindingTemplate> {
    const template = await this.templateModel.findById(id);

    if (!template) {
      throw new NotFoundException("Plantilla no encontrada");
    }

    // RBAC: Verificar acceso si es TENANT
    if (template.scope === "TENANT") {
      const canAccess =
        this.isGlobalUser(currentUser) ||
        template.tenantId?.toString() ===
          (currentUser.activeTenantId || currentUser.clientId)?.toString();

      if (!canAccess) {
        throw new ForbiddenException("No tiene acceso a esta plantilla");
      }
    }
    if (template.scope === "USER") {
      const ownTemplate = template.createdBy?.toString() === currentUser.userId?.toString();
      const isSuperAdmin = this.isGlobalUser(currentUser);
      if (!ownTemplate && !isSuperAdmin) {
        throw new ForbiddenException("No tiene acceso a esta plantilla personal");
      }
    }

    return template;
  }

  /**
   * Aplicar plantilla (copiar campos al hallazgo)
   * Incrementa usageCount para métricas
   */
  async applyTemplate(templateId: string, currentUser: any): Promise<any> {
    const template = await this.getTemplateById(templateId, currentUser);

    // Incrementar contador de uso
    await this.templateModel.findByIdAndUpdate(templateId, {
      $inc: { usageCount: 1 },
    });

    this.logger.log(
      `Plantilla aplicada: ${template.title} por ${currentUser.email}`,
    );

    // Retornar solo los campos que se copiarán al hallazgo
    return {
      title: template.title,
      description: template.description,
      recommendation: template.recommendation,
      severity: template.severity,
      internal_code: template.internal_code,
      cvss_score: template.cvss_score,
      cwe_id: template.cwe_id,
      references: template.references,
      tags: template.tags,
    };
  }

  /**
   * Listar todas las plantillas (con filtros)
   */
  async listTemplates(
    currentUser: any,
    scope?: string,
  ): Promise<FindingTemplate[]> {
    const filter: any = { isActive: true };

    // Filtro por scope
    if (scope) {
      filter.scope = scope;
    }

    // Multi-tenant
    if (!this.isGlobalUser(currentUser)) {
      filter.$or = [
        { scope: "USER", createdBy: currentUser.userId },
        { scope: "GLOBAL" },
        {
          scope: "TENANT",
          tenantId: currentUser.activeTenantId || currentUser.clientId,
        },
      ];
    }

    const templates = await this.templateModel
      .find(filter)
      .populate("createdBy", "firstName lastName email")
      .sort({ usageCount: -1, createdAt: -1 })
      .lean();

    return this.prioritizeUserTemplates(templates as any[], currentUser.userId);
  }

  /**
   * Actualizar plantilla
   */
  async updateTemplate(
    id: string,
    dto: Partial<CreateTemplateDto>,
    currentUser: any,
  ): Promise<FindingTemplate> {
    const template = await this.getTemplateById(id, currentUser);

    // RBAC: Solo el creador o admins superiores pueden editar
    const canEdit =
      this.isGlobalUser(currentUser) ||
      template.createdBy.toString() === currentUser.userId;

    if (!canEdit) {
      throw new ForbiddenException(
        "No tiene permisos para editar esta plantilla",
      );
    }

    Object.assign(template, dto);
    await (template as any).save();

    this.logger.log(
      `Plantilla actualizada: ${template.title} por ${currentUser.email}`,
    );
    return template;
  }

  /**
   * Desactivar plantilla (soft delete)
   */
  async deactivateTemplate(id: string, currentUser: any): Promise<void> {
    const template = await this.getTemplateById(id, currentUser);

    // RBAC: Solo el creador o admins superiores pueden desactivar
    const canDelete =
      this.isGlobalUser(currentUser) ||
      template.createdBy.toString() === currentUser.userId;

    if (!canDelete) {
      throw new ForbiddenException(
        "No tiene permisos para desactivar esta plantilla",
      );
    }

    await this.templateModel.findByIdAndUpdate(id, { isActive: false });
    this.logger.log(
      `Plantilla desactivada: ${template.title} por ${currentUser.email}`,
    );
  }

  private prioritizeUserTemplates(
    templates: any[],
    userId: string,
  ): FindingTemplate[] {
    return templates.sort((a, b) => {
      const aCreatedBy =
        typeof a.createdBy === "object" ? a.createdBy?._id?.toString?.() : a.createdBy?.toString?.();
      const bCreatedBy =
        typeof b.createdBy === "object" ? b.createdBy?._id?.toString?.() : b.createdBy?.toString?.();
      const aOwn = a.scope === "USER" && aCreatedBy === userId?.toString();
      const bOwn = b.scope === "USER" && bCreatedBy === userId?.toString();
      if (aOwn !== bOwn) return aOwn ? -1 : 1;
      return 0;
    }) as FindingTemplate[];
  }
}

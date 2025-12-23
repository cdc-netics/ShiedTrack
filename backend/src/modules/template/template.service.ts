import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FindingTemplate } from './schemas/finding-template.schema';
import { CreateTemplateDto, SearchTemplateDto } from './dto/template.dto';

/**
 * Servicio de Plantillas de Hallazgos
 * Base de conocimiento para acelerar la carga de hallazgos repetitivos
 */
@Injectable()
export class TemplateService {
  private readonly logger = new Logger(TemplateService.name);

  constructor(
    @InjectModel(FindingTemplate.name) private templateModel: Model<FindingTemplate>,
  ) {}

  /**
   * Crear nueva plantilla
   * GLOBAL: Solo OWNER/PLATFORM_ADMIN
   * TENANT: CLIENT_ADMIN de ese cliente
   */
  async createTemplate(dto: CreateTemplateDto, currentUser: any): Promise<FindingTemplate> {
    // RBAC: Validar permisos según scope
    if (dto.scope === 'GLOBAL') {
      if (!['OWNER', 'PLATFORM_ADMIN'].includes(currentUser.role)) {
        throw new ForbiddenException('Solo OWNER/PLATFORM_ADMIN pueden crear plantillas globales');
      }
    } else if (dto.scope === 'TENANT') {
      if (!['OWNER', 'PLATFORM_ADMIN', 'CLIENT_ADMIN'].includes(currentUser.role)) {
        throw new ForbiddenException('Solo admins pueden crear plantillas');
      }
      // CLIENT_ADMIN solo puede crear plantillas de su cliente
      if (currentUser.role === 'CLIENT_ADMIN') {
        dto.clientId = currentUser.clientId;
      }
    }

    const template = new this.templateModel({
      ...dto,
      createdBy: currentUser.userId,
      usageCount: 0
    });

    await template.save();
    this.logger.log(`Plantilla creada: ${template.title} (${template.scope}) por ${currentUser.email}`);

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
  async searchTemplates(query: SearchTemplateDto, currentUser: any): Promise<FindingTemplate[]> {
    const filter: any = { isActive: true };

    // Multi-tenant: Mostrar plantillas GLOBAL + del cliente del usuario
    if (currentUser.role !== 'OWNER' && currentUser.role !== 'PLATFORM_ADMIN') {
      filter.$or = [
        { scope: 'GLOBAL' },
        { scope: 'TENANT', clientId: currentUser.clientId }
      ];
    }

    // Búsqueda por texto (si se proporciona query)
    if (query.q) {
      filter.$text = { $search: query.q };

      // Buscar con score de relevancia
      const results = await this.templateModel
        .find(filter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' }, usageCount: -1 })
        .limit(query.limit || 20)
        .lean();

      return results;
    }

    // Sin query: Mostrar las más usadas
    return this.templateModel
      .find(filter)
      .sort({ usageCount: -1, createdAt: -1 })
      .limit(query.limit || 20)
      .lean();
  }

  /**
   * Obtener plantilla por ID
   */
  async getTemplateById(id: string, currentUser: any): Promise<FindingTemplate> {
    const template = await this.templateModel.findById(id);
    
    if (!template) {
      throw new NotFoundException('Plantilla no encontrada');
    }

    // RBAC: Verificar acceso si es TENANT
    if (template.scope === 'TENANT') {
      const canAccess = 
        ['OWNER', 'PLATFORM_ADMIN'].includes(currentUser.role) ||
        (template.clientId?.toString() === currentUser.clientId?.toString());

      if (!canAccess) {
        throw new ForbiddenException('No tiene acceso a esta plantilla');
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
    await this.templateModel.findByIdAndUpdate(templateId, { $inc: { usageCount: 1 } });

    this.logger.log(`Plantilla aplicada: ${template.title} por ${currentUser.email}`);

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
      tags: template.tags
    };
  }

  /**
   * Listar todas las plantillas (con filtros)
   */
  async listTemplates(currentUser: any, scope?: string): Promise<FindingTemplate[]> {
    const filter: any = { isActive: true };

    // Filtro por scope
    if (scope) {
      filter.scope = scope;
    }

    // Multi-tenant
    if (currentUser.role !== 'OWNER' && currentUser.role !== 'PLATFORM_ADMIN') {
      filter.$or = [
        { scope: 'GLOBAL' },
        { scope: 'TENANT', clientId: currentUser.clientId }
      ];
    }

    return this.templateModel
      .find(filter)
      .populate('createdBy', 'firstName lastName email')
      .sort({ usageCount: -1, createdAt: -1 })
      .lean();
  }

  /**
   * Actualizar plantilla
   */
  async updateTemplate(id: string, dto: Partial<CreateTemplateDto>, currentUser: any): Promise<FindingTemplate> {
    const template = await this.getTemplateById(id, currentUser);

    // RBAC: Solo el creador o admins superiores pueden editar
    const canEdit = 
      ['OWNER', 'PLATFORM_ADMIN'].includes(currentUser.role) ||
      (template.createdBy.toString() === currentUser.userId);

    if (!canEdit) {
      throw new ForbiddenException('No tiene permisos para editar esta plantilla');
    }

    Object.assign(template, dto);
    await (template as any).save();

    this.logger.log(`Plantilla actualizada: ${template.title} por ${currentUser.email}`);
    return template;
  }

  /**
   * Desactivar plantilla (soft delete)
   */
  async deactivateTemplate(id: string, currentUser: any): Promise<void> {
    const template = await this.getTemplateById(id, currentUser);

    // RBAC: Solo el creador o admins superiores pueden desactivar
    const canDelete = 
      ['OWNER', 'PLATFORM_ADMIN'].includes(currentUser.role) ||
      (template.createdBy.toString() === currentUser.userId);

    if (!canDelete) {
      throw new ForbiddenException('No tiene permisos para desactivar esta plantilla');
    }

    await this.templateModel.findByIdAndUpdate(id, { isActive: false });
    this.logger.log(`Plantilla desactivada: ${template.title} por ${currentUser.email}`);
  }
}

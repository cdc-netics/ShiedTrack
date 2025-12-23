import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog } from './schemas/audit-log.schema';

/**
 * Servicio de Auditoría
 * Registra operaciones críticas para compliance y trazabilidad
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(@InjectModel(AuditLog.name) private auditModel: Model<AuditLog>) {}

  /**
   * Registra una acción de auditoría
   */
  async log(data: {
    action: string;
    entityType: string;
    entityId: string;
    performedBy: string;
    metadata?: Record<string, any>;
    ip?: string;
    userAgent?: string;
    severity?: string;
  }): Promise<void> {
    try {
      const audit = new this.auditModel({
        ...data,
        severity: data.severity || 'INFO',
      });
      await audit.save();
      
      // Log adicional para casos CRITICAL
      if (data.severity === 'CRITICAL') {
        this.logger.warn(
          `[AUDIT CRITICAL] ${data.action} on ${data.entityType}:${data.entityId} by ${data.performedBy}`,
        );
      }
    } catch (error) {
      // No bloquear operación si falla auditoría, pero logear
      this.logger.error(`Error registrando auditoría: ${error.message}`, error.stack);
    }
  }

  /**
   * Obtiene logs de auditoría con filtros
   */
  async findLogs(filters: {
    performedBy?: string;
    entityType?: string;
    entityId?: string;
    action?: string;
    severity?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AuditLog[]> {
    const query: any = {};

    if (filters.performedBy) query.performedBy = filters.performedBy;
    if (filters.entityType) query.entityType = filters.entityType;
    if (filters.entityId) query.entityId = filters.entityId;
    if (filters.action) query.action = filters.action;
    if (filters.severity) query.severity = filters.severity;

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = filters.startDate;
      if (filters.endDate) query.createdAt.$lte = filters.endDate;
    }

    return this.auditModel
      .find(query)
      .populate('performedBy', 'email firstName lastName')
      .sort({ createdAt: -1 })
      .limit(filters.limit || 100);
  }
}

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Entidad AuditLog
 * Registro inmutable de operaciones críticas para auditoría y compliance
 */
@Schema({ timestamps: true })
export class AuditLog extends Document {
  @Prop({ required: true })
  action: string; // Ej: USER_ROLE_CHANGE, PROJECT_CLOSED, HARD_DELETE_CLIENT

  @Prop({ required: true })
  entityType: string; // User, Client, Project, Finding, etc.

  @Prop({ required: true })
  entityId: string; // ID de la entidad afectada

  @Prop({ type: Types.ObjectId, ref: 'Client' })
  clientId?: Types.ObjectId; // Contexto de tenant

  @Prop({ type: Types.ObjectId, ref: 'Area' })
  areaId?: Types.ObjectId; // Contexto de área

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  performedBy: Types.ObjectId; // Usuario que ejecutó la acción

  @Prop({ type: Object })
  metadata?: Record<string, any>; // Datos adicionales (ej: valor anterior, nuevo)

  @Prop()
  ip?: string; // IP del usuario

  @Prop()
  userAgent?: string; // User agent del navegador

  @Prop({ required: true })
  severity: string; // INFO, WARNING, CRITICAL

  // Timestamp de creación (inmutable)
  readonly createdAt: Date;

  // Multi-tenant: referencia al tenant
  @Prop({ type: Types.ObjectId, ref: 'Tenant' })
  tenantId?: Types.ObjectId;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// Índices para consultas de auditoría
AuditLogSchema.index({ performedBy: 1, createdAt: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ severity: 1, createdAt: -1 });
AuditLogSchema.index({ tenantId: 1, createdAt: -1 });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Entidad AuditLog
 * Registro inmutable de operaciones críticas para auditoría y compliance
 */
@Schema({ timestamps: true })
export class AuditLog extends Document {
  @Prop({ required: true, trim: true })
  action!: string; // Ej: POST /api/auth/login, USER_ROLE_CHANGE, PROJECT_CLOSED

  @Prop({ required: true, trim: true })
  entityType!: string; // HTTP, EXPORT, User, Client, Project, Finding, etc.

  @Prop({ required: true, trim: true })
  entityId!: string; // ID de la entidad afectada o 'N/A'

  @Prop({ type: Types.ObjectId, ref: 'Client', required: false })
  clientId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Area', required: false })
  areaId?: Types.ObjectId;

  /**
   * Usuario que ejecutó la acción (FK a User)
   * Puede ser null cuando es "anonymous" o sistema.
   */
  @Prop({ type: Types.ObjectId, ref: 'User', required: false, default: null })
  performedBy?: Types.ObjectId | null;

  /**
   * Etiqueta alternativa cuando no hay usuario (ej: "anonymous", "system")
   */
  @Prop({ type: String, required: false, default: null, trim: true })
  performedByLabel?: string | null;

  @Prop({ type: Object, required: false, default: {} })
  metadata?: Record<string, any>;

  @Prop({ type: String, required: false, trim: true })
  ip?: string;

  @Prop({ type: String, required: false })
  userAgent?: string;

  @Prop({ required: true, trim: true, default: 'INFO' })
  severity!: string; // INFO, WARNING, CRITICAL

  // timestamps (por Schema timestamps: true)
  createdAt!: Date;
  updatedAt!: Date;

  // Multi-tenant: referencia al tenant
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: false })
  tenantId?: Types.ObjectId;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// Índices para consultas de auditoría
AuditLogSchema.index({ performedBy: 1, createdAt: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ severity: 1, createdAt: -1 });
AuditLogSchema.index({ tenantId: 1, createdAt: -1 });
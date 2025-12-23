import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ServiceArchitecture, ProjectStatus } from '../../../common/enums';

/**
 * Subdocumento: Configuración de política de Retest
 * Define si el proyecto tiene retest programado y sus notificaciones
 */
@Schema({ _id: false })
export class RetestPolicy {
  @Prop({ default: false })
  enabled: boolean;

  @Prop()
  nextRetestAt?: Date; // Fecha programada del próximo retest

  @Prop({ type: Object })
  notify?: {
    recipients: string[]; // Array de emails
    offsetDays: number[]; // Días antes del retest para enviar notificaciones (ej: [30, 15, 3])
  };
}

const RetestPolicySchema = SchemaFactory.createForClass(RetestPolicy);

/**
 * Entidad Proyecto
 * Representa un contrato o engagement de ciberseguridad
 * Es la unidad sobre la que se configuran los retest
 */
@Schema({ timestamps: true })
export class Project extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ unique: true, sparse: true })
  code?: string; // Código identificador (ej: PROJ-2024-001)

  @Prop()
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'Client', required: true })
  clientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Area', required: true })
  areaId: Types.ObjectId;

  @Prop({ required: true, enum: ServiceArchitecture })
  serviceArchitecture: ServiceArchitecture;

  @Prop({ required: true, enum: ProjectStatus, default: ProjectStatus.ACTIVE })
  projectStatus: ProjectStatus;

  @Prop({ type: RetestPolicySchema, default: { enabled: false } })
  retestPolicy: RetestPolicy;

  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;

  // Timestamps automáticos: createdAt, updatedAt
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

// Índices para consultas frecuentes
ProjectSchema.index({ clientId: 1, projectStatus: 1 });
ProjectSchema.index({ areaId: 1 });
ProjectSchema.index({ code: 1 });
ProjectSchema.index({ 'retestPolicy.enabled': 1, 'retestPolicy.nextRetestAt': 1 }); // Para el scheduler

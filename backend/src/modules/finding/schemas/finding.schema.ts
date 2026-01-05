import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { FindingSeverity, FindingStatus, CloseReason } from '../../../common/enums';

/**
 * Entidad Hallazgo (Finding)
 * Representa una vulnerabilidad o problema de ciberseguridad identificado
 */
@Schema({ timestamps: true })
export class Finding extends Document {
  @Prop({ required: true, unique: true })
  code: string; // ID operativo humano (ej: FIND-2024-001)

  @Prop({ required: true })
  internal_code: string; // Código interno de categorización (ej: CAT-WEB-001)

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string; // Soporta HTML/Markdown seguro

  @Prop({ required: true, enum: FindingSeverity })
  severity: FindingSeverity;

  @Prop({ required: true, enum: FindingStatus, default: FindingStatus.OPEN })
  status: FindingStatus;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  /**
   * Define si este hallazgo debe incluirse en el retest del proyecto
   * El retest se configura a nivel proyecto, pero cada hallazgo puede opt-in/opt-out
   */
  @Prop({ default: true })
  retestIncluded: boolean;

  @Prop({ enum: CloseReason })
  closeReason?: CloseReason;

  @Prop()
  closedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  closedBy?: Types.ObjectId;

  // Información técnica adicional
  @Prop()
  affectedAsset?: string; // Sistema/aplicación afectado

  @Prop({ min: 0, max: 10 })
  cvss_score?: number; // CVSS Score validado 0-10 con decimales

  @Prop({ 
    validate: {
      validator: (v: string) => !v || /^CVE-\d{4}-\d{4,7}$/.test(v),
      message: 'CVE ID debe tener formato CVE-YYYY-NNNN (ej: CVE-2024-12345)'
    }
  })
  cve_id?: string; // ID CVE validado con regex

  @Prop()
  detection_source?: string; // IP o URL de origen de la detección

  @Prop()
  cweId?: string;

  @Prop()
  recommendation?: string; // Recomendación de remediación

  @Prop()
  impact?: string; // Descripción del impacto

  @Prop()
  implications?: string; // Implicancias del hallazgo

  @Prop({ type: [String], default: [] })
  controls: string[]; // Controles CIS, NIST, OWASP, etc.

  @Prop({ type: [String], default: [] })
  references: string[];

  @Prop({ type: [String], default: [] })
  tags: string[];

  // Referencias
  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignedTo?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  // Timestamps automáticos: createdAt, updatedAt
}

export const FindingSchema = SchemaFactory.createForClass(Finding);

// Índices para consultas operativas y filtrado eficiente
FindingSchema.index({ projectId: 1, status: 1 });
FindingSchema.index({ code: 1 });
FindingSchema.index({ internal_code: 1 }); // Búsqueda por código interno
FindingSchema.index({ severity: 1, status: 1 });
FindingSchema.index({ assignedTo: 1, status: 1 });
FindingSchema.index({ retestIncluded: 1, projectId: 1 }); // Para el scheduler de retest
FindingSchema.index({ tags: 1 });
FindingSchema.index({ cve_id: 1 }); // Búsqueda por CVE

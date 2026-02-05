import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Entidad Evidence
 * Representa archivos de evidencia asociados a hallazgos o actualizaciones
 * Los archivos se almacenan en disco local, esta entidad guarda los metadatos
 */
@Schema({ timestamps: true })
export class Evidence extends Document {
  @Prop({ required: true })
  filename: string; // Nombre original del archivo

  @Prop({ required: true })
  storedFilename: string; // Nombre único en el sistema de archivos (UUID)

  @Prop({ required: true })
  filePath: string; // Ruta completa en el servidor

  @Prop({ required: true })
  mimeType: string;

  @Prop({ required: true })
  size: number; // Tamaño en bytes

  @Prop({ type: Types.ObjectId, ref: 'Finding', required: true })
  findingId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'FindingUpdate' })
  updateId?: Types.ObjectId; // Actualización específica a la que pertenece (opcional)

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  uploadedBy: Types.ObjectId;

  @Prop()
  description?: string;

  // Timestamps automáticos: createdAt, updatedAt

  // Multi-tenant: referencia al tenant
  @Prop({ type: Types.ObjectId, ref: 'Tenant' })
  tenantId?: Types.ObjectId;
}

export const EvidenceSchema = SchemaFactory.createForClass(Evidence);

// Índices para consultar evidencias por hallazgo
EvidenceSchema.index({ findingId: 1, createdAt: -1 });
EvidenceSchema.index({ updateId: 1 });
EvidenceSchema.index({ uploadedBy: 1 });
EvidenceSchema.index({ tenantId: 1 });

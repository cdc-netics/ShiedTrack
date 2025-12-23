import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { FindingUpdateType, FindingStatus } from '../../../common/enums';

/**
 * Entidad FindingUpdate
 * Representa el timeline/audit trail inmutable de un hallazgo
 * Registra todos los cambios, seguimientos y actualizaciones técnicas
 */
@Schema({ timestamps: true })
export class FindingUpdate extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Finding', required: true })
  findingId: Types.ObjectId;

  @Prop({ required: true, enum: FindingUpdateType })
  type: FindingUpdateType;

  @Prop({ required: true })
  content: string; // Descripción de la actualización

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  // Campos específicos para STATUS_CHANGE
  @Prop({ enum: FindingStatus })
  previousStatus?: FindingStatus;

  @Prop({ enum: FindingStatus })
  newStatus?: FindingStatus;

  // Referencias a evidencias subidas en esta actualización
  @Prop({ type: [Types.ObjectId], ref: 'Evidence', default: [] })
  evidenceIds: Types.ObjectId[];

  // Timestamp de creación (inmutable)
  readonly createdAt: Date;

  // Timestamps automáticos: createdAt, updatedAt
}

export const FindingUpdateSchema = SchemaFactory.createForClass(FindingUpdate);

// Índices para consultar timeline por hallazgo
FindingUpdateSchema.index({ findingId: 1, createdAt: -1 }); // Ordenado por fecha descendente
FindingUpdateSchema.index({ createdBy: 1 });

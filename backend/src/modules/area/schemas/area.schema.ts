import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Entidad Área
 * Representa una unidad organizacional dentro de un Cliente
 * Permite segmentar proyectos por departamentos o líneas de negocio
 */
@Schema({ timestamps: true })
export class Area extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  code: string;

  @Prop()
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'Client', required: true })
  clientId: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  // Configuración de nomenclatura
  @Prop()
  findingCodePrefix?: string; // Prefijo personalizado (ej: CIBER)

  @Prop({ default: 1 })
  nextFindingNumber: number; // Consecutivo para hallazgos en esta área

  // Timestamps automáticos: createdAt, updatedAt
}

export const AreaSchema = SchemaFactory.createForClass(Area);

// Índices compuestos para consultas por cliente
AreaSchema.index({ clientId: 1, name: 1 });
AreaSchema.index({ clientId: 1, isActive: 1 });
AreaSchema.index({ clientId: 1, code: 1 }, { unique: true });

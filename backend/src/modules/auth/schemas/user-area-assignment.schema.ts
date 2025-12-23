import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Tabla pivote para asignación explícita Usuario-Área
 * Permite auditoría granular de quién asignó qué y cuándo
 */
@Schema({ timestamps: true })
export class UserAreaAssignment extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Area', required: true })
  areaId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  assignedBy: Types.ObjectId; // Usuario que realizó la asignación (típicamente OWNER)

  @Prop()
  assignedAt: Date; // Timestamp explícito de asignación

  @Prop({ default: true })
  isActive: boolean; // Permite desactivar sin eliminar (soft delete)

  // Timestamps automáticos: createdAt, updatedAt
}

export const UserAreaAssignmentSchema = SchemaFactory.createForClass(UserAreaAssignment);

// Índices para consultas eficientes
UserAreaAssignmentSchema.index({ userId: 1, areaId: 1 }, { unique: true }); // Evita duplicados
UserAreaAssignmentSchema.index({ userId: 1, isActive: 1 }); // Obtener áreas activas de un usuario
UserAreaAssignmentSchema.index({ areaId: 1, isActive: 1 }); // Obtener usuarios de un área
UserAreaAssignmentSchema.index({ assignedBy: 1 }); // Auditoría de asignaciones

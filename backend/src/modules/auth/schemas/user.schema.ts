import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserRole } from '../../../common/enums';

/**
 * Entidad Usuario - Representa a los usuarios del sistema con RBAC
 * Incluye soporte para MFA obligatorio en roles administrativos
 */
@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string; // Hash bcrypt

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, enum: UserRole })
  role: UserRole;

  @Prop({ type: Types.ObjectId, ref: 'Client' })
  clientId?: Types.ObjectId; // Tenant al que pertenece (opcional para OWNER/PLATFORM_ADMIN)

  @Prop({ type: [Types.ObjectId], ref: 'Area', default: [] })
  areaIds: Types.ObjectId[]; // Áreas asignadas (para AREA_ADMIN)

  // Campos de MFA
  @Prop({ default: false })
  mfaEnabled: boolean;

  @Prop()
  mfaSecret?: string; // Secret de TOTP (speakeasy)

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDeleted: boolean; // Soft delete - No eliminar usuarios, solo desactivar

  @Prop()
  deletedAt?: Date; // Fecha de eliminación lógica

  @Prop({ type: Types.ObjectId, ref: 'User' })
  deletedBy?: Types.ObjectId; // Usuario que realizó la eliminación

  @Prop()
  lastLogin?: Date;

  // Timestamps automáticos: createdAt, updatedAt
}

export const UserSchema = SchemaFactory.createForClass(User);

// Índices para optimizar consultas
UserSchema.index({ email: 1 });
UserSchema.index({ clientId: 1, role: 1 });

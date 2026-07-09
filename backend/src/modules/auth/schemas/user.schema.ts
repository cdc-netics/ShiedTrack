import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { UserRole } from "../../../common/enums";

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

  @Prop({ default: false })
  forcePasswordChange: boolean;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop()
  avatarUrl?: string;

  @Prop({ required: true, enum: UserRole })
  role: UserRole;

  @Prop({ type: Types.ObjectId, ref: "Client" })
  clientId?: Types.ObjectId; // Tenant al que pertenece (opcional para OWNER/PLATFORM_ADMIN)

  @Prop({ type: [Types.ObjectId], ref: "Area", default: [] })
  areaIds: Types.ObjectId[]; // Áreas asignadas (para AREA_ADMIN)

  // Proyectos visibles para control de lectura (AUDITOR / visibilidad restringida)
  @Prop({ type: [Types.ObjectId], ref: "Project", default: [] })
  visibleProjectIds: Types.ObjectId[];

  // Clientes visibles (usado cuando auditorVisibilityScope = PER_CLIENT)
  @Prop({ type: [Types.ObjectId], ref: "Client", default: [] })
  visibleClientIds: Types.ObjectId[];

  // Alcance de visibilidad del auditor: PER_PROJECT | PER_CLIENT | ALL_AREA
  @Prop({ type: String, default: null })
  auditorVisibilityScope?: string;

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

  @Prop({ type: Types.ObjectId, ref: "User" })
  deletedBy?: Types.ObjectId; // Usuario que realizó la eliminación

  @Prop()
  lastLogin?: Date;

  // Timestamps automáticos: createdAt, updatedAt
  // Multi-tenant: lista de tenants permitidos para el usuario
  @Prop({ type: [Types.ObjectId], ref: "Tenant", default: [] })
  tenantIds?: Types.ObjectId[];

  // Tenant activo (contexto actual)
  @Prop({ type: Types.ObjectId, ref: "Tenant" })
  activeTenantId?: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Índices para optimizar consultas
UserSchema.index({ email: 1 });
UserSchema.index({ clientId: 1, role: 1 });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

/**
 * Permisos granulares del sistema
 */
export interface Permission {
  resource: string; // 'findings', 'projects', 'clients', 'users', etc.
  actions: string[]; // ['read', 'create', 'update', 'delete', 'export', 'assign']
}

/**
 * Schema para roles personalizados
 * Permite a los administradores crear roles con permisos específicos
 */
@Schema({ timestamps: true })
export class CustomRole extends Document {
  @Prop({ required: true, unique: true })
  name: string; // Ej: "Security Consultant", "Auditor", "Project Manager"

  @Prop({ required: true })
  displayName: string;

  @Prop()
  description: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Client', required: false })
  clientId?: MongooseSchema.Types.ObjectId; // null = rol global, si tiene valor = rol específico del tenant

  @Prop({ type: [Object], required: true })
  permissions: Permission[]; // Array de permisos granulares

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isSystem: boolean; // Roles del sistema (OWNER, ADMIN, etc.) no se pueden eliminar

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  updatedBy?: MongooseSchema.Types.ObjectId;
}

export const CustomRoleSchema = SchemaFactory.createForClass(CustomRole);

// Índices
CustomRoleSchema.index({ name: 1, clientId: 1 }, { unique: true });
CustomRoleSchema.index({ isActive: 1 });
CustomRoleSchema.index({ isSystem: 1 });

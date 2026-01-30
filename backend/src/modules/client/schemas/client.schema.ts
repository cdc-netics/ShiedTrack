import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Entidad Cliente (Tenant)
 * Representa la unidad de multi-tenancy del sistema
 * Cada cliente es un tenant lógico aislado
 */
@Schema({ timestamps: true })
export class Client extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  displayName?: string; // Nombre corto para mostrar en UI (ej: "ACME")

  @Prop({ unique: true, sparse: true })
  code?: string; // Código identificador corto (ej: CLI001)

  @Prop()
  description?: string;

  @Prop()
  contactEmail?: string;

  @Prop()
  contactPhone?: string;

  @Prop({ default: true })
  isActive: boolean;

  // Multi-tenant: ESTE ES EL TENANT RAÍZ
  // Los clientes SON tenants, no tienen tenantId padre
  // Solo se usa tenantId si un cliente es sub-tenant de otro (arquitectura avanzada)

  // Timestamps automáticos: createdAt, updatedAt
}

export const ClientSchema = SchemaFactory.createForClass(Client);

// Índices para búsquedas eficientes
ClientSchema.index({ name: 1 });
ClientSchema.index({ code: 1 });
ClientSchema.index({ isActive: 1 });

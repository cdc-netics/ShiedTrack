import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { multiTenantPlugin } from '../../../common/plugins/multi-tenant.plugin';

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

  /**
   * Cliente asociado (LEGACY)
   * Mantenido solo para compatibilidad hacia atrás.
   * En el nuevo modelo multi-tenant, el límite de seguridad es el tenant.
   */
  @Prop({ type: Types.ObjectId, ref: 'Client' })
  clientId?: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  // Configuración de nomenclatura
  @Prop()
  findingCodePrefix?: string; // Prefijo personalizado (ej: CIBER)

  @Prop({ default: 1 })
  nextFindingNumber: number; // Consecutivo para hallazgos en esta área

  // Timestamps automáticos: createdAt, updatedAt

  // Multi-tenant: referencia al tenant
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;
}

export const AreaSchema = SchemaFactory.createForClass(Area);

// Aplicar plugin de multi-tenancy
AreaSchema.plugin(multiTenantPlugin);

// Índices compuestos para consultas por tenant (nuevo modelo)
AreaSchema.index({ tenantId: 1, name: 1 });
AreaSchema.index({ tenantId: 1, isActive: 1 });
AreaSchema.index({ tenantId: 1, code: 1 }, { unique: true });

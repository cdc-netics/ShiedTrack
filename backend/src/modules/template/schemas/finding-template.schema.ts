import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type FindingTemplateDocument = FindingTemplate & Document;

/**
 * Plantilla de Hallazgos (FindingTemplate)
 * Base de conocimiento para acelerar la carga de hallazgos repetitivos
 * 
 * Scope:
 * - GLOBAL: Disponible para todos los clientes (OWASP Top 10, CWE comunes)
 * - TENANT: Específico de un cliente (hallazgos recurrentes del cliente)
 */
@Schema({ timestamps: true })
export class FindingTemplate {
  @ApiProperty({ example: 'SQL Injection en Login', description: 'Título del hallazgo' })
  @Prop({ required: true, index: 'text' })
  title: string;

  @ApiProperty({ example: 'Se detectó vulnerabilidad de inyección SQL...', description: 'Descripción del hallazgo' })
  @Prop({ required: true, index: 'text' })
  description: string;

  @ApiProperty({ example: 'Implementar prepared statements y validación de entrada...', description: 'Recomendación de remediación' })
  @Prop({ required: true, index: 'text' })
  recommendation: string;

  @ApiProperty({ example: 'CRITICAL', description: 'Severidad sugerida' })
  @Prop({ required: true, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] })
  severity: string;

  @ApiProperty({ example: 'CAT-WEB-001', description: 'Código interno de categorización' })
  @Prop({ index: true })
  internal_code?: string;

  @ApiProperty({ example: 9.8, description: 'CVSS Score sugerido (0-10)' })
  @Prop({ min: 0, max: 10 })
  cvss_score?: number;

  @ApiProperty({ example: 'CWE-89', description: 'Código CWE asociado' })
  @Prop()
  cwe_id?: string;

  @ApiProperty({ 
    example: [
      { label: 'OWASP Top 10 - A03:2021', url: 'https://owasp.org/Top10/A03_2021-Injection/' },
      { label: 'CWE-89', url: 'https://cwe.mitre.org/data/definitions/89.html' }
    ], 
    description: 'Referencias estructuradas (label + url)' 
  })
  @Prop({ 
    type: [{ 
      label: { type: String, required: true }, 
      url: { type: String, required: true } 
    }], 
    default: [] 
  })
  references: Array<{ label: string; url: string }>;

  @ApiProperty({ example: ['sql', 'injection', 'database', 'cwe-89'], description: 'Etiquetas de búsqueda' })
  @Prop({ type: [String], default: [], index: true })
  tags: string[];

  @ApiProperty({ example: 'GLOBAL', description: 'Alcance: GLOBAL (todos los clientes) o TENANT (cliente específico)' })
  @Prop({ required: true, enum: ['GLOBAL', 'TENANT'], default: 'GLOBAL', index: true })
  scope: string;

  /**
   * @deprecated Usar tenantId para plantillas TENANT
   */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Client' })
  clientId?: MongooseSchema.Types.ObjectId;

  @ApiProperty({ example: '65f3a2b1c9d8e4f6a7b8c9d0', description: 'ID del tenant (si aplica)' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Tenant' })
  tenantId?: MongooseSchema.Types.ObjectId;

  @ApiProperty({ example: 42, description: 'Número de veces que se ha aplicado esta plantilla' })
  @Prop({ default: 0 })
  usageCount: number;

  @ApiProperty({ example: '65f3a2b1c9d8e4f6a7b8c9d0', description: 'Usuario que creó la plantilla' })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: MongooseSchema.Types.ObjectId;

  @ApiProperty({ example: true, description: 'Plantilla activa/inactiva' })
  @Prop({ default: true })
  isActive: boolean;
}

export const FindingTemplateSchema = SchemaFactory.createForClass(FindingTemplate);

// Índice compuesto para búsquedas eficientes
FindingTemplateSchema.index({ scope: 1, isActive: 1, usageCount: -1 });

// Índice de texto completo para autocompletado
FindingTemplateSchema.index({ 
  title: 'text', 
  description: 'text', 
  tags: 'text' 
}, {
  weights: { title: 10, tags: 5, description: 1 },
  name: 'template_search_index'
});

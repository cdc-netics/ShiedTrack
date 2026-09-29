import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

/**
 * Entidad Evidence
 * Representa archivos de evidencia asociados a hallazgos o actualizaciones
 * Los archivos se almacenan en disco local, esta entidad guarda los metadatos
 */
@Schema({ timestamps: true })
export class Evidence extends Document {
  // "FILE" = archivo subido y almacenado en disco (default); "LINK" = enlace externo
  // (ej. SharePoint) para evidencias que exceden el límite de tamaño, como videos grandes
  @Prop({ required: true, enum: ["FILE", "LINK"], default: "FILE" })
  evidenceType: "FILE" | "LINK";

  @Prop({ required: true })
  filename: string; // Nombre original del archivo, o etiqueta descriptiva si es un LINK

  @Prop()
  storedFilename?: string; // Nombre único en el sistema de archivos (UUID) — solo FILE

  @Prop()
  filePath?: string; // Ruta completa en el servidor — solo FILE

  @Prop()
  mimeType?: string; // Solo FILE

  @Prop()
  size?: number; // Tamaño en bytes — solo FILE

  @Prop()
  externalUrl?: string; // URL del enlace externo — solo LINK

  @Prop({ type: Types.ObjectId, ref: "Finding", required: true })
  findingId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "FindingUpdate" })
  updateId?: Types.ObjectId; // Actualización específica a la que pertenece (opcional)

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  uploadedBy: Types.ObjectId;

  @Prop()
  description?: string;

  // Timestamps automáticos: createdAt, updatedAt

  // Multi-tenant: referencia al tenant
  @Prop({ type: Types.ObjectId, ref: "Tenant" })
  tenantId?: Types.ObjectId;
}

export const EvidenceSchema = SchemaFactory.createForClass(Evidence);

// Índices para consultar evidencias por hallazgo
EvidenceSchema.index({ findingId: 1, createdAt: -1 });
EvidenceSchema.index({ updateId: 1 });
EvidenceSchema.index({ uploadedBy: 1 });
EvidenceSchema.index({ tenantId: 1 });

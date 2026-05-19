import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import {
  FindingSeverity,
  FindingStatus,
  CloseReason,
} from "../../../common/enums";
import { multiTenantPlugin } from "../../../common/plugins/multi-tenant.plugin";

/**
 * Entidad Hallazgo (Finding)
 * Representa una vulnerabilidad o problema de ciberseguridad identificado
 */
@Schema({ timestamps: true })
export class Finding extends Document {
  /**
   * ID operativo humano (ej: VULN-2026-000001). Se asigna solo en el servidor
   * mediante contador atómico (pre-save); no debe enviarse desde el cliente.
   */
  @Prop({ required: false, unique: true })
  code!: string;

  @Prop({ required: true })
  internal_code!: string; // Código interno de categorización (ej: CAT-WEB-001)

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  description!: string; // Soporta HTML/Markdown seguro

  @Prop({ required: true, enum: FindingSeverity })
  severity!: FindingSeverity;

  @Prop({ required: true, enum: FindingStatus, default: FindingStatus.OPEN })
  status!: FindingStatus;

  @Prop({ type: Types.ObjectId, ref: "Project", required: true })
  projectId!: Types.ObjectId;

  /**
   * Define si este hallazgo debe incluirse en el retest del proyecto
   * El retest se configura a nivel proyecto, pero cada hallazgo puede opt-in/opt-out
   */
  @Prop({ default: true })
  retestIncluded!: boolean;

  @Prop({ enum: CloseReason })
  closeReason?: CloseReason;

  @Prop()
  closedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: "User" })
  closedBy?: Types.ObjectId;

  // Información técnica adicional
  @Prop()
  affectedAsset?: string; // DEPRECATED: Usar affectedAssets

  @Prop({ type: [String], default: [] })
  affectedAssets!: string[]; // Activos afectados (IPs, URLs, Hostnames)

  @Prop({ enum: FindingSeverity })
  businessRisk?: FindingSeverity; // Nivel de riesgo de negocio

  @Prop()
  riskJustification?: string; // Justificación del riesgo

  @Prop({ min: 0, max: 10 })
  cvss_score?: number; // CVSS Score validado 0-10 con decimales

  @Prop({
    validate: {
      validator: (v: string) => !v || /^CVE-\d{4}-\d{4,7}$/.test(v),
      message: "CVE ID debe tener formato CVE-YYYY-NNNN (ej: CVE-2024-12345)",
    },
  })
  cve_id?: string; // ID CVE validado con regex

  @Prop()
  detection_source?: string; // IP o URL de origen de la detección

  @Prop()
  cweId?: string;

  @Prop()
  recommendation?: string; // Recomendación de remediación

  @Prop()
  impact?: string; // Descripción del impacto

  @Prop()
  implications?: string; // Implicancias del hallazgo

  @Prop({ type: [String], default: [] })
  controls!: string[]; // Controles CIS, NIST, OWASP, etc.

  @Prop({ type: [String], default: [] })
  references!: string[];

  @Prop({ type: [String], default: [] })
  tags!: string[];

  // Referencias
  @Prop({ type: Types.ObjectId, ref: "User" })
  assignedTo?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  createdBy!: Types.ObjectId;

  // Timestamps automáticos: createdAt, updatedAt

  // Multi-tenant: referencia al tenant
  @Prop({ type: Types.ObjectId, ref: "Tenant" })
  tenantId?: Types.ObjectId;
}

export const FindingSchema = SchemaFactory.createForClass(Finding);

// Aplicar plugin de multi-tenancy para aislamiento automático
FindingSchema.plugin(multiTenantPlugin);

// Índices para consultas operativas y filtrado eficiente
FindingSchema.index({ projectId: 1, status: 1 });
FindingSchema.index({ code: 1 });
FindingSchema.index({ internal_code: 1 }); // Búsqueda por código interno
FindingSchema.index({ severity: 1, status: 1 });
FindingSchema.index({ assignedTo: 1, status: 1 });
FindingSchema.index({ retestIncluded: 1, projectId: 1 }); // Para el scheduler de retest
FindingSchema.index({ tags: 1 });
FindingSchema.index({ cve_id: 1 }); // Búsqueda por CVE
FindingSchema.index({ tenantId: 1 });

// Índice compuesto para consultas de métricas/BI
FindingSchema.index({
  tenantId: 1,
  projectId: 1,
  severity: 1,
  status: 1,
  createdAt: 1,
});

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Asignación del correlativo en pre-save (solo documentos nuevos):
 * - Ignora cualquier `code` enviado por el cliente (integridad del lado servidor).
 * - Usa la colección `counters` con findOneAndUpdate + $inc: es una única operación
 *   atómica en MongoDB. Dos peticiones concurrentes no pueden obtener el mismo
 *   número: el servidor serializa el incremento en el documento del contador.
 * - Esto NO es equivalente a consultar el "valor más alto" en hallazgos y sumar 1:
 *   entre la lectura del máximo y el insert pueden intercalarse otros inserts (condición
 *   de carrera). Con findOneAndUpdate el incremento es indivisible.
 *
 * Nota: Mongoose valida `required` antes de pre-save; por eso `code` no es `required`
 * en el esquema y se rellena aquí antes de persistir (siempre en altas nuevas).
 */
FindingSchema.pre("save", async function () {
  if (!this.isNew) {
    return;
  }

  const doc = this as Finding & { isNew?: boolean };
  (doc as unknown as { code?: string }).code = undefined;

  const tenantId = doc.tenantId;
  const projectId = doc.projectId;
  if (!tenantId || !projectId) {
    throw new Error(
      "No se puede asignar correlativo: faltan tenantId o projectId",
    );
  }

  const ProjectModel = doc.db.model("Project");
  const CounterModel = doc.db.model("Counter");

  const project = await ProjectModel.findById(projectId)
    .populate("areaId")
    .populate("areaIds")
    .exec();

  if (!project) {
    throw new Error("Proyecto no encontrado para asignar prefijo de código");
  }

  let prefix = "VULN";
  const p = project as {
    areaIds?: unknown[];
    areaId?: { findingCodePrefix?: string };
  };
  if (p.areaIds && p.areaIds.length > 0) {
    const firstArea = p.areaIds[0] as { findingCodePrefix?: string };
    if (firstArea?.findingCodePrefix) prefix = firstArea.findingCodePrefix;
  } else if (p.areaId && (p.areaId as { findingCodePrefix?: string }).findingCodePrefix) {
    prefix = (p.areaId as { findingCodePrefix: string }).findingCodePrefix;
  }

  const year = new Date().getFullYear();
  const counterKey = `findings:${tenantId.toString()}:${prefix}:${year}`;
  const FindingModel = doc.db.model("Finding");
  const codePattern = new RegExp(`^${escapeRegex(prefix)}-${year}-(\\d{6})$`);
  const latestFinding = await FindingModel.findOne({ code: codePattern })
    .sort({ code: -1 })
    .select("code")
    .lean<{ code?: string }>()
    .exec();
  const latestSequence = latestFinding?.code?.match(/-(\d{6})$/)?.[1];
  const latestSequenceNumber = latestSequence ? Number(latestSequence) : 0;

  if (latestSequenceNumber > 0) {
    await CounterModel.findOneAndUpdate(
      { id: counterKey },
      { $max: { seq: latestSequenceNumber } },
      { upsert: true, setDefaultsOnInsert: true },
    );
  }

  const counter = await CounterModel.findOneAndUpdate(
    { id: counterKey },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  if (!counter) {
    throw new Error("No se pudo obtener correlativo atómico para el hallazgo");
  }

  doc.code = `${prefix}-${year}-${String(counter.seq).padStart(6, "0")}`;
});

import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsArray,
  IsMongoId,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  FindingSeverity,
  FindingStatus,
  CloseReason,
} from "../../../common/enums";

/**
 * DTO para crear un nuevo hallazgo
 */
export class CreateFindingDto {
  @ApiProperty({
    example: "CAT-HIGH-001",
    description: "Código interno de categorización",
  })
  @IsString()
  internal_code: string;

  @ApiProperty({
    example: "SQL Injection en formulario de login",
    description: "Título del hallazgo",
  })
  @IsString()
  title: string;

  @ApiProperty({ description: "Descripción detallada del hallazgo" })
  @IsString()
  description: string;

  @ApiProperty({ enum: FindingSeverity, example: FindingSeverity.HIGH })
  @IsEnum(FindingSeverity)
  severity: FindingSeverity;

  @ApiProperty({ description: "ID del proyecto al que pertenece" })
  @IsMongoId({ message: "projectId debe ser un ObjectId válido" })
  projectId: string;

  @ApiPropertyOptional({
    example: true,
    description: "Si debe incluirse en el retest",
  })
  @IsOptional()
  @IsBoolean()
  retestIncluded?: boolean;

  @ApiPropertyOptional({ description: "Sistema o activo afectado" })
  @IsOptional()
  @IsString()
  affectedAsset?: string;

  @ApiPropertyOptional({
    type: [String],
    description: "Lista de activos afectados",
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  affectedAssets?: string[];

  @ApiPropertyOptional({
    enum: FindingSeverity,
    description: "Nivel de riesgo de negocio",
  })
  @IsOptional()
  @IsEnum(FindingSeverity)
  businessRisk?: FindingSeverity;

  @ApiPropertyOptional({ description: "Justificación del nivel de riesgo" })
  @IsOptional()
  @IsString()
  riskJustification?: string;

  @ApiPropertyOptional({ example: 7.5, description: "Puntaje CVSS" })
  @IsOptional()
  @IsNumber()
  cvssScore?: number;

  @ApiPropertyOptional({ example: "CVE-2024-12345", description: "ID de CVE" })
  @IsOptional()
  @IsString()
  cve_id?: string;

  @ApiPropertyOptional({ description: "IP, URL u origen de detecciÃ³n" })
  @IsOptional()
  @IsString()
  detection_source?: string;

  @ApiPropertyOptional({ example: "CWE-89", description: "ID de CWE" })
  @IsOptional()
  @IsString()
  cweId?: string;

  @ApiPropertyOptional({ description: "Recomendación de remediación" })
  @IsOptional()
  @IsString()
  recommendation?: string;

  @ApiPropertyOptional({ description: "Descripción del impacto" })
  @IsOptional()
  @IsString()
  impact?: string;

  @ApiPropertyOptional({ description: "Implicancias del hallazgo" })
  @IsOptional()
  @IsString()
  implications?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ["CIS 5.1", "NIST AC-2"],
    description: "Controles aplicables",
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  controls?: string[];

  @ApiPropertyOptional({ type: [String], description: "Referencias externas" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  references?: string[];

  @ApiPropertyOptional({ type: [String], example: ["web", "injection"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: "ID del usuario asignado" })
  @IsOptional()
  @IsMongoId({ message: "assignedTo debe ser un ObjectId válido" })
  assignedTo?: string;
}

/**
 * DTO para actualizar un hallazgo
 */
export class UpdateFindingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: FindingSeverity })
  @IsOptional()
  @IsEnum(FindingSeverity)
  severity?: FindingSeverity;

  @ApiPropertyOptional({ enum: FindingStatus })
  @IsOptional()
  @IsEnum(FindingStatus)
  status?: FindingStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  retestIncluded?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  affectedAsset?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  affectedAssets?: string[];

  @ApiPropertyOptional({ enum: FindingSeverity })
  @IsOptional()
  @IsEnum(FindingSeverity)
  businessRisk?: FindingSeverity;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  riskJustification?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  cvssScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cve_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  detection_source?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cweId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recommendation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  impact?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  implications?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  controls?: string[];

  @ApiPropertyOptional({ type: [String], description: "Referencias externas" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  references?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId({ message: "assignedTo debe ser un ObjectId válido" })
  assignedTo?: string;

  @ApiPropertyOptional({
    description: "Proyecto asociado (uso interno controlado)",
  })
  @IsOptional()
  @IsMongoId({ message: "projectId debe ser un ObjectId válido" })
  projectId?: string;
}

/**
 * DTO para cerrar un hallazgo
 */
export class CloseFindingDto {
  @ApiProperty({ enum: CloseReason, example: CloseReason.FIXED })
  @IsEnum(CloseReason)
  closeReason: CloseReason;

  @ApiPropertyOptional({ description: "Comentario sobre el cierre" })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class BulkCloseFindingsDto {
  @ApiProperty({ type: [String], description: "IDs de hallazgos a cerrar" })
  @IsArray()
  @IsMongoId({ each: true, message: "Cada id debe ser un ObjectId válido" })
  ids: string[];

  @ApiPropertyOptional({ enum: CloseReason, description: "Motivo de cierre en bloque" })
  @IsOptional()
  @IsEnum(CloseReason)
  closeReason?: CloseReason;
}

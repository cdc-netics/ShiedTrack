import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FindingSeverity, FindingStatus, CloseReason } from '../../../common/enums';

/**
 * DTO para crear un nuevo hallazgo
 */
export class CreateFindingDto {
  @ApiProperty({ example: 'FIND-2024-001', description: 'Código identificador del hallazgo' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'CAT-HIGH-001', description: 'Código interno de categorización' })
  @IsString()
  internal_code: string;

  @ApiProperty({ example: 'SQL Injection en formulario de login', description: 'Título del hallazgo' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Descripción detallada del hallazgo' })
  @IsString()
  description: string;

  @ApiProperty({ enum: FindingSeverity, example: FindingSeverity.HIGH })
  @IsEnum(FindingSeverity)
  severity: FindingSeverity;

  @ApiProperty({ description: 'ID del proyecto al que pertenece' })
  @IsString()
  projectId: string;

  @ApiPropertyOptional({ example: true, description: 'Si debe incluirse en el retest' })
  @IsOptional()
  @IsBoolean()
  retestIncluded?: boolean;

  @ApiPropertyOptional({ description: 'Sistema o activo afectado' })
  @IsOptional()
  @IsString()
  affectedAsset?: string;

  @ApiPropertyOptional({ example: 7.5, description: 'Puntaje CVSS' })
  @IsOptional()
  @IsNumber()
  cvssScore?: number;

  @ApiPropertyOptional({ example: 'CWE-89', description: 'ID de CWE' })
  @IsOptional()
  @IsString()
  cweId?: string;

  @ApiPropertyOptional({ description: 'Recomendación de remediación' })
  @IsOptional()
  @IsString()
  recommendation?: string;

  @ApiPropertyOptional({ description: 'Descripción del impacto' })
  @IsOptional()
  @IsString()
  impact?: string;

  @ApiPropertyOptional({ description: 'Implicancias del hallazgo' })
  @IsOptional()
  @IsString()
  implications?: string;

  @ApiPropertyOptional({ type: [String], example: ['CIS 5.1', 'NIST AC-2'], description: 'Controles aplicables' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  controls?: string[];

  @ApiPropertyOptional({ type: [String], example: ['web', 'injection'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'ID del usuario asignado' })
  @IsOptional()
  @IsString()
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  cvssScore?: number;

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

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedTo?: string;
}

/**
 * DTO para cerrar un hallazgo
 */
export class CloseFindingDto {
  @ApiProperty({ enum: CloseReason, example: CloseReason.FIXED })
  @IsEnum(CloseReason)
  closeReason: CloseReason;

  @ApiPropertyOptional({ description: 'Comentario sobre el cierre' })
  @IsOptional()
  @IsString()
  comment?: string;
}

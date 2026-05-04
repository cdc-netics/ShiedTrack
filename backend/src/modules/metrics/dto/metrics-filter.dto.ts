import { IsOptional, IsDateString, IsString, IsEnum } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export enum MetricsExportFormat {
  JSON = "json",
  CSV = "csv",
}

/**
 * DTO de filtros comunes para todos los endpoints de métricas.
 * Todos los campos son opcionales. Si no se proveen fechas, se devuelven
 * todos los registros existentes (sin límite temporal).
 */
export class MetricsFilterDto {
  @ApiPropertyOptional({
    description: "Fecha de inicio del rango (ISO 8601). Ej: 2025-01-01",
    example: "2025-01-01",
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description: "Fecha de fin del rango (ISO 8601). Ej: 2025-12-31",
    example: "2025-12-31",
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    description: "ID del tenant para filtrar (ObjectId de MongoDB)",
    example: "66a0f5c3e4b08a1d2c3e4f50",
  })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional({
    description: "ID del cliente para filtrar (ObjectId de MongoDB)",
    example: "66a0f5c3e4b08a1d2c3e4f51",
  })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({
    description: "ID del proyecto para filtrar (ObjectId de MongoDB)",
    example: "66a0f5c3e4b08a1d2c3e4f52",
  })
  @IsOptional()
  @IsString()
  projectId?: string;
}

/**
 * DTO para el endpoint de exportación. Extiende MetricsFilterDto
 * agragando el parámetro de formato de salida.
 */
export class MetricsExportFilterDto extends MetricsFilterDto {
  @ApiPropertyOptional({
    description: "Formato de exportación",
    enum: MetricsExportFormat,
    default: MetricsExportFormat.JSON,
  })
  @IsOptional()
  @IsEnum(MetricsExportFormat)
  format?: MetricsExportFormat = MetricsExportFormat.JSON;
}

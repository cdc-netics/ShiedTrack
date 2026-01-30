import { IsString, IsEnum, IsOptional, IsArray, IsNumber, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para crear plantilla de hallazgo
 */
export class CreateTemplateDto {
  @ApiProperty({ example: 'SQL Injection en Login', description: 'Título del hallazgo' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Se detectó vulnerabilidad de inyección SQL...', description: 'Descripción del hallazgo' })
  @IsString()
  description: string;

  @ApiProperty({ example: 'Implementar prepared statements...', description: 'Recomendación de remediación' })
  @IsString()
  recommendation: string;

  @ApiProperty({ example: 'CRITICAL', description: 'Severidad sugerida' })
  @IsEnum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'])
  severity: string;

  @ApiPropertyOptional({ example: 'CAT-WEB-001', description: 'Código interno de categorización' })
  @IsOptional()
  @IsString()
  internal_code?: string;

  @ApiPropertyOptional({ example: 9.8, description: 'CVSS Score sugerido (0-10)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  cvss_score?: number;

  @ApiPropertyOptional({ example: 'CWE-89', description: 'Código CWE asociado' })
  @IsOptional()
  @IsString()
  cwe_id?: string;

  @ApiPropertyOptional({ 
    example: [
      { label: 'OWASP Top 10 - A03:2021', url: 'https://owasp.org/Top10/A03_2021-Injection/' }
    ], 
    description: 'Referencias estructuradas' 
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReferenceDto)
  references?: ReferenceDto[];

  @ApiPropertyOptional({ example: ['sql', 'injection', 'database'], description: 'Etiquetas de búsqueda' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ example: 'GLOBAL', description: 'Alcance: GLOBAL o TENANT' })
  @IsEnum(['GLOBAL', 'TENANT'])
  scope: string;

  @ApiPropertyOptional({ example: '65f3a2b1c9d8e4f6a7b8c9d0', description: 'ID del cliente (si scope=TENANT)' })
  @IsOptional()
  @IsString()
  tenantId?: string;
}

/**
 * DTO para referencias estructuradas
 */
export class ReferenceDto {
  @ApiProperty({ example: 'OWASP Top 10 - A03:2021' })
  @IsString()
  label: string;

  @ApiProperty({ example: 'https://owasp.org/Top10/A03_2021-Injection/' })
  @IsString()
  url: string;
}

/**
 * DTO para búsqueda de plantillas
 */
export class SearchTemplateDto {
  @ApiPropertyOptional({ example: 'sql injection', description: 'Búsqueda por texto' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ example: 20, description: 'Límite de resultados' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

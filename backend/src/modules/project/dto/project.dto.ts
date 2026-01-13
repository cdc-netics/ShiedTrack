import { IsString, IsOptional, IsEnum, IsBoolean, IsDateString, IsArray, IsEmail, IsNumber, ValidateNested, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceArchitecture, ProjectStatus } from '../../../common/enums';

/**
 * DTO para configuración de notificaciones
 */
export class NotifyConfigDto {
  @IsArray()
  @IsEmail({}, { each: true })
  @ArrayMaxSize(3, { message: 'Máximo 3 destinatarios de notificaciones' })
  recipients: string[];

  @IsArray()
  @IsNumber({}, { each: true })
  offsetDays: number[];
}

/**
 * DTO para configuración de política de Retest
 */
export class RetestPolicyDto {
  @ApiProperty({ example: true, description: 'Si el retest está habilitado' })
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional({ example: '2024-06-15', description: 'Fecha del próximo retest' })
  @IsOptional()
  @IsDateString()
  nextRetestAt?: string;

  @ApiPropertyOptional({
    type: 'object',
    properties: {
      recipients: { type: 'array', items: { type: 'string' } },
      offsetDays: { type: 'array', items: { type: 'number' } },
    },
    description: 'Configuración de notificaciones',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => NotifyConfigDto)
  notify?: NotifyConfigDto;
}

/**
 * DTO para crear un nuevo proyecto
 */
export class CreateProjectDto {
  @ApiProperty({ example: 'Pentest Aplicación Web 2024', description: 'Nombre del proyecto' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'PROJ-2024-001', description: 'Código identificador' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Descripción del proyecto' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'ID del cliente' })
  @IsString()
  clientId: string;

  @ApiPropertyOptional({ description: 'ID del área (Legacy)' })
  @IsOptional()
  @IsString()
  areaId?: string;

  @ApiPropertyOptional({ description: 'IDs de las áreas asignadas', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  areaIds?: string[];

  @ApiProperty({ enum: ServiceArchitecture, example: ServiceArchitecture.WEB })
  @IsEnum(ServiceArchitecture)
  serviceArchitecture: ServiceArchitecture;

  @ApiPropertyOptional({ type: RetestPolicyDto, description: 'Configuración de retest' })
  @IsOptional()
  @ValidateNested()
  @Type(() => RetestPolicyDto)
  retestPolicy?: RetestPolicyDto;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

/**
 * DTO para actualizar un proyecto
 */
export class UpdateProjectDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ServiceArchitecture })
  @IsOptional()
  @IsEnum(ServiceArchitecture)
  serviceArchitecture?: ServiceArchitecture;

  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  projectStatus?: ProjectStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  areaIds?: string[];

  @ApiPropertyOptional({ type: RetestPolicyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => RetestPolicyDto)
  retestPolicy?: RetestPolicyDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

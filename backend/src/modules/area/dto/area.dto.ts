import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para crear una nueva área
 */
export class CreateAreaDto {
  @ApiProperty({ example: 'TI - Infraestructura', description: 'Nombre del área' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Descripción del área' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Prefijo para códigos de hallazgos' })
  @IsOptional()
  @IsString()
  findingCodePrefix?: string;

  /**
   * Contexto de tenant (opcional).
   * Normalmente el backend lo determina desde CLS/headers y no es necesario enviarlo.
   */
  @ApiPropertyOptional({ description: 'ID del tenant (opcional, generalmente derivado del contexto)' })
  @IsOptional()
  @IsString()
  tenantId?: string;
}

/**
 * DTO para actualizar un área
 */
export class UpdateAreaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  findingCodePrefix?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

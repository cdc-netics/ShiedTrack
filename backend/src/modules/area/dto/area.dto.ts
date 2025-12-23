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

  @ApiProperty({ description: 'ID del cliente al que pertenece el área' })
  @IsString()
  clientId: string;
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
  @IsBoolean()
  isActive?: boolean;
}

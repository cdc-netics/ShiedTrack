import { IsString, IsOptional, IsBoolean, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para crear un nuevo cliente
 */
export class CreateClientDto {
  @ApiProperty({ example: 'Acme Corporation', description: 'Nombre del cliente' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'CLI001', description: 'Código identificador corto' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Descripción del cliente' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'contact@acme.com' })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional({ example: '+56912345678' })
  @IsOptional()
  @IsString()
  contactPhone?: string;
}

/**
 * DTO para actualizar un cliente
 */
export class UpdateClientDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

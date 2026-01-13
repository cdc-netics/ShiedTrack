import { IsString, IsOptional, IsBoolean, IsEmail, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO para crear el primer admin del tenant
 */
export class CreateTenantAdminDto {
  @ApiProperty({ example: 'admin@acme.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;
}

/**
 * DTO para crear un nuevo cliente (tenant)
 */
export class CreateClientDto {
  @ApiProperty({ example: 'Acme Corporation', description: 'Nombre del cliente' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'ACME', description: 'Nombre corto para mostrar en UI' })
  @IsOptional()
  @IsString()
  displayName?: string;

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

  @ApiPropertyOptional({ 
    description: 'Crear primer usuario admin del tenant (opcional)',
    type: CreateTenantAdminDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateTenantAdminDto)
  initialAdmin?: CreateTenantAdminDto;
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

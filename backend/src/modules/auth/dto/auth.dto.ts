import { IsEmail, IsEnum, IsString, IsOptional, IsBoolean, MinLength, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../common/enums';

/**
 * DTO para registro de nuevos usuarios
 */
export class RegisterUserDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email del usuario' })
  @IsEmail({}, { message: 'Debe ser un email válido' })
  email: string;

  @ApiProperty({ example: 'SecureP@ssw0rd', description: 'Contraseña del usuario (mínimo 8 caracteres)' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @ApiProperty({ example: 'Juan', description: 'Nombre del usuario' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Pérez', description: 'Apellido del usuario' })
  @IsString()
  lastName: string;

  @ApiProperty({ enum: UserRole, example: UserRole.ANALYST, description: 'Rol del usuario' })
  @IsEnum(UserRole, { message: 'Rol inválido' })
  role: UserRole;

  @ApiPropertyOptional({ description: 'ID del cliente (tenant) al que pertenece' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({ type: [String], description: 'IDs de áreas asignadas (para AREA_ADMIN)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  areaIds?: string[];
}

/**
 * DTO para inicio de sesión
 */
export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecureP@ssw0rd' })
  @IsString()
  password: string;

  @ApiPropertyOptional({ example: '123456', description: 'Código TOTP de MFA (si está habilitado)' })
  @IsOptional()
  @IsString()
  mfaToken?: string;
}

/**
 * DTO para habilitar MFA
 */
export class EnableMfaDto {
  @ApiProperty({ example: '123456', description: 'Código TOTP para verificar' })
  @IsString()
  token: string;
}

/**
 * DTO para actualizar usuario
 */
export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  areaIds?: string[];
}

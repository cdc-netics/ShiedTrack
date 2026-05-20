import {
  IsEmail,
  IsEnum,
  IsString,
  IsOptional,
  IsBoolean,
  MinLength,
  IsArray,
  IsMongoId,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { UserRole } from "../../../common/enums";

/**
 * DTO para registro de nuevos usuarios
 */
export class RegisterUserDto {
  @ApiProperty({
    example: "user@example.com",
    description: "Email del usuario",
  })
  @IsEmail({}, { message: "Debe ser un email válido" })
  email: string;

  @ApiProperty({
    example: "SecureP@ssw0rd",
    description: "Contraseña del usuario (mínimo 6 caracteres)",
  })
  @IsString()
  @MinLength(6, { message: "La contraseña debe tener al menos 6 caracteres" })
  password: string;

  @ApiProperty({ example: "Juan", description: "Nombre del usuario" })
  @IsString()
  firstName: string;

  @ApiProperty({ example: "Pérez", description: "Apellido del usuario" })
  @IsString()
  lastName: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.ANALYST,
    description: "Rol del usuario",
  })
  @IsEnum(UserRole, { message: "Rol inválido" })
  role: UserRole;

  @ApiPropertyOptional({
    description: "ID del cliente (tenant) al que pertenece",
  })
  @IsOptional()
  @IsMongoId({ message: "clientId debe ser un ObjectId válido" })
  clientId?: string;

  @ApiPropertyOptional({
    type: [String],
    description: "IDs de áreas asignadas (para AREA_ADMIN)",
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true, message: "Cada areaId debe ser un ObjectId válido" })
  areaIds?: string[];
}

/**
 * DTO para inicio de sesión
 */
export class LoginDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "SecureP@ssw0rd" })
  @IsString()
  password: string;

  @ApiPropertyOptional({
    example: "123456",
    description: "Código TOTP de MFA (si está habilitado)",
  })
  @IsOptional()
  @IsString()
  mfaToken?: string;
}

/**
 * DTO para habilitar MFA
 */
export class EnableMfaDto {
  @ApiProperty({ example: "123456", description: "Código TOTP para verificar" })
  @IsString()
  token: string;
}

/**
 * DTO para actualizar usuario
 */
export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail({}, { message: "Debe ser un email válido" })
  email?: string;

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
  @IsMongoId({ message: "clientId debe ser un ObjectId válido" })
  clientId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true, message: "Cada areaId debe ser un ObjectId válido" })
  areaIds?: string[];

  @ApiPropertyOptional({
    description: "Nueva contraseña del usuario (mínimo 6 caracteres)",
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: "La contraseña debe tener al menos 6 caracteres" })
  password?: string;

  @ApiPropertyOptional({
    description: "URL de avatar del usuario",
    example: "https://example.com/avatar.png",
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail({}, { message: "Debe ser un email válido" })
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    description: "URL de avatar del usuario",
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: "Contraseña actual (requerida para cambiar contraseña)",
  })
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @ApiPropertyOptional({
    description: "Nueva contraseña (mínimo 6 caracteres)",
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: "La contraseña debe tener al menos 6 caracteres" })
  newPassword?: string;
}

/**
 * DTO para reemplazo total de áreas de un usuario.
 */
export class ReplaceUserAreasDto {
  @ApiProperty({ type: [String], description: "IDs de áreas asignadas" })
  @IsArray()
  @IsMongoId({ each: true, message: "Cada areaId debe ser un ObjectId válido" })
  areaIds: string[];
}

/**
 * DTO para actualización centralizada de asignaciones.
 */
export class UpdateUserAssignmentsDto {
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsMongoId({
    each: true,
    message: "Cada clientId debe ser un ObjectId válido",
  })
  clientIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsMongoId({
    each: true,
    message: "Cada projectId debe ser un ObjectId válido",
  })
  projectIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsMongoId({
    each: true,
    message: "Cada areaId debe ser un ObjectId válido",
  })
  areaIds?: string[];
}

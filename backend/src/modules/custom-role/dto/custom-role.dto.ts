import { IsString, IsNotEmpty, IsOptional, IsArray, IsBoolean, IsMongoId, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PermissionDto {
  @IsString()
  @IsNotEmpty()
  resource: string;

  @IsArray()
  @IsString({ each: true })
  actions: string[];
}

export class CreateCustomRoleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  displayName: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsMongoId()
  @IsOptional()
  clientId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionDto)
  permissions: PermissionDto[];
}

export class UpdateCustomRoleDto {
  @IsString()
  @IsOptional()
  displayName?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionDto)
  @IsOptional()
  permissions?: PermissionDto[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

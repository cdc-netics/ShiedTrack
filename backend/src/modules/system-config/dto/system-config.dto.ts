import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsEmail,
  IsHexColor,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from "class-validator";

export class ResetDatabaseDto {
  @ApiProperty({ example: "RESET_DATABASE" })
  @IsString()
  @IsIn(["RESET_DATABASE"], {
    message: "confirmation debe ser exactamente RESET_DATABASE",
  })
  confirmation: string;
}

export class UpdateSmtpConfigDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  smtp_host: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Max(65535)
  smtp_port: number;

  @ApiProperty()
  @IsBoolean()
  smtp_secure: boolean;

  @ApiProperty()
  @IsString()
  smtp_user: string;

  @ApiProperty()
  @IsString()
  smtp_pass: string;

  @ApiProperty()
  @IsEmail()
  smtp_from_email: string;

  @ApiProperty()
  @IsString()
  smtp_from_name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  smtp_reply_to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(120000)
  smtp_timeout_ms?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  smtp_tls_reject_unauthorized?: boolean;
}

export class UpdateBrandingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  appName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  faviconUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ example: "#1E40AF" })
  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @ApiPropertyOptional({ example: "#0EA5E9" })
  @IsOptional()
  @IsHexColor()
  secondaryColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

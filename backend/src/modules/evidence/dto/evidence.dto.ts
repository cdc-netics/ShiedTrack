import { IsMongoId, IsOptional, IsString, IsUrl } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * DTO para agregar una evidencia de tipo enlace externo (ej. SharePoint)
 * Usado para evidencias que exceden el límite de tamaño de subida (ej. videos grandes)
 */
export class AddEvidenceLinkDto {
  @ApiProperty({
    example: "6a70a001d5f2c9a1b2c3d4e5",
    description: "ID del hallazgo al que se asocia la evidencia",
  })
  @IsMongoId()
  findingId: string;

  @ApiProperty({
    example: "https://miempresa.sharepoint.com/sites/pentest/video.mp4",
    description: "URL del enlace externo (SharePoint, Drive, etc.)",
  })
  @IsUrl({ protocols: ["http", "https"], require_protocol: true })
  url: string;

  @ApiPropertyOptional({
    example: "Grabación de la explotación completa (video, 350MB)",
    description: "Descripción/etiqueta del enlace",
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: "Actualización/seguimiento específico al que pertenece",
  })
  @IsOptional()
  @IsMongoId()
  updateId?: string;
}

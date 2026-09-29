import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  Res,
  StreamableFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { Response } from "express";
import { EvidenceService } from "./evidence.service";
import { AddEvidenceLinkDto } from "./dto/evidence.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { UserRole } from "../../common/enums";

// Límite de subida de evidencias (protege el volumen de Docker de archivos enormes,
// ej. videos). Los archivos más grandes deben registrarse como enlace externo (SharePoint,
// Drive, etc.) con POST /evidence/link, que no ocupa espacio en disco.
const MAX_EVIDENCE_FILE_SIZE_MB = Number(
  process.env.EVIDENCE_MAX_FILE_SIZE_MB || 100,
);
const MAX_EVIDENCE_FILE_SIZE_BYTES = MAX_EVIDENCE_FILE_SIZE_MB * 1024 * 1024;

/**
 * Controller de gestión de Evidencias
 * Maneja upload y download seguro de archivos con validación JWT
 */
@ApiTags("Evidence")
@Controller("evidence")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
export class EvidenceController {
  constructor(private readonly evidenceService: EvidenceService) {}

  @Post("upload")
  @Roles(
    UserRole.OWNER,
    UserRole.PLATFORM_ADMIN,
    UserRole.CLIENT_ADMIN,
    UserRole.AREA_ADMIN,
    UserRole.ANALYST,
    UserRole.PENTESTER,
    UserRole.QA,
  )
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: MAX_EVIDENCE_FILE_SIZE_BYTES },
    }),
  )
  @ApiOperation({
    summary: "Subir archivo de evidencia",
    description: `Límite: ${MAX_EVIDENCE_FILE_SIZE_MB}MB. Para archivos más grandes (ej. videos), usar POST /evidence/link con una URL externa (SharePoint, Drive, etc.)`,
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: { type: "string", format: "binary" },
        findingId: { type: "string" },
        description: { type: "string" },
        updateId: { type: "string" },
      },
    },
  })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query("findingId") findingId: string,
    @Query("description") description: string,
    @Query("updateId") updateId: string,
    @CurrentUser() user: any,
  ) {
    return this.evidenceService.upload(
      file,
      findingId,
      user.userId,
      description,
      updateId,
      user,
    );
  }

  @Post("link")
  @Roles(
    UserRole.OWNER,
    UserRole.PLATFORM_ADMIN,
    UserRole.CLIENT_ADMIN,
    UserRole.AREA_ADMIN,
    UserRole.ANALYST,
    UserRole.PENTESTER,
    UserRole.QA,
  )
  @ApiOperation({
    summary: "Registrar evidencia como enlace externo (ej. SharePoint)",
    description:
      "Para evidencias que exceden el límite de subida de archivos (videos grandes principalmente). No ocupa espacio en disco, solo guarda la URL.",
  })
  async addLink(@Body() dto: AddEvidenceLinkDto, @CurrentUser() user: any) {
    return this.evidenceService.addLink(
      dto.findingId,
      dto.url,
      user.userId,
      dto.description,
      dto.updateId,
      user,
    );
  }

  @Get("finding/:findingId")
  @Roles(
    UserRole.OWNER,
    UserRole.PLATFORM_ADMIN,
    UserRole.CLIENT_ADMIN,
    UserRole.AREA_ADMIN,
    UserRole.ANALYST,
    UserRole.PENTESTER,
    UserRole.QA,
    UserRole.VIEWER,
  )
  @ApiOperation({
    summary: "Listar evidencias de un hallazgo",
    description: "SEC-RBAC-001: Validar acceso por tenant",
  })
  async findByFinding(
    @Param("findingId") findingId: string,
    @CurrentUser() user: any,
  ) {
    return this.evidenceService.findByFinding(findingId, user);
  }

  @Get(":id/download")
  @Roles(
    UserRole.OWNER,
    UserRole.PLATFORM_ADMIN,
    UserRole.CLIENT_ADMIN,
    UserRole.AREA_ADMIN,
    UserRole.ANALYST,
    UserRole.PENTESTER,
    UserRole.QA,
    UserRole.VIEWER,
  )
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // SECURITY FIX M2: Rate limiting
  @ApiOperation({
    summary: "Descargar archivo de evidencia",
    description: "SEC-RBAC-001: Validar acceso por tenant y resource",
  })
  async download(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const { stream, evidence } = await this.evidenceService.downloadFile(id, user);

    // Configurar headers para descarga
    res.set({
      "Content-Type": evidence.mimeType,
      "Content-Disposition": `attachment; filename="${evidence.filename}"`,
      "Content-Length": evidence.size,
    });

    return stream;
  }

  @Delete(":id")
  @Roles(
    UserRole.OWNER,
    UserRole.PLATFORM_ADMIN,
    UserRole.CLIENT_ADMIN,
    UserRole.AREA_ADMIN,
    UserRole.ANALYST,
    UserRole.PENTESTER,
    UserRole.QA,
  )
  @ApiOperation({ summary: "Eliminar evidencia" })
  async delete(@Param("id") id: string, @CurrentUser() user: any) {
    await this.evidenceService.delete(id, user);
    return { message: "Evidencia eliminada" };
  }
}

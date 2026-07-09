import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from "@nestjs/swagger";
import { FindingService } from "./finding.service";
import {
  BulkCloseFindingsDto,
  CreateFindingDto,
  UpdateFindingDto,
  CloseFindingDto,
} from "./dto/finding.dto";
import { CreateFindingUpdateDto } from "./dto/finding-update.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import {
  UserRole,
  FindingStatus,
  FindingSeverity,
  CloseReason,
} from "../../common/enums";

@ApiTags("Findings")
@Controller("findings")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
export class FindingController {
  constructor(private readonly findingService: FindingService) {}

  @Post()
  @Roles(
    UserRole.OWNER,
    UserRole.PLATFORM_ADMIN,
    UserRole.ANALYST,
    UserRole.PENTESTER,
    UserRole.QA,
    UserRole.NORMAL_USER,
  )
  @ApiOperation({ summary: "Crear un nuevo hallazgo" })
  async create(@Body() dto: CreateFindingDto, @CurrentUser() user: any) {
    return this.findingService.create(dto, user.userId, user);
  }

  @Get()
  @ApiOperation({ summary: "Listar hallazgos con filtros" })
  @ApiQuery({ name: "projectId", required: false })
  @ApiQuery({ name: "status", required: false, enum: FindingStatus })
  @ApiQuery({ name: "severity", required: false, enum: FindingSeverity })
  @ApiQuery({ name: "assignedTo", required: false })
  @ApiQuery({ name: "includeClosed", required: false, type: Boolean })
  async findAll(
    @Query("projectId") projectId?: string,
    @Query("status") status?: FindingStatus,
    @Query("severity") severity?: string,
    @Query("assignedTo") assignedTo?: string,
    @Query("includeClosed") includeClosed?: boolean,
    @CurrentUser() user?: any,
  ) {
    return this.findingService.findAll(
      {
        projectId,
        status,
        severity,
        assignedTo,
        includeClosed,
      },
      user,
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Obtener hallazgo por ID" })
  async findById(@Param("id") id: string, @CurrentUser() user?: any) {
    return this.findingService.findById(id, user);
  }

  @Get(":id/timeline")
  @ApiOperation({ summary: "Obtener timeline de un hallazgo" })
  async getTimeline(@Param("id") id: string, @CurrentUser() user?: any) {
    return this.findingService.getTimeline(id, user);
  }

  @Put(":id")
  @Roles(
    UserRole.OWNER,
    UserRole.PLATFORM_ADMIN,
    UserRole.CLIENT_ADMIN,
    UserRole.AREA_ADMIN,
    UserRole.ANALYST,
    UserRole.PENTESTER,
    UserRole.QA,
    UserRole.NORMAL_USER,
  )
  @ApiOperation({ summary: "Actualizar hallazgo" })
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateFindingDto,
    @CurrentUser() user: any,
  ) {
    return this.findingService.update(id, dto, user.userId, user);
  }

  @Post(":id/close")
  @Roles(
    UserRole.OWNER,
    UserRole.PLATFORM_ADMIN,
    UserRole.CLIENT_ADMIN,
    UserRole.AREA_ADMIN,
    UserRole.ANALYST,
    UserRole.PENTESTER,
    UserRole.QA,
    UserRole.NORMAL_USER,
  )
  @ApiOperation({ summary: "Cerrar un hallazgo con motivo específico" })
  async close(
    @Param("id") id: string,
    @Body() dto: CloseFindingDto,
    @CurrentUser() user: any,
  ) {
    return this.findingService.close(id, dto, user.userId, user);
  }

  @Post("bulk-close")
  @Roles(
    UserRole.OWNER,
    UserRole.PLATFORM_ADMIN,
    UserRole.CLIENT_ADMIN,
    UserRole.AREA_ADMIN,
    UserRole.ANALYST,
    UserRole.PENTESTER,
    UserRole.QA,
    UserRole.NORMAL_USER,
  )
  @ApiOperation({ summary: "Cerrar múltiples hallazgos" })
  async bulkClose(
    @Body() body: BulkCloseFindingsDto,
    @CurrentUser() user: any,
  ) {
    return this.findingService.bulkClose(
      body.ids,
      user.userId,
      user,
      body.closeReason || CloseReason.FIXED,
    );
  }

  @Post("updates")
  @Roles(
    UserRole.OWNER,
    UserRole.PLATFORM_ADMIN,
    UserRole.CLIENT_ADMIN,
    UserRole.AREA_ADMIN,
    UserRole.ANALYST,
    UserRole.PENTESTER,
    UserRole.QA,
    UserRole.NORMAL_USER,
  )
  @ApiOperation({ summary: "Agregar actualización al timeline de hallazgo" })
  async createUpdate(
    @Body() dto: CreateFindingUpdateDto,
    @CurrentUser() user: any,
  ) {
    return this.findingService.createUpdate(dto, user.userId, user);
  }

  @Post("bulk-import")
  @Roles(
    UserRole.OWNER,
    UserRole.PLATFORM_ADMIN,
    UserRole.PENTESTER,
    UserRole.QA,
    UserRole.ANALYST,
  )
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: { file: { type: "string", format: "binary" } },
    },
  })
  @ApiOperation({
    summary: "Importar hallazgos masivamente desde CSV o Excel",
    description:
      "Lee la columna 'Cliente' para resolver o crear el tenant/proyecto automáticamente. " +
      "projectName (opcional) define el nombre del engagement; si se omite usa 'Importación CSV'. " +
      "dryRun=true solo valida sin guardar. fillMissing=true rellena campos vacíos con 'N/A'.",
  })
  @ApiQuery({ name: "projectName", required: false, description: "Nombre del proyecto/engagement destino" })
  @ApiQuery({ name: "dryRun", required: false, description: "Si true, valida sin guardar" })
  @ApiQuery({ name: "fillMissing", required: false, description: "Si true, rellena campos faltantes con N/A" })
  async bulkImport(
    @UploadedFile() file: Express.Multer.File,
    @Query("projectName") projectName: string,
    @Query("dryRun") dryRun: string,
    @Query("fillMissing") fillMissing: string,
    @CurrentUser() user: any,
  ) {
    if (!file) throw new BadRequestException("Se requiere un archivo");
    const isDryRun = dryRun === "true" || dryRun === "1";
    const isFillMissing = fillMissing === "true" || fillMissing === "1";
    return this.findingService.bulkImport(file, projectName, user, isDryRun, isFillMissing);
  }

  @Delete(":id/hard")
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: "Eliminar hallazgo permanentemente" })
  async hardDelete(@Param("id") id: string, @CurrentUser() user: any) {
    await this.findingService.hardDelete(id, user);
    return { message: "Hallazgo eliminado permanentemente" };
  }
}

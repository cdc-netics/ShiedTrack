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
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { AreaService } from "./area.service";
import { CreateAreaDto, UpdateAreaDto } from "./dto/area.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { UserRole } from "../../common/enums";

@ApiTags("Areas")
@Controller("areas")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
export class AreaController {
  constructor(private readonly areaService: AreaService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.PLATFORM_ADMIN, UserRole.CLIENT_ADMIN, UserRole.PENTESTER)
  @ApiOperation({ summary: "Crear una nueva área" })
  async create(@Body() dto: CreateAreaDto, @CurrentUser() user: any) {
    return this.areaService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "Listar áreas" })
  @ApiQuery({ name: "clientId", required: false })
  @ApiQuery({ name: "includeInactive", required: false, type: Boolean })
  async findByClient(
    @Query("clientId") clientId?: string,
    @Query("includeInactive") includeInactive?: boolean,
    @CurrentUser() user?: any,
  ) {
    return this.areaService.findByClient(clientId, includeInactive, user);
  }

  @Get(":id")
  @ApiOperation({ summary: "Obtener área por ID" })
  async findById(@Param("id") id: string, @CurrentUser() user: any) {
    return this.areaService.findById(id, user);
  }

  @Put(":id")
  @Roles(
    UserRole.OWNER,
    UserRole.PLATFORM_ADMIN,
    UserRole.CLIENT_ADMIN,
    UserRole.AREA_ADMIN,
    UserRole.PENTESTER,
  )
  @ApiOperation({ summary: "Actualizar área" })
  async update(@Param("id") id: string, @Body() dto: UpdateAreaDto, @CurrentUser() user: any) {
    return this.areaService.update(id, dto, user);
  }

  @Delete(":id")
  @Roles(UserRole.OWNER, UserRole.PLATFORM_ADMIN, UserRole.PENTESTER)
  @ApiOperation({ summary: "Desactivar área" })
  async deactivate(@Param("id") id: string, @CurrentUser() user: any) {
    return this.areaService.deactivate(id, user);
  }

  @Delete(":id/hard")
  @Roles(UserRole.OWNER, UserRole.PENTESTER)
  @ApiOperation({ summary: "Eliminar área permanentemente" })
  async hardDelete(@Param("id") id: string, @CurrentUser() user: any) {
    await this.areaService.hardDelete(id, user);
    return { message: "Área eliminada permanentemente" };
  }
}

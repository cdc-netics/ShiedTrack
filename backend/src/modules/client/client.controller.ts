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
import { ClientService } from "./client.service";
import { CreateClientDto, UpdateClientDto } from "./dto/client.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { UserRole } from "../../common/enums";

/**
 * Controller de gestión de Clientes (Tenants)
 */
@ApiTags("Clients")
@Controller("clients")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: "Crear un nuevo cliente" })
  @ApiResponse({ status: 201, description: "Cliente creado" })
  async create(@Body() dto: CreateClientDto) {
    return this.clientService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Listar todos los clientes" })
  @ApiQuery({ name: "includeInactive", required: false, type: Boolean })
  @ApiResponse({ status: 200, description: "Lista de clientes" })
  async findAll(
    @Query("includeInactive") includeInactive?: boolean,
    @CurrentUser() user?: any,
  ) {
    return this.clientService.findAll(includeInactive, user);
  }

  @Get(":id")
  @ApiOperation({
    summary: "Obtener cliente por ID",
    description: "SEC-RBAC-003: Validar tenant scope",
  })
  @ApiResponse({ status: 200, description: "Cliente encontrado" })
  @ApiResponse({ status: 404, description: "Cliente no encontrado" })
  async findById(
    @Param("id") id: string,
    @CurrentUser() user?: any,
  ) {
    return this.clientService.findById(id, user);
  }

  @Put(":id")
  @Roles(UserRole.OWNER, UserRole.PLATFORM_ADMIN, UserRole.CLIENT_ADMIN)
  @ApiOperation({
    summary: "Actualizar cliente",
    description: "SEC-RBAC-003: Validar tenant scope",
  })
  @ApiResponse({ status: 200, description: "Cliente actualizado" })
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateClientDto,
    @CurrentUser() user?: any,
  ) {
    return this.clientService.update(id, dto, user);
  }

  @Delete(":id")
  @Roles(UserRole.OWNER, UserRole.PLATFORM_ADMIN)
  @ApiOperation({
    summary: "Desactivar cliente (soft delete)",
    description: "SEC-RBAC-003: Validar tenant scope",
  })
  @ApiResponse({ status: 200, description: "Cliente desactivado" })
  async deactivate(
    @Param("id") id: string,
    @CurrentUser() user?: any,
  ) {
    return this.clientService.deactivate(id, user);
  }

  @Delete(":id/hard")
  @Roles(UserRole.OWNER)
  @ApiOperation({
    summary: "Eliminar cliente permanentemente (solo OWNER)",
    description: "SEC-RBAC-003: Validar tenant scope",
  })
  @ApiResponse({
    status: 200,
    description: "Cliente eliminado permanentemente",
  })
  async hardDelete(
    @Param("id") id: string,
    @CurrentUser() user?: any,
  ) {
    await this.clientService.hardDelete(id, user);
    return { message: "Cliente eliminado permanentemente" };
  }
}

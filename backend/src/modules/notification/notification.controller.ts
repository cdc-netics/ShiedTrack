import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { UserRole } from "../../common/enums";
import {
  CreateNotificationRuleDto,
  CreateNotificationTemplateDto,
  ListNotificationRulesDto,
  ListNotificationTemplatesDto,
  UpdateNotificationRuleDto,
  UpdateNotificationTemplateDto,
} from "./dto/notification.dto";
import { NotificationService } from "./notification.service";

@ApiTags("Notifications")
@Controller("notifications")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("JWT-auth")
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get("options")
  @Roles(UserRole.CLIENT_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: "Obtener catálogos para gestión de notificaciones" })
  async getOptions(@CurrentUser() currentUser: any) {
    return this.notificationService.getOptions(currentUser);
  }

  @Get("rules")
  @Roles(UserRole.CLIENT_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: "Listar reglas de notificación" })
  async listRules(
    @Query() query: ListNotificationRulesDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.notificationService.listRules(currentUser, query);
  }

  @Post("rules")
  @Roles(UserRole.CLIENT_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: "Crear regla de notificación" })
  async createRule(
    @Body() dto: CreateNotificationRuleDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.notificationService.createRule(dto, currentUser);
  }

  @Patch("rules/:id")
  @Roles(UserRole.CLIENT_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: "Actualizar regla de notificación" })
  async updateRule(
    @Param("id") id: string,
    @Body() dto: UpdateNotificationRuleDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.notificationService.updateRule(id, dto, currentUser);
  }

  @Delete("rules/:id")
  @Roles(UserRole.CLIENT_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: "Eliminar/desactivar regla de notificación" })
  async deleteRule(@Param("id") id: string, @CurrentUser() currentUser: any) {
    await this.notificationService.deleteRule(id, currentUser);
    return { message: "Regla eliminada/desactivada exitosamente" };
  }

  @Get("templates")
  @Roles(UserRole.CLIENT_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: "Listar plantillas de notificación" })
  async listTemplates(
    @Query() query: ListNotificationTemplatesDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.notificationService.listTemplates(currentUser, query);
  }

  @Post("templates")
  @Roles(UserRole.CLIENT_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: "Crear plantilla de notificación" })
  async createTemplate(
    @Body() dto: CreateNotificationTemplateDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.notificationService.createTemplate(dto, currentUser);
  }

  @Patch("templates/:id")
  @Roles(UserRole.CLIENT_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: "Actualizar plantilla de notificación" })
  async updateTemplate(
    @Param("id") id: string,
    @Body() dto: UpdateNotificationTemplateDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.notificationService.updateTemplate(id, dto, currentUser);
  }

  @Delete("templates/:id")
  @Roles(UserRole.CLIENT_ADMIN, UserRole.PLATFORM_ADMIN, UserRole.OWNER)
  @ApiOperation({ summary: "Desactivar plantilla de notificación" })
  async deleteTemplate(
    @Param("id") id: string,
    @CurrentUser() currentUser: any,
  ) {
    await this.notificationService.deleteTemplate(id, currentUser);
    return { message: "Plantilla desactivada exitosamente" };
  }
}

import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Area } from "./schemas/area.schema";
import { CreateAreaDto, UpdateAreaDto } from "./dto/area.dto";
import { getNamespace } from "cls-hooked";

/**
 * Servicio de gestión de Áreas
 * Maneja operaciones CRUD para áreas dentro de un cliente
 */
@Injectable()
export class AreaService {
  private readonly logger = new Logger(AreaService.name);

  constructor(@InjectModel(Area.name) private areaModel: Model<Area>) {}

  /**
   * Obtiene el siguiente TenantId de forma correlativa (Round-Robin)
   * Útil para balancear la carga de datos entre tenants durante pruebas o migraciones.
   */
  private async getNextCorrelativeTenantId(): Promise<Types.ObjectId> {
    try {
      // Obtenemos el modelo de Tenant dinámicamente desde la conexión
      const TenantModel = this.areaModel.db.model("Tenant");
      const activeTenants = await TenantModel.find({ isActive: true }).sort({
        _id: 1,
      });

      if (activeTenants.length === 0) {
        throw new BadRequestException(
          "No existen tenants activos para asignación automática.",
        );
      }

      // Contamos áreas totales para determinar el índice del tenant
      const totalAreas = await this.areaModel.countDocuments();
      const nextTenant = activeTenants[totalAreas % activeTenants.length];

      this.logger.debug(
        `Asignación correlativa: Tenant [${nextTenant.name}] seleccionado (Índice: ${totalAreas % activeTenants.length})`,
      );
      return nextTenant._id as Types.ObjectId;
    } catch (error) {
      this.logger.error(`Error en asignación correlativa: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crea una nueva área
   */
  async create(dto: CreateAreaDto): Promise<Area> {
    // DEBUG: Verificar contexto CLS
    const namespace = getNamespace("tenant-context");
    const contextTenantId = namespace?.get("tenantId");
    const isOwner = namespace?.get("isOwner");
    const userId = namespace?.get("userId");

    this.logger.log(
      `[DEBUG] Contexto CLS - tenantId: ${contextTenantId}, isOwner: ${isOwner}, userId: ${userId}`,
    );
    this.logger.log(`Intentando crear área: ${JSON.stringify(dto)}`);

    let finalTenantId = dto.tenantId || contextTenantId;

    // Lógica Correlativa: Si no hay tenant y el usuario es OWNER, auto-poblar
    if (!finalTenantId && isOwner) {
      this.logger.log(
        "TenantId no especificado y usuario es OWNER. Iniciando asignación correlativa...",
      );
      finalTenantId = await this.getNextCorrelativeTenantId();
    }

    // Validar que tenemos tenantId final
    if (!finalTenantId) {
      throw new BadRequestException(
        "No se puede determinar el tenant del usuario. Asegúrate de estar autenticado correctamente o especificar un tenantId.",
      );
    }

    try {
      // Generar código automáticamente: AREA-001, AREA-002, etc.
      // El filtrado por tenant se aplica vía plugin/CLS para la búsqueda del último código
      const lastArea = await this.areaModel
        .findOne({})
        .sort({ createdAt: -1 })
        .exec();

      let nextNumber = 1;
      if (lastArea && lastArea.code) {
        const match = lastArea.code.match(/AREA-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }

      const code = `AREA-${String(nextNumber).padStart(3, "0")}`;

      const area = new this.areaModel({
        ...dto,
        code,
        tenantId: new Types.ObjectId(finalTenantId),
      });
      await area.save();

      this.logger.log(
        `Área creada: ${area.name} (${code}) en tenant ${area.tenantId}`,
      );
      return area;
    } catch (error) {
      this.logger.error(`Error creando área: ${error.message}`, error.stack);
      if (error.name === "ValidationError") {
        throw new BadRequestException(`Error de validación: ${error.message}`);
      }
      if (error.code === 11000) {
        throw new BadRequestException(
          "Ya existe un área con este código o nombre para este tenant",
        );
      }
      throw error;
    }
  }

  /**
   * Obtiene todas las áreas (opcionalmente filtradas por cliente)
   */
  async findByClient(
    clientId?: string,
    includeInactive = false,
  ): Promise<any[]> {
    const query: any = {};

    if (!includeInactive) {
      query.isActive = true;
    }

    const areas = await this.areaModel
      .find(query)
      .populate("clientId", "name") // LEGACY (si existe)
      .populate("tenantId", "name")
      .sort({ name: 1 })
      .lean();

    // Para cada área, obtener sus administradores desde UserAreaAssignment
    const AreasWithAdmins = await Promise.all(
      areas.map(async (area) => {
        const admins = await this.getAreaAdmins(area._id.toString());
        return {
          ...area,
          admins,
        };
      }),
    );

    return AreasWithAdmins;
  }

  /**
   * Obtiene los administradores de un área
   */
  private async getAreaAdmins(areaId: string): Promise<any[]> {
    try {
      // Buscar en UserAreaAssignment todos los usuarios asignados a esta área
      const UserAreaAssignment = this.areaModel.db.model("UserAreaAssignment");
      const User = this.areaModel.db.model("User");

      const assignments = await UserAreaAssignment.find({
        areaId,
        isActive: true,
      })
        .populate({
          path: "userId",
          select: "firstName lastName email role",
        })
        .lean();

      // Filtrar solo usuarios con rol AREA_ADMIN
      return assignments
        .map((a) => a.userId)
        .filter(
          (user) =>
            user &&
            (user.role === "AREA_ADMIN" || user.role === "CLIENT_ADMIN"),
        )
        .map((user) => ({
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        }));
    } catch (error) {
      this.logger.error(
        `Error al obtener administradores del área ${areaId}:`,
        error,
      );
      return [];
    }
  }

  /**
   * Busca área por ID
   */
  async findById(id: string): Promise<Area> {
    const area = await this.areaModel.findById(id).populate("clientId");
    if (!area) {
      throw new NotFoundException(`Área con ID ${id} no encontrada`);
    }
    return area;
  }

  /**
   * Actualiza un área
   */
  async update(id: string, dto: UpdateAreaDto): Promise<Area> {
    const area = await this.areaModel.findByIdAndUpdate(id, dto, { new: true });

    if (!area) {
      throw new NotFoundException(`Área con ID ${id} no encontrada`);
    }

    this.logger.log(`Área actualizada: ${area.name} (ID: ${id})`);
    return area;
  }

  /**
   * Soft delete - Desactiva un área
   */
  async deactivate(id: string): Promise<Area> {
    const area = await this.areaModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );

    if (!area) {
      throw new NotFoundException(`Área con ID ${id} no encontrada`);
    }

    this.logger.warn(`Área desactivada: ${area.name} (ID: ${id})`);
    return area;
  }

  /**
   * Hard delete - Solo OWNER
   */
  async hardDelete(id: string): Promise<void> {
    const result = await this.areaModel.findByIdAndDelete(id);

    if (!result) {
      throw new NotFoundException(`Área con ID ${id} no encontrada`);
    }

    this.logger.warn(
      `Área ELIMINADA permanentemente: ${result.name} (ID: ${id})`,
    );
  }
}

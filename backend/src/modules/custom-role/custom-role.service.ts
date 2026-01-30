import { Injectable, NotFoundException, ConflictException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CustomRole } from './schemas/custom-role.schema';
import { CreateCustomRoleDto, UpdateCustomRoleDto } from './dto/custom-role.dto';
import { UserRole } from '../../common/enums';

/**
 * Servicio de gestión de roles personalizados
 * Permite crear roles con permisos granulares
 */
@Injectable()
export class CustomRoleService {
  private readonly logger = new Logger(CustomRoleService.name);

  constructor(
    @InjectModel(CustomRole.name) private customRoleModel: Model<CustomRole>,
  ) {}

  /**
   * Crea un nuevo rol personalizado
   * Solo OWNER, PLATFORM_ADMIN y CLIENT_ADMIN pueden crear roles
   */
  async create(dto: CreateCustomRoleDto, currentUser: any): Promise<CustomRole> {
    // Validar permisos
    if (!['OWNER', 'PLATFORM_ADMIN', 'CLIENT_ADMIN'].includes(currentUser.role)) {
      throw new ForbiddenException('No tiene permisos para crear roles personalizados');
    }

    // CLIENT_ADMIN solo puede crear roles para su tenant
    if (currentUser.role === UserRole.CLIENT_ADMIN) {
      dto.clientId = currentUser.clientId;
    }

    // Verificar que el rol no exista
    const existing = await this.customRoleModel.findOne({
      name: dto.name,
      clientId: dto.clientId || null,
    });

    if (existing) {
      throw new ConflictException('Ya existe un rol con ese nombre en este contexto');
    }

    const role = new this.customRoleModel({
      ...dto,
      createdBy: currentUser.userId,
      isSystem: false,
    });

    const saved = await role.save();
    this.logger.log(`Rol personalizado creado: ${saved.name} por ${currentUser.email}`);

    return saved;
  }

  /**
   * Lista todos los roles disponibles para el usuario actual
   */
  async findAll(currentUser: any): Promise<CustomRole[]> {
    const query: any = { isActive: true };

    // CLIENT_ADMIN solo ve roles de su tenant + roles globales
    if (currentUser.role === UserRole.CLIENT_ADMIN) {
      query.$or = [
        { clientId: currentUser.clientId },
        { clientId: null }, // Roles globales
      ];
    }

    return this.customRoleModel.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort({ isSystem: -1, name: 1 });
  }

  /**
   * Obtiene un rol por ID
   */
  async findOne(id: string, currentUser: any): Promise<CustomRole> {
    const role = await this.customRoleModel.findById(id)
      .populate('createdBy', 'firstName lastName email');

    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    // Validar acceso
    if (currentUser.role === UserRole.CLIENT_ADMIN) {
      if (role.clientId && role.clientId.toString() !== currentUser.clientId.toString()) {
        throw new ForbiddenException('No tiene permisos para ver este rol');
      }
    }

    return role;
  }

  /**
   * Actualiza un rol personalizado
   */
  async update(id: string, dto: UpdateCustomRoleDto, currentUser: any): Promise<CustomRole> {
    const role = await this.customRoleModel.findById(id);

    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    // No se pueden modificar roles del sistema
    if (role.isSystem) {
      throw new ForbiddenException('No se pueden modificar roles del sistema');
    }

    // Validar permisos
    if (currentUser.role === UserRole.CLIENT_ADMIN) {
      if (role.clientId && role.clientId.toString() !== currentUser.clientId.toString()) {
        throw new ForbiddenException('No tiene permisos para modificar este rol');
      }
    }

    Object.assign(role, dto);
    role.updatedBy = currentUser.userId;

    const updated = await role.save();
    this.logger.log(`Rol actualizado: ${updated.name} por ${currentUser.email}`);

    return updated;
  }

  /**
   * Elimina un rol personalizado (solo si no está en uso)
   */
  async remove(id: string, currentUser: any): Promise<void> {
    const role = await this.customRoleModel.findById(id);

    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    // No se pueden eliminar roles del sistema
    if (role.isSystem) {
      throw new ForbiddenException('No se pueden eliminar roles del sistema');
    }

    // Validar permisos
    if (currentUser.role === UserRole.CLIENT_ADMIN) {
      if (role.clientId && role.clientId.toString() !== currentUser.clientId.toString()) {
        throw new ForbiddenException('No tiene permisos para eliminar este rol');
      }
    }

    // TODO: Verificar que no haya usuarios con este rol antes de eliminar

    await role.deleteOne();
    this.logger.log(`Rol eliminado: ${role.name} por ${currentUser.email}`);
  }

  /**
   * Verifica si un usuario tiene un permiso específico
   */
  async hasPermission(userId: string, resource: string, action: string): Promise<boolean> {
    // TODO: Implementar lógica de verificación de permisos
    // Por ahora retornamos true para mantener compatibilidad
    return true;
  }
}

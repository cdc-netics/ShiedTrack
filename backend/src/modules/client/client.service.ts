import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Client } from './schemas/client.schema';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';
import { ProjectStatus } from '../../common/enums';
import { AuthService } from '../auth/auth.service';
import { UserRole } from '../../common/enums';

/**
 * Servicio de gestión de Clientes (Tenants)
 * Maneja operaciones CRUD para la entidad multi-tenant
 */
@Injectable()
export class ClientService {
  private readonly logger = new Logger(ClientService.name);

  constructor(
    @InjectModel(Client.name) private clientModel: Model<Client>,
    private authService: AuthService,
  ) {}

  /**
   * Crea un nuevo cliente y opcionalmente crea el primer admin
   */
  async create(dto: CreateClientDto): Promise<Client> {
    const client = new this.clientModel({
      name: dto.name,
      displayName: dto.displayName || dto.name, // Si no hay displayName, usar name
      code: dto.code,
      description: dto.description,
      contactEmail: dto.contactEmail,
      contactPhone: dto.contactPhone,
    });
    await client.save();
    
    this.logger.log(`Cliente creado: ${client.name} (ID: ${client._id})`);

    // Crear admin inicial si se especifica
    if (dto.initialAdmin) {
      try {
        await this.authService.register({
          email: dto.initialAdmin.email,
          password: dto.initialAdmin.password,
          firstName: dto.initialAdmin.firstName,
          lastName: dto.initialAdmin.lastName,
          role: UserRole.CLIENT_ADMIN,
          clientId: client._id.toString(),
        });
        this.logger.log(`Admin inicial creado para tenant ${client.name}: ${dto.initialAdmin.email}`);
      } catch (error) {
        this.logger.error(`Error al crear admin inicial para tenant ${client.name}: ${error.message}`);
        // No fallar la creación del tenant si el admin falla, solo loggear
      }
    }

    return client;
  }

  /**
   * Obtiene todos los clientes activos con conteo de proyectos
   * MULTI-TENANT: Filtra por role del usuario
   * - OWNER/PLATFORM_ADMIN: Ven todos los clientes
   * - CLIENT_ADMIN: Solo su cliente
   * - Otros roles: Sin acceso
   */
  async findAll(includeInactive = false, currentUser?: any): Promise<any[]> {
    const query: any = includeInactive ? {} : { isActive: true };
    
    // SEGURIDAD MULTI-TENANT: Filtrar según rol
    if (currentUser) {
      const restrictedRoles = ['CLIENT_ADMIN', 'AREA_ADMIN', 'ANALYST', 'VIEWER'];
      if (restrictedRoles.includes(currentUser.role) && currentUser.clientId) {
        query._id = currentUser.clientId; // Solo su cliente
      }
    }
    
    const clients = await this.clientModel.find(query).sort({ name: 1 }).lean();
    
    // Agregar conteo de proyectos para cada cliente
    const Project = this.clientModel.db.model('Project');
    const clientsWithCount = await Promise.all(
      clients.map(async (client) => {
        const projectsCount = await Project.countDocuments({ 
          clientId: client._id,
          projectStatus: ProjectStatus.ACTIVE 
        });
        return {
          ...client,
          projectsCount
        };
      })
    );
    
    return clientsWithCount;
  }

  /**
   * Busca cliente por ID
   */
  async findById(id: string): Promise<Client> {
    const client = await this.clientModel.findById(id);
    if (!client) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }
    return client;
  }

  /**
   * Actualiza un cliente
   */
  async update(id: string, dto: UpdateClientDto): Promise<Client> {
    const client = await this.clientModel.findByIdAndUpdate(id, dto, { new: true });
    
    if (!client) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }

    this.logger.log(`Cliente actualizado: ${client.name} (ID: ${id})`);
    return client;
  }

  /**
   * Soft delete - Desactiva un cliente
   */
  async deactivate(id: string): Promise<Client> {
    const client = await this.clientModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );

    if (!client) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }

    this.logger.warn(`Cliente desactivado: ${client.name} (ID: ${id})`);
    return client;
  }

  /**
   * Hard delete - Solo OWNER puede ejecutar
   */
  async hardDelete(id: string): Promise<void> {
    const result = await this.clientModel.findByIdAndDelete(id);
    
    if (!result) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }

    this.logger.warn(`Cliente ELIMINADO permanentemente: ${result.name} (ID: ${id})`);
  }
}

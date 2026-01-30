/**
 * EJEMPLO DE IMPLEMENTACIÓN DEL FILTRO DE ÁREA
 * =============================================
 * 
 * Este archivo muestra cómo aplicar el filtrado automático por área
 * en los services de backend. Aplica para Finding, Project, Evidence, etc.
 */

import { Injectable, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Finding } from './schemas/finding.schema';
import { AreaFilter, ClientFilter } from '../auth/decorators/area-filter.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../../common/enums';

/**
 * EJEMPLO 1: En el Controller
 * ============================
 * Uso de los decoradores @AreaFilter() y @ClientFilter()
 */
@Injectable()
export class FindingController {
  constructor(private readonly findingService: FindingService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @AreaFilter() areaFilter: string[] | null,  // Automáticamente extrae las áreas del usuario
    @ClientFilter() clientFilter: string | null, // Automáticamente extrae el clientId
    @CurrentUser() user: any
  ) {
    // Pasar los filtros al service
    return this.findingService.findAll(areaFilter, clientFilter, user.role);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(
    @Param('id') id: string,
    @AreaFilter() areaFilter: string[] | null,
    @CurrentUser() user: any
  ) {
    return this.findingService.findOne(id, areaFilter, user.role);
  }
}

/**
 * EJEMPLO 2: En el Service
 * =========================
 * Aplicación del filtro en las queries de Mongoose
 */
@Injectable()
export class FindingService {
  constructor(
    @InjectModel(Finding.name) private findingModel: Model<Finding>
  ) {}

  async findAll(
    areaFilter: string[] | null,
    clientFilter: string | null,
    userRole: string
  ): Promise<Finding[]> {
    const query: any = {};

    // FILTRO 1: Por Área (para AREA_ADMIN, ANALYST, VIEWER)
    if (areaFilter) {
      // Si areaFilter no es null, el usuario tiene restricción por área
      if (areaFilter.length === 0) {
        // Usuario sin áreas asignadas: no ve nada
        return [];
      }
      // Filtrar por áreas asignadas
      // NOTA: Asumiendo que Finding tiene un campo areaId
      query.areaId = { $in: areaFilter };
    }

    // FILTRO 2: Por Cliente/Tenant (para CLIENT_ADMIN)
    if (clientFilter && userRole === UserRole.CLIENT_ADMIN) {
      // Filtrar por el cliente del usuario
      // NOTA: Si Finding está relacionado con Project que tiene clientId:
      const projects = await this.projectModel.find({ clientId: clientFilter }).select('_id');
      const projectIds = projects.map(p => p._id);
      query.projectId = { $in: projectIds };
    }

    // OWNER y PLATFORM_ADMIN: areaFilter y clientFilter son null (acceso global)
    
    return this.findingModel
      .find(query)
      .populate('projectId')
      .populate('createdBy', 'email firstName lastName')
      .exec();
  }

  async findOne(id: string, areaFilter: string[] | null, userRole: string): Promise<Finding | null> {
    const query: any = { _id: id };

    // Aplicar el mismo filtro que en findAll
    if (areaFilter) {
      if (areaFilter.length === 0) {
        return null; // Usuario sin áreas: no puede ver nada
      }
      query.areaId = { $in: areaFilter };
    }

    return this.findingModel
      .findOne(query)
      .populate('projectId')
      .populate('createdBy', 'email firstName lastName')
      .exec();
  }

  async update(
    id: string,
    updateData: any,
    areaFilter: string[] | null,
    userRole: string
  ): Promise<Finding> {
    // IMPORTANTE: Verificar que el usuario tenga acceso al recurso ANTES de actualizar
    const existing = await this.findOne(id, areaFilter, userRole);
    
    if (!existing) {
      throw new NotFoundException('Hallazgo no encontrado o sin permisos');
    }

    return this.findingModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async delete(id: string, areaFilter: string[] | null, userRole: string): Promise<void> {
    // IMPORTANTE: Verificar que el usuario tenga acceso al recurso ANTES de eliminar
    const existing = await this.findOne(id, areaFilter, userRole);
    
    if (!existing) {
      throw new NotFoundException('Hallazgo no encontrado o sin permisos');
    }

    await this.findingModel.findByIdAndDelete(id).exec();
  }
}

/**
 * EJEMPLO 3: En una Query Compleja con Aggregation
 * =================================================
 */
async getStatisticsByArea(areaFilter: string[] | null): Promise<any> {
  const pipeline: any[] = [];

  // Aplicar filtro de área al inicio del pipeline
  if (areaFilter) {
    if (areaFilter.length === 0) {
      return []; // Sin áreas: retornar vacío
    }
    pipeline.push({
      $match: {
        areaId: { $in: areaFilter.map(id => new Types.ObjectId(id)) }
      }
    });
  }

  // Resto del pipeline de aggregation
  pipeline.push(
    {
      $group: {
        _id: '$severity',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  );

  return this.findingModel.aggregate(pipeline).exec();
}

/**
 * RESUMEN DE IMPLEMENTACIÓN
 * ==========================
 * 
 * 1. En controllers: usar @AreaFilter() y @ClientFilter() decorators
 * 2. Pasar los filtros a los services como parámetros
 * 3. En services: aplicar filtros en TODAS las queries (find, findOne, update, delete)
 * 4. Verificar acceso ANTES de modificar/eliminar recursos
 * 5. Para aggregation: agregar $match con areaId al inicio del pipeline
 * 
 * IMPORTANTE:
 * - areaFilter = null: acceso global (OWNER, PLATFORM_ADMIN)
 * - areaFilter = []: usuario sin áreas asignadas (retornar vacío)
 * - areaFilter = ['id1', 'id2']: filtrar por esas áreas específicas
 */

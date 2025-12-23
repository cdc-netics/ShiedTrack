import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserAreaAssignment } from './schemas/user-area-assignment.schema';
import { User } from './schemas/user.schema';

@Injectable()
export class UserAreaService {
  constructor(
    @InjectModel(UserAreaAssignment.name)
    private userAreaModel: Model<UserAreaAssignment>,
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}

  /**
   * Asignar un área a un usuario (solo OWNER)
   */
  async assignArea(
    userId: string,
    areaId: string,
    assignedBy: string,
  ): Promise<UserAreaAssignment> {
    // Verificar que el usuario existe
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar si ya existe la asignación
    const existing = await this.userAreaModel.findOne({
      userId: new Types.ObjectId(userId),
      areaId: new Types.ObjectId(areaId),
    });

    if (existing) {
      if (existing.isActive) {
        throw new BadRequestException('El usuario ya tiene asignada esta área');
      }
      // Reactivar asignación existente
      existing.isActive = true;
      existing.assignedBy = new Types.ObjectId(assignedBy);
      existing.assignedAt = new Date();
      return existing.save();
    }

    // Crear nueva asignación
    const assignment = new this.userAreaModel({
      userId: new Types.ObjectId(userId),
      areaId: new Types.ObjectId(areaId),
      assignedBy: new Types.ObjectId(assignedBy),
      assignedAt: new Date(),
      isActive: true,
    });

    const saved = await assignment.save();

    // Actualizar el array areaIds del usuario
    await this.userModel.findByIdAndUpdate(userId, {
      $addToSet: { areaIds: new Types.ObjectId(areaId) },
    });

    return saved;
  }

  /**
   * Remover un área de un usuario (solo OWNER)
   */
  async removeArea(userId: string, areaId: string): Promise<void> {
    const assignment = await this.userAreaModel.findOne({
      userId: new Types.ObjectId(userId),
      areaId: new Types.ObjectId(areaId),
      isActive: true,
    });

    if (!assignment) {
      throw new NotFoundException('Asignación no encontrada');
    }

    // Soft delete
    assignment.isActive = false;
    await assignment.save();

    // Remover del array areaIds del usuario
    await this.userModel.findByIdAndUpdate(userId, {
      $pull: { areaIds: new Types.ObjectId(areaId) },
    });
  }

  /**
   * Obtener todas las áreas asignadas a un usuario
   */
  async getUserAreas(userId: string): Promise<UserAreaAssignment[]> {
    return this.userAreaModel
      .find({
        userId: new Types.ObjectId(userId),
        isActive: true,
      })
      .populate('areaId')
      .populate('assignedBy', 'email firstName lastName')
      .exec();
  }

  /**
   * Obtener todos los usuarios asignados a un área
   */
  async getAreaUsers(areaId: string): Promise<UserAreaAssignment[]> {
    return this.userAreaModel
      .find({
        areaId: new Types.ObjectId(areaId),
        isActive: true,
      })
      .populate('userId', 'email firstName lastName role')
      .populate('assignedBy', 'email firstName lastName')
      .exec();
  }

  /**
   * Asignar múltiples áreas a un usuario de una vez
   */
  async assignMultipleAreas(
    userId: string,
    areaIds: string[],
    assignedBy: string,
  ): Promise<UserAreaAssignment[]> {
    const assignments: UserAreaAssignment[] = [];

    for (const areaId of areaIds) {
      try {
        const assignment = await this.assignArea(userId, areaId, assignedBy);
        assignments.push(assignment);
      } catch (error) {
        // Continuar con las demás áreas si una falla
        console.warn(`Error asignando área ${areaId} a usuario ${userId}:`, error.message);
      }
    }

    return assignments;
  }

  /**
   * Reemplazar todas las áreas de un usuario (sobrescribir)
   */
  async replaceUserAreas(
    userId: string,
    newAreaIds: string[],
    assignedBy: string,
  ): Promise<UserAreaAssignment[]> {
    // Desactivar todas las asignaciones actuales
    await this.userAreaModel.updateMany(
      { userId: new Types.ObjectId(userId), isActive: true },
      { isActive: false },
    );

    // Limpiar areaIds del usuario
    await this.userModel.findByIdAndUpdate(userId, {
      $set: { areaIds: [] },
    });

    // Asignar las nuevas áreas
    return this.assignMultipleAreas(userId, newAreaIds, assignedBy);
  }
}

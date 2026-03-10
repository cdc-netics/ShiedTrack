import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from './schema/user.schema';

@Injectable()
export class UserService {

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  /**
   * Asigna proyectos visibles a un usuario
   */
  async assignVisibleProjects(userId: string, visibleProjectIds: string[]) {

    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      {
        $set: {
          visibleProjectIds: visibleProjectIds.map(
            (id) => new Types.ObjectId(id)
          ),
        },
      },
      { new: true },
    );

    if (!updatedUser) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    return updatedUser;
  }

}
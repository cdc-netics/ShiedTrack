import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomRoleController } from './custom-role.controller';
import { CustomRoleService } from './custom-role.service';
import { CustomRole, CustomRoleSchema } from './schemas/custom-role.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CustomRole.name, schema: CustomRoleSchema },
    ]),
  ],
  controllers: [CustomRoleController],
  providers: [CustomRoleService],
  exports: [CustomRoleService],
})
export class CustomRoleModule {}

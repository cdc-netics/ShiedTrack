import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CustomRoleController } from "./custom-role.controller";
import { CustomRoleService } from "./custom-role.service";
import { CustomRole, CustomRoleSchema } from "./schemas/custom-role.schema";
import { User, UserSchema } from "../auth/schemas/user.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CustomRole.name, schema: CustomRoleSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [CustomRoleController],
  providers: [CustomRoleService],
  exports: [CustomRoleService],
})
export class CustomRoleModule {}

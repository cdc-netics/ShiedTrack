import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "../auth/schemas/user.schema";
import { Project, ProjectSchema } from "../project/schemas/project.schema";
import { Tenant, TenantSchema } from "../tenant/schemas/tenant.schema";
import {
  NotificationRule,
  NotificationRuleSchema,
} from "./schemas/notification-rule.schema";
import {
  NotificationTemplate,
  NotificationTemplateSchema,
} from "./schemas/notification-template.schema";
import { NotificationController } from "./notification.controller";
import { NotificationService } from "./notification.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NotificationRule.name, schema: NotificationRuleSchema },
      { name: NotificationTemplate.name, schema: NotificationTemplateSchema },
      { name: User.name, schema: UserSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Tenant.name, schema: TenantSchema },
    ]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FindingService } from './finding.service';
import { FindingController } from './finding.controller';
import { Finding, FindingSchema } from './schemas/finding.schema';
import { FindingUpdate, FindingUpdateSchema } from './schemas/finding-update.schema';
import { Project, ProjectSchema } from '../project/schemas/project.schema';
import { SystemConfig, SystemConfigSchema } from '../system-config/schemas/system-config.schema';
import { Area, AreaSchema } from '../area/schemas/area.schema';
import { EmailModule } from '../email/email.module';
import { User, UserSchema } from '../auth/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Finding.name, schema: FindingSchema },
      { name: FindingUpdate.name, schema: FindingUpdateSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: SystemConfig.name, schema: SystemConfigSchema },
      { name: Area.name, schema: AreaSchema },
      { name: User.name, schema: UserSchema },
    ]),
    EmailModule,
  ],
  providers: [FindingService],
  controllers: [FindingController],
  exports: [FindingService],
})
export class FindingModule {}

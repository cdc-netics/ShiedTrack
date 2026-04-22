import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailService } from './email.service';
import { NotificationModule } from '../notification/notification.module';
import { SystemConfig, SystemConfigSchema } from '../system-config/schemas/system-config.schema';

@Module({
  imports: [
    NotificationModule,
    MongooseModule.forFeature([
      { name: SystemConfig.name, schema: SystemConfigSchema },
    ]),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}

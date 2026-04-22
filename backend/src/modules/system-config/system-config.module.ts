import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailModule } from '../email/email.module';
import { SystemConfig, SystemConfigSchema } from './schemas/system-config.schema';
import { SystemBranding, SystemBrandingSchema } from './schemas/system-branding.schema';
import { SystemConfigService } from './system-config.service';
import { SystemConfigController } from './system-config.controller';

@Module({
  imports: [
    EmailModule,
    MongooseModule.forFeature([
      { name: SystemConfig.name, schema: SystemConfigSchema },
      { name: SystemBranding.name, schema: SystemBrandingSchema }
    ])
  ],
  controllers: [SystemConfigController],
  providers: [SystemConfigService],
  exports: [SystemConfigService], // Para usar en retest-scheduler.service
})
export class SystemConfigModule {}

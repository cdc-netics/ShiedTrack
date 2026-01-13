import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailService } from './email.service';
import { SystemConfig, SystemConfigSchema } from '../system-config/schemas/system-config.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SystemConfig.name, schema: SystemConfigSchema },
    ]),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}

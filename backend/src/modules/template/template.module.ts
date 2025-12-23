import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TemplateController } from './template.controller';
import { TemplateService } from './template.service';
import { FindingTemplate, FindingTemplateSchema } from './schemas/finding-template.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FindingTemplate.name, schema: FindingTemplateSchema },
    ]),
  ],
  controllers: [TemplateController],
  providers: [TemplateService],
  exports: [TemplateService],
})
export class TemplateModule {}

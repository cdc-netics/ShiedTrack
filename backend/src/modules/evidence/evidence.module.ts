import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { EvidenceService } from './evidence.service';
import { EvidenceController } from './evidence.controller';
import { Evidence, EvidenceSchema } from './schemas/evidence.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Evidence.name, schema: EvidenceSchema }]),
    // SECURITY FIX M2: Rate limiting para endpoints de descarga
    ThrottlerModule.forRoot([{
      ttl: 60000, // 60 segundos
      limit: 10, // 10 requests por minuto
    }]),
  ],
  providers: [EvidenceService],
  controllers: [EvidenceController],
  exports: [EvidenceService],
})
export class EvidenceModule {}

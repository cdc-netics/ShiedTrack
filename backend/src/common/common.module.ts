import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongoDBConnectionService } from './services/mongodb-connection.service';

/**
 * Módulo común con servicios compartidos y utilidades globales
 */
@Module({
  imports: [ConfigModule],
  providers: [MongoDBConnectionService],
  exports: [MongoDBConnectionService],
})
export class CommonModule {}

import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { MetricsController } from "./metrics.controller";
import { MetricsQueryService } from "./services/metrics-query.service";
import { MetricsExportService } from "./services/metrics-export.service";
import { Finding, FindingSchema } from "../finding/schemas/finding.schema";
import { Project, ProjectSchema } from "../project/schemas/project.schema";
import { Client, ClientSchema } from "../client/schemas/client.schema";

// Repositories
import { MongooseFindingRepository } from "./repositories/mongoose/mongoose-finding.repository";
import { MongooseProjectRepository } from "./repositories/mongoose/mongoose-project.repository";
import { MongooseClientRepository } from "./repositories/mongoose/mongoose-client.repository";

// Strategies
import { CsvExportStrategy } from "./export-strategies/csv-export.strategy";
import { JsonExportStrategy } from "./export-strategies/json-export.strategy";

/**
 * Módulo de Métricas y Estadísticas Exportables (M6)
 *
 * Expone endpoints de reporting para consumo externo por herramientas de BI
 * como Metabase, PowerBI u otras plataformas de análisis de datos.
 *
 * Acceso restringido a roles: OWNER, PLATFORM_ADMIN
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Finding.name, schema: FindingSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Client.name, schema: ClientSchema },
    ]),
  ],
  controllers: [MetricsController],
  providers: [
    // Services
    MetricsQueryService,
    MetricsExportService,

    // Repositories (DIP)
    {
      provide: "IFindingRepository",
      useClass: MongooseFindingRepository,
    },
    {
      provide: "IProjectRepository",
      useClass: MongooseProjectRepository,
    },
    {
      provide: "IClientRepository",
      useClass: MongooseClientRepository,
    },

    // Strategies
    CsvExportStrategy,
    JsonExportStrategy,
  ],
  exports: [MetricsQueryService, MetricsExportService],
})
export class MetricsModule {}

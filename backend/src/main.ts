import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import * as mongoose from "mongoose";
import { json, urlencoded } from "express";
import type { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { AuditInterceptor } from "./modules/audit/audit.interceptor";
import { AuditService } from "./modules/audit/audit.service";
import { MongoDBConnectionService } from "./common/services/mongodb-connection.service";
import { tenantPlugin } from "./common/plugins/tenant-plugin";

const logger = new Logger("Bootstrap");

/**
 * Punto de entrada de la aplicación ShieldTrack
 * Configura validación global, Swagger y filtros de excepción
 * Implementa conexión robusta a MongoDB con reintentos automáticos
 */
async function bootstrap() {
  // Crear instancia de MongoDBConnectionService directamente

  const configService = new ConfigService();
  const mongoConnectionService = new MongoDBConnectionService(configService);

  // Establecer conexión a MongoDB con reintentos automáticos
  try {
    logger.log("📦 Iniciando servicio de conexión a MongoDB");
    await mongoConnectionService.connectWithRetry();
    logger.log("✅ MongoDB conectado correctamente");
  } catch (error) {
    logger.error(
      `❌ No se pudo establecer conexión a MongoDB: ${error.message}`,
    );
    logger.error(
      "💡 Por favor, asegúrese de que MongoDB está instalado y ejecutándose",
    );
    process.exit(1);
  }

  // Ahora crear la aplicación principal
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // Area branding can include base64 previews for logo/favicon.
  app.use(json({ limit: "25mb" }));
  app.use(urlencoded({ limit: "25mb", extended: true }));

  // Configuración de prefijo global para la API
  app.setGlobalPrefix("api", {
    exclude: ["/", "favicon.ico"],
  });

  // Registrar plugin global de Mongoose para filtro por tenant
  mongoose.plugin(tenantPlugin);

  // Configuración global de validación - OBLIGATORIO según requisitos
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true, // Transforma payloads a instancias de DTO
      transformOptions: {
        enableImplicitConversion: true, // Convierte tipos automáticamente
      },
    }),
  );

  // Filtro global de excepciones para manejo consistente de errores
  app.useGlobalFilters(new HttpExceptionFilter());

  // Interceptor global de auditoría
  const auditService = app.get(AuditService);
  app.useGlobalInterceptors(new AuditInterceptor(auditService));

  // Configuración CORS robusta
  const isProduction = process.env.NODE_ENV === "production";
  const configuredOrigins = (
    process.env.CORS_ORIGINS ||
    process.env.FRONTEND_URL ||
    ""
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Peticiones sin cabecera Origin: mismo origen (p. ej. front en :80 y /api por nginx),
      // herramientas o algunos navegadores; antes fallaban en NODE_ENV=production.
      if (!origin) {
        callback(null, true);
        return;
      }

      if (configuredOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      if (!isProduction) {
        callback(null, true);
        return;
      }

      callback(new Error("Origen no permitido por política CORS"));
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
    allowedHeaders:
      "Content-Type, Accept, Authorization, X-Requested-With, X-Tenant-Id",
  } as CorsOptions);

  // Configuración de Swagger para documentación de API
  const config = new DocumentBuilder()
    .setTitle("ShieldTrack API")
    .setDescription(
      "Sistema de gestión de hallazgos de ciberseguridad - API Documentation",
    )
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Ingrese el token JWT",
        in: "header",
      },
      "JWT-auth",
    )
    .addTag("Auth", "Autenticación y gestión de usuarios")
    .addTag("Clients", "Gestión de clientes (Tenants)")
    .addTag("Areas", "Gestión de áreas")
    .addTag("Projects", "Gestión de proyectos")
    .addTag("Findings", "Gestión de hallazgos")
    .addTag("Evidence", "Gestión de evidencias")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`ShieldTrack Backend corriendo en: http://localhost:${port}`);
  logger.log(
    `📚 Documentación Swagger disponible en: http://localhost:${port}/api/docs`,
  );
}

bootstrap();

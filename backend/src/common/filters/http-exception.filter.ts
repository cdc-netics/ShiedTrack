import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { MulterError } from "multer";

/**
 * Filtro global para capturar todas las excepciones HTTP
 * Proporciona formato consistente de respuestas de error y logging
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Multer no lanza HttpException — lo tratamos aparte para dar un mensaje claro
    // (ej. archivo demasiado grande) en vez del genérico "Error interno del servidor"
    if (exception instanceof MulterError) {
      const status =
        exception.code === "LIMIT_FILE_SIZE"
          ? HttpStatus.PAYLOAD_TOO_LARGE
          : HttpStatus.BAD_REQUEST;
      const message =
        exception.code === "LIMIT_FILE_SIZE"
          ? "El archivo supera el límite de tamaño permitido. Para archivos grandes (ej. videos), usa la opción de enlace externo (SharePoint, Drive, etc.)."
          : `Error al procesar el archivo: ${exception.message}`;

      this.logger.warn(`${request.method} ${request.url} - Multer: ${exception.code}`);
      response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        message,
      });
      return;
    }

    // Determinar el status code apropiado
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // NestJS ya convierte el MulterError de "archivo demasiado grande" en una
    // HttpException 413 antes de llegar aquí, pero conserva el mensaje genérico de
    // Multer ("File too large"). Se reemplaza por uno accionable para el usuario.
    if (status === HttpStatus.PAYLOAD_TOO_LARGE) {
      const errorResponse = {
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
        message:
          "El archivo supera el límite de tamaño permitido. Para archivos grandes (ej. videos), usa la opción de enlace externo (SharePoint, Drive, etc.).",
      };
      this.logger.warn(`${request.method} ${request.url} - 413 Payload Too Large`);
      response.status(status).json(errorResponse);
      return;
    }

    // Extraer mensaje de error
    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : "Error interno del servidor";

    // Construir respuesta de error estructurada
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message:
        typeof message === "string"
          ? message
          : (message as any).message || message,
    };

    // Log del error para auditoría
    this.logger.error(
      `${request.method} ${request.url} - Status: ${status} - ${JSON.stringify(errorResponse.message)}`,
      exception instanceof Error ? exception.stack : "",
    );

    response.status(status).json(errorResponse);
  }
}

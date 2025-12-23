import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

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

    // Determinar el status code apropiado
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Extraer mensaje de error
    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Error interno del servidor';

    // Construir respuesta de error estructurada
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: typeof message === 'string' ? message : (message as any).message || message,
    };

    // Log del error para auditoría
    this.logger.error(
      `${request.method} ${request.url} - Status: ${status} - ${JSON.stringify(errorResponse.message)}`,
      exception instanceof Error ? exception.stack : '',
    );

    response.status(status).json(errorResponse);
  }
}

import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

/**
 * Endpoints base para responder / y favicon de forma amable.
 * Evita 404 en la raíz cuando solo corre el backend y guía a Swagger.
 */
@Controller()
export class RootController {
  @Get()
  redirectToSwagger(@Res() res: Response) {
    return res.redirect('/api/docs');
  }

  @Get('favicon.ico')
  handleFavicon(@Res() res: Response) {
    // Devuelve 204 para evitar errores en el log si no hay favicon servido
    return res.status(204).end();
  }
}

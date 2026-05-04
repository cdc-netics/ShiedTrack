import { Response } from "express";

export interface IExportStrategy {
  /**
   * Exporta los datos al formato correspondiente y escribe la respuesta HTTP.
   * @param data Los datos a exportar.
   * @param res El objeto Response de Express.
   * @param filename El nombre base para el archivo exportado (sin extensión).
   */
  export(data: any[], res: Response, filename: string): void | Promise<void>;
}

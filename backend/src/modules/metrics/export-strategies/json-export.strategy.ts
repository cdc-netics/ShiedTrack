import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { IExportStrategy } from './export-strategy.interface';

@Injectable()
export class JsonExportStrategy implements IExportStrategy {
  export(data: any[], res: Response, filename: string): void {
    res.setHeader('Content-Type', 'application/json');
    res.json({
      count: data.length,
      data: data,
      exportedAt: new Date().toISOString(),
    });
  }
}

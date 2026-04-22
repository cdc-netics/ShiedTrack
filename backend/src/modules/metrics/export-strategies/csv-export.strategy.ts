import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { IExportStrategy } from './export-strategy.interface';

@Injectable()
export class CsvExportStrategy implements IExportStrategy {
  export(data: any[], res: Response, filename: string): void {
    const csv = this.toCSV(data);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}.csv"`,
    );
    res.send(csv);
  }

  private toCSV(rows: any[]): string {
    if (rows.length === 0) return '';

    const headers = Object.keys(rows[0]);
    const csvRows = [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((h) => {
            const val = row[h];
            if (val === null || val === undefined) return '';
            const str = String(val);
            // Escapar comas y comillas
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(','),
      ),
    ];

    return csvRows.join('\n');
  }
}

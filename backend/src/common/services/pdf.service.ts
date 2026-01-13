import { Injectable, Logger } from '@nestjs/common';
// @ts-ignore
import PdfPrinter = require('pdfmake');
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { createWriteStream } from 'fs';
import { join } from 'path';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private printer: PdfPrinter;

  constructor() {
    const fonts = {
      Roboto: {
        normal: 'node_modules/pdfmake/fonts/Roboto/Roboto-Regular.ttf',
        bold: 'node_modules/pdfmake/fonts/Roboto/Roboto-Medium.ttf',
        italics: 'node_modules/pdfmake/fonts/Roboto/Roboto-Italic.ttf',
        bolditalics: 'node_modules/pdfmake/fonts/Roboto/Roboto-MediumItalic.ttf'
      },
      // Fallback fonts if Roboto isn't found (sometimes structure varies)
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
      }
    };
    
    // We try to access the standard fonts, but in some environments (like standard node), 
    // it's better to rely on standard fonts or carefully map paths.
    // For simplicity in this environment, let's use standard fonts via a trick or just use the Roboto path assumption.
    // Actually, pdfmake comes with vfs_fonts.js which is for client-side purely usually, 
    // but on server side we need physical font files.
    // Workaround: Use standard fonts or ensure fonts exist.
    
    // Often simpler to just use standard valid fonts like Helvetica for non-fancy needs
    // But pdfmake requires definitions.
    
    // Let's use a standard font configuration for server-side
    const standardFonts = {
      Roboto: {
        normal: 'Helvetica', 
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
      }
    };

    // Note: To really simple usage without local font files, we can just map everything to standard fonts.
    this.printer = new PdfPrinter(standardFonts);
  }

  /**
   * Genera un PDF de un hallazgo individual
   */
  async generateFindingReport(finding: any): Promise<Buffer> {
    const docDefinition: TDocumentDefinitions = {
      content: [
        { text: 'Reporte de Hallazgo de Seguridad', style: 'header' },
        { text: '\n' },
        {
          table: {
            widths: ['30%', '70%'],
            body: [
              ['ID:', finding.code],
              ['Título:', finding.title],
              ['Severidad:', { text: finding.severity, color: this.getSeverityColor(finding.severity), bold: true }],
              ['Estado:', finding.status],
              ['CVSS:', finding.cvss_score || 'N/A'],
              ['Activos Afectados:', finding.affectedAssets?.join(', ') || finding.affectedAsset || 'N/A']
            ]
          }
        },
        { text: '\nDescripción', style: 'subheader' },
        { text: finding.description || 'Sin descripción' },
        
        { text: '\nImpacto', style: 'subheader' },
        { text: finding.impact || 'N/A' },

        { text: '\nRecomendación', style: 'subheader' },
        { text: finding.recommendation || 'N/A' },

        { text: '\nReferencias', style: 'subheader' },
        finding.references?.length ? { ul: finding.references } : { text: 'N/A' }
      ],
      styles: {
        header: { fontSize: 22, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
        subheader: { fontSize: 16, bold: true, margin: [0, 10, 0, 5] }
      },
      defaultStyle: {
        font: 'Roboto'
      }
    };

    return this.createPdfBuffer(docDefinition);
  }

  /**
   * Genera reporte PDF completo de Proyecto
   */
  async generateProjectReport(project: any, findings: any[]): Promise<Buffer> {
    const findingsRows = findings.map(f => [
      f.code,
      f.title,
      { text: f.severity, color: this.getSeverityColor(f.severity), bold: true },
      f.status,
      f.cvss_score || '-'
    ]);

    const docDefinition: TDocumentDefinitions = {
      content: [
        { text: `Reporte de Proyecto: ${project.name}`, style: 'header' },
        { text: `Cliente: ${project.clientId.name || 'N/A'}`, style: 'subheader' },
        { text: `Fecha: ${new Date().toLocaleDateString('es-CL')}`, alignment: 'right' },
        { text: '\n' },
        
        { text: 'Resumen Ejecutivo', style: 'sectionHeader' },
        { text: project.description || 'Sin descripción disponible del proyecto.' },
        { text: '\n' },

        { text: `Hallazgos Identificados (${findings.length})`, style: 'sectionHeader' },
        {
          table: {
            headerRows: 1,
            widths: ['15%', '40%', '15%', '15%', '15%'],
            body: [
              [{ text: 'ID', bold: true }, { text: 'Título', bold: true }, { text: 'Severidad', bold: true }, { text: 'Estado', bold: true }, { text: 'CVSS', bold: true }],
              ...findingsRows
            ]
          }
        },
        
        { text: '\nDetalle de Hallazgos', style: 'sectionHeader', pageBreak: 'before' },
        ...this.buildFindingsDetail(findings)
      ],
      styles: {
        header: { fontSize: 24, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
        subheader: { fontSize: 14, alignment: 'center', margin: [0, 0, 0, 20] },
        sectionHeader: { fontSize: 18, bold: true, margin: [0, 10, 0, 10], decoration: 'underline' },
        findingTitle: { fontSize: 16, bold: true, margin: [0, 15, 0, 5], color: '#333' }
      },
      defaultStyle: {
        font: 'Roboto',
        fontSize: 10
      }
    };

    return this.createPdfBuffer(docDefinition);
  }

  private buildFindingsDetail(findings: any[]): any[] {
    const details: any[] = [];
    
    findings.forEach(f => {
      details.push(
        { text: `${f.code} - ${f.title}`, style: 'findingTitle' },
        { 
          table: {
            widths: ['20%', '80%'],
            body: [
              ['Severidad', { text: f.severity, color: this.getSeverityColor(f.severity), bold: true }],
              ['Estado', f.status],
              ['CVSS', f.cvss_score || 'N/A'],
              ['Activos', f.affectedAssets?.join(', ') || f.affectedAsset || 'N/A']
            ]
          },
          margin: [0, 0, 0, 10]
        },
        { text: 'Descripción:', bold: true },
        { text: f.description || 'N/A', margin: [0, 0, 0, 5] },
        { text: 'Recomendación:', bold: true },
        { text: f.recommendation || 'N/A', margin: [0, 0, 0, 10] },
        { text: '____________________________________________________________________________________', margin: [0, 10, 0, 20], color: '#ccc' }
      );
    });

    return details;
  }

  private getSeverityColor(severity: string): string {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'red';
      case 'high': return '#ff6b6b';
      case 'medium': return 'orange';
      case 'low': return 'gold';
      default: return 'gray';
    }
  }

  private createPdfBuffer(docDefinition: TDocumentDefinitions): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = this.printer.createPdfKitDocument(docDefinition);
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: any) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: any) => reject(err));
      doc.end();
    });
  }
}

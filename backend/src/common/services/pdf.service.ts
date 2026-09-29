import { Injectable, Logger } from "@nestjs/common";
// @ts-ignore
import PdfPrinter = require("pdfmake");
import { TDocumentDefinitions, Content } from "pdfmake/interfaces";
import { createWriteStream, promises as fsp } from "fs";
import { join } from "path";
import sharp from "sharp";

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private printer: PdfPrinter;

  constructor() {
    const fonts = {
      Roboto: {
        normal: "node_modules/pdfmake/fonts/Roboto/Roboto-Regular.ttf",
        bold: "node_modules/pdfmake/fonts/Roboto/Roboto-Medium.ttf",
        italics: "node_modules/pdfmake/fonts/Roboto/Roboto-Italic.ttf",
        bolditalics:
          "node_modules/pdfmake/fonts/Roboto/Roboto-MediumItalic.ttf",
      },
      // Fallback fonts if Roboto isn't found (sometimes structure varies)
      Helvetica: {
        normal: "Helvetica",
        bold: "Helvetica-Bold",
        italics: "Helvetica-Oblique",
        bolditalics: "Helvetica-BoldOblique",
      },
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
        normal: "Helvetica",
        bold: "Helvetica-Bold",
        italics: "Helvetica-Oblique",
        bolditalics: "Helvetica-BoldOblique",
      },
    };

    // Note: To really simple usage without local font files, we can just map everything to standard fonts.
    this.printer = new PdfPrinter(standardFonts);
  }

  /**
   * Genera un PDF de un hallazgo individual, con todo el detalle técnico y la
   * lista de evidencias (imágenes embebidas como miniatura; videos y enlaces
   * externos se referencian por texto, ya que no se pueden "imprimir")
   */
  async generateFindingReport(
    finding: any,
    evidences: any[] = [],
    project?: any,
  ): Promise<Buffer> {
    const infoRows: any[] = [
      ["Código:", finding.code || "N/A"],
      ["Código interno:", finding.internal_code || "N/A"],
      [
        "Severidad:",
        {
          text: finding.severity,
          color: this.getSeverityColor(finding.severity),
          bold: true,
        },
      ],
    ];

    if (finding.businessRisk) {
      infoRows.push([
        "Riesgo de Negocio:",
        {
          text: finding.businessRisk,
          color: this.getSeverityColor(finding.businessRisk),
          bold: true,
        },
      ]);
    }

    infoRows.push(["Estado:", finding.status]);

    if (finding.status === "CLOSED") {
      infoRows.push([
        "Motivo de cierre:",
        `${finding.closeReason || "N/A"}${finding.closedAt ? ` (${new Date(finding.closedAt).toLocaleDateString("es-CL")})` : ""}`,
      ]);
    }

    infoRows.push(
      ["CVSS Score:", finding.cvss_score ?? "N/A"],
      ["Vector CVSS:", finding.cvss_vector || "N/A"],
      ["CVE ID:", finding.cve_id || "N/A"],
      ["CWE ID:", finding.cweId || "N/A"],
      ["Origen de Detección:", finding.detection_source || "N/A"],
      [
        "Activos Afectados:",
        finding.affectedAssets?.join(", ") || finding.affectedAsset || "N/A",
      ],
    );

    if (project) {
      infoRows.push([
        "Proyecto:",
        `${project.name || "N/A"}${project.clientId?.name ? ` — ${project.clientId.name}` : ""}`,
      ]);
    }

    if (finding.createdAt) {
      infoRows.push([
        "Fecha de creación:",
        new Date(finding.createdAt).toLocaleDateString("es-CL"),
      ]);
    }

    const content: Content[] = [
      { text: "Reporte de Hallazgo de Seguridad", style: "header" },
      { text: finding.title, style: "subheader" },
      { text: "\n" },
      { table: { widths: ["30%", "70%"], body: infoRows } },

      { text: "\nDescripción", style: "sectionHeader" },
      { text: finding.description || "Sin descripción" },

      { text: "\nImpacto", style: "sectionHeader" },
      { text: finding.impact || "N/A" },
    ];

    if (finding.implications) {
      content.push(
        { text: "\nImplicancias", style: "sectionHeader" },
        { text: finding.implications },
      );
    }

    if (finding.riskJustification) {
      content.push(
        { text: "\nJustificación del Riesgo", style: "sectionHeader" },
        { text: finding.riskJustification },
      );
    }

    content.push(
      { text: "\nRecomendación", style: "sectionHeader" },
      { text: finding.recommendation || "N/A" },
    );

    if (finding.controls?.length) {
      content.push(
        { text: "\nControles (CIS/NIST/OWASP)", style: "sectionHeader" },
        { ul: finding.controls },
      );
    }

    if (finding.tags?.length) {
      content.push(
        { text: "\nTags", style: "sectionHeader" },
        { text: finding.tags.join(", ") },
      );
    }

    content.push(
      { text: "\nReferencias", style: "sectionHeader" },
      finding.references?.length ? { ul: finding.references } : { text: "N/A" },
    );

    content.push({
      text: `\nEvidencias (${evidences.length})`,
      style: "sectionHeader",
    });
    content.push(...(await this.buildEvidenceBlocks(evidences)));

    const docDefinition: TDocumentDefinitions = {
      content,
      styles: {
        header: {
          fontSize: 20,
          bold: true,
          alignment: "center",
          margin: [0, 0, 0, 4],
        },
        subheader: { fontSize: 13, alignment: "center", color: "#555" },
        sectionHeader: { fontSize: 14, bold: true, margin: [0, 8, 0, 4] },
      },
      defaultStyle: {
        font: "Roboto",
      },
    };

    return this.createPdfBuffer(docDefinition);
  }

  /**
   * Construye el bloque de cada evidencia para el PDF: las imágenes se embeben
   * como miniatura (convertidas a PNG con sharp — el WebP que ahora usamos para
   * comprimir no lo soporta nativamente pdfmake). Videos y enlaces externos no
   * se pueden "imprimir", así que solo se referencian con una nota.
   */
  private async buildEvidenceBlocks(evidences: any[]): Promise<Content[]> {
    if (!evidences.length) {
      return [{ text: "No hay evidencias asociadas.", italics: true }];
    }

    const blocks: Content[] = [];
    let index = 0;
    for (const evidence of evidences) {
      index++;
      const label = `#${index} — ${evidence.filename || "Evidencia"}`;

      if (evidence.evidenceType === "LINK") {
        blocks.push({
          text: [
            { text: `${label}: `, bold: true },
            {
              text: evidence.externalUrl,
              link: evidence.externalUrl,
              color: "#1976d2",
              decoration: "underline",
            },
            { text: "  (enlace externo)", italics: true, color: "#777" },
          ],
          margin: [0, 2, 0, 6],
        });
        continue;
      }

      const mimeType: string = evidence.mimeType || "";
      if (mimeType.startsWith("image/")) {
        const thumbnail = await this.tryBuildImageThumbnail(evidence.filePath);
        if (thumbnail) {
          blocks.push(
            { text: label, bold: true, margin: [0, 4, 0, 2] },
            { image: thumbnail, width: 260, margin: [0, 0, 0, 8] },
          );
          continue;
        }
      }

      const isVideo = mimeType.startsWith("video/");
      const note = isVideo
        ? "[Video] — visualizar en la plataforma (no se incluye en el PDF)"
        : "[Archivo] — descargar/visualizar en la plataforma";
      blocks.push({
        text: `${label} — ${note}`,
        margin: [0, 2, 0, 6],
      });
    }

    return blocks;
  }

  /** Lee el archivo de evidencia y lo convierte a PNG en miniatura (data URI) para pdfmake */
  private async tryBuildImageThumbnail(
    filePath?: string,
  ): Promise<string | null> {
    if (!filePath) return null;
    try {
      const buffer = await fsp.readFile(filePath);
      const png = await sharp(buffer)
        .resize({ width: 500, withoutEnlargement: true })
        .png()
        .toBuffer();
      return `data:image/png;base64,${png.toString("base64")}`;
    } catch (error) {
      this.logger.warn(
        `No se pudo generar la miniatura de evidencia "${filePath}" para el PDF: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Genera reporte PDF completo de Proyecto
   */
  async generateProjectReport(project: any, findings: any[]): Promise<Buffer> {
    const findingsRows = findings.map((f) => [
      f.code,
      f.title,
      {
        text: f.severity,
        color: this.getSeverityColor(f.severity),
        bold: true,
      },
      f.status,
      f.cvss_score || "-",
    ]);

    const docDefinition: TDocumentDefinitions = {
      content: [
        { text: `Reporte de Proyecto: ${project.name}`, style: "header" },
        {
          text: `Cliente: ${project.clientId.name || "N/A"}`,
          style: "subheader",
        },
        {
          text: `Fecha: ${new Date().toLocaleDateString("es-CL")}`,
          alignment: "right",
        },
        { text: "\n" },

        { text: "Resumen Ejecutivo", style: "sectionHeader" },
        {
          text:
            project.description || "Sin descripción disponible del proyecto.",
        },
        { text: "\n" },

        {
          text: `Hallazgos Identificados (${findings.length})`,
          style: "sectionHeader",
        },
        {
          table: {
            headerRows: 1,
            widths: ["15%", "40%", "15%", "15%", "15%"],
            body: [
              [
                { text: "ID", bold: true },
                { text: "Título", bold: true },
                { text: "Severidad", bold: true },
                { text: "Estado", bold: true },
                { text: "CVSS", bold: true },
              ],
              ...findingsRows,
            ],
          },
        },

        {
          text: "\nDetalle de Hallazgos",
          style: "sectionHeader",
          pageBreak: "before",
        },
        ...this.buildFindingsDetail(findings),
      ],
      styles: {
        header: {
          fontSize: 24,
          bold: true,
          alignment: "center",
          margin: [0, 0, 0, 10],
        },
        subheader: { fontSize: 14, alignment: "center", margin: [0, 0, 0, 20] },
        sectionHeader: {
          fontSize: 18,
          bold: true,
          margin: [0, 10, 0, 10],
          decoration: "underline",
        },
        findingTitle: {
          fontSize: 16,
          bold: true,
          margin: [0, 15, 0, 5],
          color: "#333",
        },
      },
      defaultStyle: {
        font: "Roboto",
        fontSize: 10,
      },
    };

    return this.createPdfBuffer(docDefinition);
  }

  private buildFindingsDetail(findings: any[]): any[] {
    const details: any[] = [];

    findings.forEach((f) => {
      details.push(
        { text: `${f.code} - ${f.title}`, style: "findingTitle" },
        {
          table: {
            widths: ["20%", "80%"],
            body: [
              [
                "Severidad",
                {
                  text: f.severity,
                  color: this.getSeverityColor(f.severity),
                  bold: true,
                },
              ],
              ["Estado", f.status],
              ["CVSS", f.cvss_score || "N/A"],
              [
                "Activos",
                f.affectedAssets?.join(", ") || f.affectedAsset || "N/A",
              ],
            ],
          },
          margin: [0, 0, 0, 10],
        },
        { text: "Descripción:", bold: true },
        { text: f.description || "N/A", margin: [0, 0, 0, 5] },
        { text: "Recomendación:", bold: true },
        { text: f.recommendation || "N/A", margin: [0, 0, 0, 10] },
        {
          text: "____________________________________________________________________________________",
          margin: [0, 10, 0, 20],
          color: "#ccc",
        },
      );
    });

    return details;
  }

  private getSeverityColor(severity: string): string {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "red";
      case "high":
        return "#ff6b6b";
      case "medium":
        return "orange";
      case "low":
        return "gold";
      default:
        return "gray";
    }
  }

  private createPdfBuffer(
    docDefinition: TDocumentDefinitions,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = this.printer.createPdfKitDocument(docDefinition);
      const chunks: Buffer[] = [];
      doc.on("data", (chunk: any) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err: any) => reject(err));
      doc.end();
    });
  }
}

import { Injectable, NotFoundException, Logger, BadRequestException, StreamableFile } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Evidence } from './schemas/evidence.schema';
import * as fs from 'fs';
import * as path from 'path';
import { createReadStream } from 'fs';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);
const mkdirAsync = promisify(fs.mkdir);

/**
 * Servicio de gestión de Evidencias
 * Maneja almacenamiento en disco local y metadatos en MongoDB
 * Los archivos solo son accesibles mediante autenticación JWT
 */
@Injectable()
export class EvidenceService {
  private readonly logger = new Logger(EvidenceService.name);
  private readonly uploadPath = process.env.EVIDENCE_STORAGE_PATH || './uploads/evidence';

  // Extensiones permitidas según requisitos
  private readonly allowedExtensions = [
    '.pdf', '.log', '.txt',
    '.jpg', '.jpeg', '.png', '.gif',
    '.zip', '.rar', '.7z',
    '.doc', '.docx', '.xls', '.xlsx',
    '.json', '.xml', '.csv',
  ];

  constructor(@InjectModel(Evidence.name) private evidenceModel: Model<Evidence>) {
    this.ensureUploadDirectory();
  }

  /**
   * Asegura que el directorio de uploads existe
   */
  private async ensureUploadDirectory(): Promise<void> {
    try {
      if (!fs.existsSync(this.uploadPath)) {
        await mkdirAsync(this.uploadPath, { recursive: true });
        this.logger.log(`Directorio de evidencias creado: ${this.uploadPath}`);
      }
    } catch (error) {
      this.logger.error(`Error creando directorio de evidencias: ${error.message}`);
    }
  }

  /**
   * Valida la extensión del archivo
   */
  private validateFileExtension(filename: string): void {
    const ext = path.extname(filename).toLowerCase();
    if (!this.allowedExtensions.includes(ext)) {
      throw new BadRequestException(
        `Extensión de archivo no permitida: ${ext}. Permitidas: ${this.allowedExtensions.join(', ')}`,
      );
    }
  }

  /**
   * Guarda un archivo de evidencia
   */
  async upload(
    file: Express.Multer.File,
    findingId: string,
    uploadedBy: string,
    description?: string,
    updateId?: string,
  ): Promise<Evidence> {
    this.validateFileExtension(file.originalname);

    // Generar nombre único para evitar colisiones
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const storedFilename = `${uniqueSuffix}${ext}`;
    const filePath = path.join(this.uploadPath, storedFilename);

    // Guardar archivo en disco
    fs.writeFileSync(filePath, file.buffer);

    // Crear registro en BD
    const evidence = new this.evidenceModel({
      filename: file.originalname,
      storedFilename,
      filePath,
      mimeType: file.mimetype,
      size: file.size,
      findingId,
      updateId,
      uploadedBy,
      description,
    });

    await evidence.save();

    this.logger.log(`Evidencia subida: ${file.originalname} (${file.size} bytes) para hallazgo ${findingId}`);
    return evidence;
  }

  /**
   * Obtiene evidencias de un hallazgo
   */
  async findByFinding(findingId: string): Promise<Evidence[]> {
    return this.evidenceModel.find({ findingId })
      .populate('uploadedBy', 'firstName lastName email')
      .sort({ createdAt: -1 });
  }

  /**
   * Busca evidencia por ID
   */
  async findById(id: string): Promise<Evidence> {
    const evidence = await this.evidenceModel.findById(id);
    if (!evidence) {
      throw new NotFoundException(`Evidencia con ID ${id} no encontrada`);
    }
    return evidence;
  }

  /**
   * Descarga un archivo de evidencia (con stream seguro)
   * El controller debe validar JWT antes de llamar este método
   */
  async downloadFile(id: string): Promise<{ stream: StreamableFile; evidence: Evidence }> {
    const evidence = await this.findById(id);

    // Verificar que el archivo existe en disco
    if (!fs.existsSync(evidence.filePath)) {
      this.logger.error(`Archivo no encontrado en disco: ${evidence.filePath}`);
      throw new NotFoundException('Archivo no encontrado en el servidor');
    }

    const file = createReadStream(evidence.filePath);
    const stream = new StreamableFile(file);

    return { stream, evidence };
  }

  /**
   * Elimina una evidencia (archivo y registro)
   */
  async delete(id: string): Promise<void> {
    const evidence = await this.findById(id);

    // Eliminar archivo físico
    try {
      if (fs.existsSync(evidence.filePath)) {
        await unlinkAsync(evidence.filePath);
      }
    } catch (error) {
      this.logger.error(`Error eliminando archivo: ${error.message}`);
    }

    // Eliminar registro
    await this.evidenceModel.findByIdAndDelete(id);

    this.logger.warn(`Evidencia eliminada: ${evidence.filename} (ID: ${id})`);
  }
}

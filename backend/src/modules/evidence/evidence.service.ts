import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
  StreamableFile,
  ForbiddenException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Evidence } from "./schemas/evidence.schema";
import { UserRole } from "../../common/enums";
import { normalizeRole, roleSatisfies } from "../../common/rbac/rbac-policy";
import * as fs from "fs";
import * as path from "path";
import { createReadStream } from "fs";
import { promisify } from "util";
import sharp from "sharp";

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
  private readonly uploadPath =
    process.env.EVIDENCE_STORAGE_PATH || "./uploads/evidence";

  // Extensiones permitidas según requisitos
  private readonly allowedExtensions = [
    ".pdf",
    ".log",
    ".txt",
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".zip",
    ".rar",
    ".7z",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".json",
    ".xml",
    ".csv",
    ".mp4",
    ".webm",
    ".mov",
  ];

  // Formatos de imagen que se recomprimen a WebP al subir (GIF se excluye para no
  // romper animaciones; SVG se excluye por ser vectorial, sin beneficio de recompresión)
  private readonly compressibleImageMimeTypes = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/bmp",
    "image/tiff",
  ];
  private readonly maxImageDimension = 1920; // px, lado más largo
  private readonly imageWebpQuality = 80;

  constructor(
    @InjectModel(Evidence.name) private evidenceModel: Model<Evidence>,
  ) {
    this.ensureUploadDirectory();
  }

  /**
   * Recomprime una imagen a WebP (redimensionando si excede maxImageDimension) para
   * reducir el uso de disco en el volumen de evidencias. Si el resultado no es más
   * liviano que el original (ej. imágenes ya muy pequeñas/optimizadas), se descarta
   * y se conserva el archivo original sin tocar.
   */
  private async compressImageIfApplicable(
    file: Express.Multer.File,
  ): Promise<{ buffer: Buffer; mimeType: string; extension: string } | null> {
    if (!this.compressibleImageMimeTypes.includes(file.mimetype)) {
      return null;
    }

    try {
      const compressed = await sharp(file.buffer)
        .rotate() // Auto-orienta según EXIF antes de descartar los metadatos
        .resize({
          width: this.maxImageDimension,
          height: this.maxImageDimension,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: this.imageWebpQuality })
        .toBuffer();

      if (compressed.length >= file.buffer.length) {
        return null;
      }

      return { buffer: compressed, mimeType: "image/webp", extension: ".webp" };
    } catch (error) {
      this.logger.warn(
        `No se pudo comprimir la imagen "${file.originalname}", se conserva el original: ${error.message}`,
      );
      return null;
    }
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
      this.logger.error(
        `Error creando directorio de evidencias: ${error.message}`,
      );
    }
  }

  /**
   * Valida la extensión del archivo
   */
  private validateFileExtension(filename: string): void {
    const ext = path.extname(filename).toLowerCase();
    if (!this.allowedExtensions.includes(ext)) {
      throw new BadRequestException(
        `Extensión de archivo no permitida: ${ext}. Permitidas: ${this.allowedExtensions.join(", ")}`,
      );
    }
  }

  private getCurrentTenantId(currentUser?: any): string | undefined {
    return (
      currentUser?.tenantId?.toString?.() ??
      currentUser?.activeTenantId?.toString?.() ??
      currentUser?.clientId?.toString?.()
    );
  }

  private isOperationalUser(currentUser?: any): boolean {
    return normalizeRole(currentUser?.role) === "PENTESTER_QA";
  }

  private shouldBypassTenantFilter(currentUser?: any): boolean {
    return this.isOperationalUser(currentUser) && !this.getCurrentTenantId(currentUser);
  }

  private toObjectId(id?: string): Types.ObjectId | undefined {
    if (!id) return undefined;
    return new Types.ObjectId(id);
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
    currentUser?: any,
  ): Promise<Evidence> {
    if (!file) {
      throw new BadRequestException("Archivo requerido");
    }

    const access = await this.validateAccessToFinding(findingId, currentUser);
    this.validateFileExtension(file.originalname);

    // Si es una imagen comprimible, se recomprime a WebP antes de guardar en disco
    const compressed = await this.compressImageIfApplicable(file);
    const bufferToStore = compressed?.buffer ?? file.buffer;
    const mimeTypeToStore = compressed?.mimeType ?? file.mimetype;
    const sizeToStore = bufferToStore.length;
    const originalExt = path.extname(file.originalname);
    const storedExt = compressed?.extension ?? originalExt;
    const filenameToStore = compressed
      ? `${path.basename(file.originalname, originalExt)}${compressed.extension}`
      : file.originalname;

    // Generar nombre único para evitar colisiones
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const storedFilename = `${uniqueSuffix}${storedExt}`;
    const filePath = path.join(this.uploadPath, storedFilename);

    // Guardar archivo en disco
    fs.writeFileSync(filePath, bufferToStore);

    // Crear registro en BD
    const evidence = new this.evidenceModel({
      evidenceType: "FILE",
      filename: filenameToStore,
      storedFilename,
      filePath,
      mimeType: mimeTypeToStore,
      size: sizeToStore,
      findingId: this.toObjectId(findingId),
      updateId: this.toObjectId(updateId),
      uploadedBy: this.toObjectId(uploadedBy),
      description,
      tenantId: this.toObjectId(access.tenantId),
    });

    await evidence.save();

    if (compressed) {
      const savedPct = Math.round((1 - sizeToStore / file.size) * 100);
      this.logger.log(
        `Evidencia subida: ${file.originalname} recomprimida a WebP (${file.size} → ${sizeToStore} bytes, -${savedPct}%) para hallazgo ${findingId}`,
      );
    } else {
      this.logger.log(
        `Evidencia subida: ${file.originalname} (${file.size} bytes) para hallazgo ${findingId}`,
      );
    }
    return evidence;
  }

  /**
   * Registra una evidencia de tipo enlace externo (ej. SharePoint, Drive) — pensado
   * para archivos que exceden el límite de subida (videos grandes principalmente),
   * ya que no se almacena ningún archivo en disco, solo la URL y una descripción.
   */
  async addLink(
    findingId: string,
    url: string,
    uploadedBy: string,
    description?: string,
    updateId?: string,
    currentUser?: any,
  ): Promise<Evidence> {
    const access = await this.validateAccessToFinding(findingId, currentUser);

    const evidence = new this.evidenceModel({
      evidenceType: "LINK",
      filename: description?.trim() || this.labelFromUrl(url),
      externalUrl: url,
      findingId: this.toObjectId(findingId),
      updateId: this.toObjectId(updateId),
      uploadedBy: this.toObjectId(uploadedBy),
      description,
      tenantId: this.toObjectId(access.tenantId),
    });

    await evidence.save();

    this.logger.log(
      `Evidencia de tipo enlace agregada para hallazgo ${findingId}: ${url}`,
    );
    return evidence;
  }

  /** Genera una etiqueta legible a partir de la URL cuando no hay descripción */
  private labelFromUrl(url: string): string {
    try {
      const { hostname } = new URL(url);
      return `Enlace externo (${hostname})`;
    } catch {
      return "Enlace externo";
    }
  }

  /**
   * Valida que el usuario tiene acceso al finding asociado a una evidencia
   * SEC-RBAC-001: Prevenir IDOR entre tenants
   */
  private async validateAccessToFinding(
    findingId: string,
    currentUser: any,
  ): Promise<{ tenantId?: string }> {
    // OWNER y PLATFORM_ADMIN ven todo
    const Finding = this.evidenceModel.db.model("Finding");
    const findingQuery = Finding.findById(findingId).select(
      "projectId tenantId",
    );

    if (this.shouldBypassTenantFilter(currentUser)) {
      findingQuery.setOptions({ skipTenantFilter: true });
    }

    const finding = await findingQuery;

    if (!finding) {
      throw new NotFoundException(`Hallazgo con ID ${findingId} no encontrado`);
    }

    // Obtener el cliente del proyecto
    const Project = this.evidenceModel.db.model("Project");
    const projectQuery = Project.findById(finding.projectId).select(
      "clientId tenantId",
    );

    if (this.shouldBypassTenantFilter(currentUser)) {
      projectQuery.setOptions({ skipTenantFilter: true });
    }

    const project = await projectQuery;

    if (!project) {
      throw new NotFoundException(`Proyecto no encontrado`);
    }

    const findingTenantId =
      finding.tenantId?.toString?.() ??
      project.tenantId?.toString?.() ??
      project.clientId?.toString?.();

    // OWNER y roles operativos (PENTESTER/QA/ANALYST) tienen acceso irrestricto
    if (roleSatisfies(UserRole.OWNER, currentUser?.role) || this.isOperationalUser(currentUser)) {
      return { tenantId: findingTenantId };
    }

    // Para el resto de roles, verificar que el tenant coincide
    const currentTenantId = this.getCurrentTenantId(currentUser);
    if (
      currentTenantId &&
      findingTenantId &&
      findingTenantId !== currentTenantId
    ) {
      this.logger.warn(
        `[SEC-RBAC-001] Intento de acceso cruzado de usuario ${currentUser.userId} al finding ${findingId}`,
      );
      throw new ForbiddenException(
        "No tienes permiso para acceder a este hallazgo",
      );
    }

    if (!currentTenantId) {
      throw new ForbiddenException(
        "No tienes permiso para acceder a este hallazgo",
      );
    }

    return { tenantId: findingTenantId };
  }

  /**
   * Obtiene evidencias de un hallazgo (con validación de acceso)
   * SEC-RBAC-001: Validar tenant del usuario
   */
  async findByFinding(
    findingId: string,
    currentUser?: any,
  ): Promise<Evidence[]> {
    // Validar acceso si se proporciona usuario
    if (currentUser) {
      await this.validateAccessToFinding(findingId, currentUser);
    }

    return this.evidenceModel
      .find({
        $or: [
          { findingId },
          ...(Types.ObjectId.isValid(findingId)
            ? [{ findingId: new Types.ObjectId(findingId) }]
            : []),
        ],
      })
      .populate("uploadedBy", "firstName lastName email")
      .sort({ createdAt: -1 });
  }

  /**
   * Busca evidencia por ID, con bypass de tenant filter para roles operativos
   */
  async findById(id: string, currentUser?: any): Promise<Evidence> {
    const query = this.evidenceModel.findById(id);
    if (currentUser && (roleSatisfies(UserRole.OWNER, currentUser?.role) || this.isOperationalUser(currentUser))) {
      query.setOptions({ skipTenantFilter: true });
    }
    const evidence = await query;
    if (!evidence) {
      throw new NotFoundException(`Evidencia con ID ${id} no encontrada`);
    }
    return evidence;
  }

  /**
   * Descarga un archivo de evidencia (con validación de acceso por tenant)
   * SEC-RBAC-001: Validar que el usuario tiene acceso al finding
   */
  async downloadFile(
    id: string,
    currentUser?: any,
  ): Promise<{ stream: StreamableFile; evidence: Evidence }> {
    const evidence = await this.findById(id, currentUser);

    // Validar acceso si se proporciona usuario
    if (currentUser) {
      await this.validateAccessToFinding(String(evidence.findingId), currentUser);
    }

    if (evidence.evidenceType === "LINK" || !evidence.filePath) {
      throw new BadRequestException(
        "Esta evidencia es un enlace externo, no un archivo — ábrelo directamente desde su URL",
      );
    }

    // Verificar que el archivo existe en disco
    if (!fs.existsSync(evidence.filePath)) {
      this.logger.error(`Archivo no encontrado en disco: ${evidence.filePath}`);
      throw new NotFoundException("Archivo no encontrado en el servidor");
    }

    const file = createReadStream(evidence.filePath);
    const stream = new StreamableFile(file);

    return { stream, evidence };
  }

  /**
   * Elimina una evidencia (archivo y registro)
   */
  async delete(id: string, currentUser?: any): Promise<void> {
    const evidence = await this.findById(id, currentUser);

    if (currentUser) {
      await this.validateAccessToFinding(String(evidence.findingId), currentUser);
    }

    // Eliminar archivo físico (no aplica a evidencias de tipo LINK, no tienen archivo)
    if (evidence.evidenceType !== "LINK") {
      try {
        if (evidence.filePath && fs.existsSync(evidence.filePath)) {
          await unlinkAsync(evidence.filePath);
        } else {
          this.logger.warn(
            `Archivo fisico no encontrado al eliminar evidencia: ${evidence.filePath}`,
          );
        }
      } catch (error) {
        this.logger.error(`Error eliminando archivo: ${error.message}`);
      }
    }

    // Eliminar registro
    await this.evidenceModel.findByIdAndDelete(id);

    this.logger.warn(`Evidencia eliminada: ${evidence.filename} (ID: ${id})`);
  }
}

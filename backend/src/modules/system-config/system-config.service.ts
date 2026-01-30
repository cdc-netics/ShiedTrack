import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { SystemConfig, encryptText, decryptText } from './schemas/system-config.schema';
import { SystemBranding } from './schemas/system-branding.schema';
import * as nodemailer from 'nodemailer';

/**
 * Servicio de Configuración del Sistema
 * Gestiona credenciales SMTP encriptadas y branding (solo OWNER puede acceder)
 */
@Injectable()
export class SystemConfigService {
  private readonly logger = new Logger(SystemConfigService.name);

  constructor(
    @InjectModel(SystemConfig.name) private systemConfigModel: Model<SystemConfig>,
    @InjectModel(SystemBranding.name) private systemBrandingModel: Model<SystemBranding>,
    @InjectConnection() private connection: Connection
  ) {}

  /**
   * Resetea la base de datos (Elimina datos de negocio, preserva Usuarios y Config)
   * Peligro: Acción destructiva
   */
  async resetDatabase(confirmation: string): Promise<{ success: boolean; message: string }> {
    if (confirmation !== 'DELETE') {
      throw new BadRequestException('Confirmación inválida. Se requiere "DELETE".');
    }

    const collectionsToClear = ['findings', 'projects', 'clients', 'areas', 'auditlogs'];
    
    this.logger.warn('INICIANDO RESET DE BASE DE DATOS - Acción Admin Owner');

    let deletedCounts: any = {};

    for (const name of collectionsToClear) {
      try {
        const collection = this.connection.collection(name);
        const result = await collection.deleteMany({});
        deletedCounts[name] = result.deletedCount;
        this.logger.log(`Colección ${name} limpiada: ${result.deletedCount} documentos eliminados.`);
      } catch (error) {
        this.logger.error(`Error limpiando colección ${name}:`, error);
        // Continuamos con las siguientes aunque falle una
      }
    }
    
    // También limpiamos uploads (físicamente no podemos desde aquí fácilmente sin servicio de archivos, 
    // pero idealmente se debería vaciar la carpeta uploads/evidence)
    // TODO: Limpiar archivos físicos si es necesario.

    return { 
      success: true, 
      message: 'Base de datos de negocio reseteada exitosamente'
    };
  }


  /**
   * Obtiene o crea configuración SMTP por defecto
   */
  async getSmtpConfig(): Promise<any> {
    let config = await this.systemConfigModel.findOne({ configKey: 'smtp_config' });

    // Si no existe, crear config por defecto (debe ser actualizada por OWNER)
    if (!config) {
      this.logger.warn('Configuración SMTP no encontrada, creando config por defecto');
      
      config = new this.systemConfigModel({
        configKey: 'smtp_config',
        smtp_host: 'localhost',
        smtp_port: 587,
        smtp_secure: false,
        smtp_user_encrypted: encryptText('user@example.com'),
        smtp_pass_encrypted: encryptText('password'),
        smtp_from_email: 'noreply@shieldtrack.com',
        smtp_from_name: 'ShieldTrack Notificaciones'
      });
      
      await config.save();
    }

    // Retornar credenciales desencriptadas
    return (config as any).getDecryptedCredentials();
  }

  /**
   * Actualiza configuración SMTP (SOLO OWNER)
   */
  async updateSmtpConfig(
    data: {
      smtp_host: string;
      smtp_port: number;
      smtp_secure: boolean;
      smtp_user: string;
      smtp_pass: string;
      smtp_from_email: string;
      smtp_from_name: string;
    },
    userId: string
  ): Promise<SystemConfig> {
    let config = await this.systemConfigModel.findOne({ configKey: 'smtp_config' });

    if (!config) {
      config = new this.systemConfigModel({ configKey: 'smtp_config' });
    }

    // Encriptar credenciales
    config.smtp_host = data.smtp_host;
    config.smtp_port = data.smtp_port;
    config.smtp_secure = data.smtp_secure;
    config.smtp_user_encrypted = encryptText(data.smtp_user);
    config.smtp_pass_encrypted = encryptText(data.smtp_pass);
    config.smtp_from_email = data.smtp_from_email;
    config.smtp_from_name = data.smtp_from_name;
    config.lastModifiedBy = userId as any;

    await config.save();

    this.logger.log(`Configuración SMTP actualizada por usuario ${userId}`);
    return config;
  }

  /**
   * Obtiene configuración SMTP (sin mostrar credenciales encriptadas)
   * Para vista de OWNER en frontend
   */
  async getSmtpConfigMasked(): Promise<any> {
    let config = await this.systemConfigModel.findOne({ configKey: 'smtp_config' });

    // Si no existe, crear config por defecto
    if (!config) {
      this.logger.warn('Configuración SMTP no encontrada, creando config por defecto');
      
      config = new this.systemConfigModel({
        configKey: 'smtp_config',
        smtp_host: 'localhost',
        smtp_port: 587,
        smtp_secure: false,
        smtp_user_encrypted: encryptText('user@example.com'),
        smtp_pass_encrypted: encryptText('password'),
        smtp_from_email: 'noreply@shieldtrack.com',
        smtp_from_name: 'ShieldTrack Notificaciones'
      });
      
      await config.save();
    }

    return {
      smtp_host: config.smtp_host,
      smtp_port: config.smtp_port,
      smtp_secure: config.smtp_secure,
      smtp_user: '***********', // Oculto
      smtp_pass: '***********', // Oculto
      smtp_from_email: config.smtp_from_email,
      smtp_from_name: config.smtp_from_name,
      lastModifiedBy: config.lastModifiedBy,
      updatedAt: (config as any).updatedAt
    };
  }

  /**
   * Prueba conexión SMTP con las credenciales actuales
   */
  async testSmtpConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const config = await this.getSmtpConfig();
      
      // Usar nodemailer para probar conexión
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: config.auth
      });

      await transporter.verify();

      this.logger.log('Conexión SMTP verificada exitosamente');
      return { success: true, message: 'Conexión SMTP exitosa' };
    } catch (error) {
      this.logger.error(`Error verificando SMTP: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  // ============================================================================
  // Branding Configuration Methods
  // ============================================================================

  /**
   * Obtiene la configuración de branding activa
   */
  async getBrandingConfig(): Promise<any> {
    const config = await this.systemBrandingModel.findOne().sort({ createdAt: -1 }).lean();

    // Si no existe, crear una configuración por defecto
    if (!config) {
      this.logger.log('No se encontró configuración de branding, creando una por defecto');
      const newConfig = new this.systemBrandingModel({
        appName: 'ShieldTrack',
        primaryColor: '#1976d2',
        secondaryColor: '#424242',
        isActive: true
      });
      await newConfig.save();
      return await this.systemBrandingModel.findOne().sort({ createdAt: -1 }).lean();
    }

    return config;
  }

  /**
   * Actualiza la configuración de branding (solo OWNER)
   */
  async updateBrandingConfig(
    data: Partial<any>,
    updatedBy: string
  ): Promise<any> {
    let config = await this.systemBrandingModel.findOne().sort({ createdAt: -1 });

    if (!config) {
      // Crear nueva configuración si no existe
      config = new this.systemBrandingModel({
        appName: data.appName || 'ShieldTrack',
        faviconUrl: data.faviconUrl,
        logoUrl: data.logoUrl,
        primaryColor: data.primaryColor || '#1976d2',
        secondaryColor: data.secondaryColor || '#424242',
        isActive: data.isActive !== undefined ? data.isActive : true,
        lastModifiedBy: updatedBy
      });
    } else {
      // Actualizar configuración existente
      if (data.appName !== undefined) config.appName = data.appName;
      if (data.faviconUrl !== undefined) config.faviconUrl = data.faviconUrl;
      if (data.logoUrl !== undefined) config.logoUrl = data.logoUrl;
      if (data.primaryColor !== undefined) config.primaryColor = data.primaryColor;
      if (data.secondaryColor !== undefined) config.secondaryColor = data.secondaryColor;
      if (data.isActive !== undefined) config.isActive = data.isActive;
      (config as any).lastModifiedBy = updatedBy;
    }

    await config.save();
    this.logger.log(`Configuración de branding actualizada por usuario ${updatedBy}`);

    return config.toObject();
  }
}

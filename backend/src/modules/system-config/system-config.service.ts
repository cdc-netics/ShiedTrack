import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SystemConfig, encryptText, decryptText } from './schemas/system-config.schema';
import * as nodemailer from 'nodemailer';

/**
 * Servicio de Configuración del Sistema
 * Gestiona credenciales SMTP encriptadas (solo OWNER puede acceder)
 */
@Injectable()
export class SystemConfigService {
  private readonly logger = new Logger(SystemConfigService.name);

  constructor(
    @InjectModel(SystemConfig.name) private systemConfigModel: Model<SystemConfig>
  ) {}

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
    const config = await this.systemConfigModel.findOne({ configKey: 'smtp_config' });

    if (!config) {
      throw new NotFoundException('Configuración SMTP no encontrada');
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
}

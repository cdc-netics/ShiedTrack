import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import * as nodemailer from 'nodemailer';
import { resolveSmtpHostToIpv4 } from '../../common/utils/smtp-network';
import { EmailService } from '../email/email.service';
import { SystemBranding } from './schemas/system-branding.schema';
import { SystemConfig, encryptText } from './schemas/system-config.schema';

@Injectable()
export class SystemConfigService {
  private readonly logger = new Logger(SystemConfigService.name);

  constructor(
    @InjectModel(SystemConfig.name)
    private readonly systemConfigModel: Model<SystemConfig>,
    @InjectModel(SystemBranding.name)
    private readonly systemBrandingModel: Model<SystemBranding>,
    @InjectConnection()
    private readonly connection: Connection,
    private readonly emailService: EmailService,
  ) {}

  async resetDatabase(
    confirmation: string,
  ): Promise<{ success: boolean; message: string }> {
    if (confirmation !== 'DELETE') {
      throw new BadRequestException('Confirmacion invalida. Se requiere "DELETE".');
    }

    const collectionsToClear = ['findings', 'projects', 'clients', 'areas', 'auditlogs'];
    this.logger.warn('INICIANDO RESET DE BASE DE DATOS - Accion Admin Owner');

    for (const name of collectionsToClear) {
      try {
        const collection = this.connection.collection(name);
        const result = await collection.deleteMany({});
        this.logger.log(
          `Coleccion ${name} limpiada: ${result.deletedCount} documentos eliminados.`,
        );
      } catch (error) {
        this.logger.error(`Error limpiando coleccion ${name}:`, error);
      }
    }

    return {
      success: true,
      message: 'Base de datos de negocio reseteada exitosamente',
    };
  }

  async getSmtpConfig(): Promise<any> {
    const config = await this.getOrCreateSmtpConfig();
    return (config as any).getDecryptedCredentials();
  }

  async updateSmtpConfig(
    data: {
      smtp_host: string;
      smtp_port: number;
      smtp_secure: boolean;
      smtp_user: string;
      smtp_pass: string;
      smtp_from_email: string;
      smtp_from_name: string;
      smtp_reply_to?: string;
      smtp_timeout_ms?: number;
      smtp_tls_reject_unauthorized?: boolean;
    },
    userId: string,
  ): Promise<SystemConfig> {
    const config = await this.getOrCreateSmtpConfig();
    const nextUser = (data.smtp_user || '').trim();
    const nextPass = (data.smtp_pass || '').trim();

    config.smtp_host = data.smtp_host;
    config.smtp_port = data.smtp_port;
    config.smtp_secure = data.smtp_secure;
    config.smtp_from_email = data.smtp_from_email;
    config.smtp_from_name = data.smtp_from_name;
    config.smtp_reply_to = data.smtp_reply_to?.trim() || undefined;
    config.smtp_timeout_ms = Math.max(0, Number(data.smtp_timeout_ms ?? 10000));
    config.smtp_tls_reject_unauthorized =
      data.smtp_tls_reject_unauthorized !== false;

    if (nextUser && !this.isMaskedSecret(nextUser)) {
      config.smtp_user_encrypted = encryptText(nextUser);
    }

    if (nextPass && !this.isMaskedSecret(nextPass)) {
      config.smtp_pass_encrypted = encryptText(nextPass);
    }

    config.lastModifiedBy = userId as any;
    await config.save();
    await this.emailService.refreshTransporter();

    this.logger.log(`Configuracion SMTP actualizada por usuario ${userId}`);
    return config;
  }

  async getSmtpConfigMasked(): Promise<any> {
    const config = await this.getOrCreateSmtpConfig();

    return {
      smtp_host: config.smtp_host,
      smtp_port: config.smtp_port,
      smtp_secure: config.smtp_secure,
      smtp_user: '***********',
      smtp_pass: '***********',
      smtp_from_email: config.smtp_from_email,
      smtp_from_name: config.smtp_from_name,
      smtp_reply_to: config.smtp_reply_to,
      smtp_timeout_ms: config.smtp_timeout_ms,
      smtp_tls_reject_unauthorized: config.smtp_tls_reject_unauthorized,
      lastModifiedBy: config.lastModifiedBy,
      updatedAt: (config as any).updatedAt,
    };
  }

  async testSmtpConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const config = await this.getSmtpConfig();
      const resolvedHost = await resolveSmtpHostToIpv4(config.host);

      if (resolvedHost.resolvedToIpv4) {
        this.logger.log(
          `SMTP host ${config.host} resuelto a IPv4 ${resolvedHost.connectionHost} para prueba de conexion`,
        );
      }

      const transporter = nodemailer.createTransport({
        host: resolvedHost.connectionHost,
        port: config.port,
        secure: config.secure,
        auth: config.auth,
        tls: {
          ...(resolvedHost.tlsServername
            ? { servername: resolvedHost.tlsServername }
            : {}),
          rejectUnauthorized: config.tlsRejectUnauthorized !== false,
        },
        ...(config.timeoutMs > 0
          ? {
              connectionTimeout: config.timeoutMs,
              greetingTimeout: config.timeoutMs,
              socketTimeout: config.timeoutMs,
            }
          : {}),
      });

      await transporter.verify();
      this.logger.log('Conexion SMTP verificada exitosamente');
      return { success: true, message: 'Conexion SMTP exitosa' };
    } catch (error: any) {
      this.logger.error(`Error verificando SMTP: ${error?.message || error}`);
      return { success: false, message: error?.message || 'Error SMTP desconocido' };
    }
  }

  async getBrandingConfig(): Promise<any> {
    const config = await this.systemBrandingModel
      .findOne()
      .sort({ createdAt: -1 })
      .lean();

    if (!config) {
      this.logger.log('No se encontro configuracion de branding, creando una por defecto');
      const newConfig = new this.systemBrandingModel({
        appName: 'ShieldTrack',
        primaryColor: '#1976d2',
        secondaryColor: '#424242',
        isActive: true,
      });
      await newConfig.save();
      return this.systemBrandingModel.findOne().sort({ createdAt: -1 }).lean();
    }

    return config;
  }

  async updateBrandingConfig(data: Partial<any>, updatedBy: string): Promise<any> {
    let config = await this.systemBrandingModel.findOne().sort({ createdAt: -1 });

    if (!config) {
      config = new this.systemBrandingModel({
        appName: data.appName || 'ShieldTrack',
        faviconUrl: data.faviconUrl,
        logoUrl: data.logoUrl,
        primaryColor: data.primaryColor || '#1976d2',
        secondaryColor: data.secondaryColor || '#424242',
        isActive: data.isActive !== undefined ? data.isActive : true,
        lastModifiedBy: updatedBy,
      });
    } else {
      if (data.appName !== undefined) config.appName = data.appName;
      if (data.faviconUrl !== undefined) config.faviconUrl = data.faviconUrl;
      if (data.logoUrl !== undefined) config.logoUrl = data.logoUrl;
      if (data.primaryColor !== undefined) config.primaryColor = data.primaryColor;
      if (data.secondaryColor !== undefined) config.secondaryColor = data.secondaryColor;
      if (data.isActive !== undefined) config.isActive = data.isActive;
      (config as any).lastModifiedBy = updatedBy;
    }

    await config.save();
    this.logger.log(`Configuracion de branding actualizada por usuario ${updatedBy}`);

    return config.toObject();
  }

  private async getOrCreateSmtpConfig(): Promise<SystemConfig> {
    let config = await this.systemConfigModel.findOne({ configKey: 'smtp_config' });

    if (!config) {
      this.logger.warn('Configuracion SMTP no encontrada, creando config por defecto');
      config = new this.systemConfigModel({
        configKey: 'smtp_config',
        smtp_host: 'localhost',
        smtp_port: 587,
        smtp_secure: false,
        smtp_user_encrypted: encryptText('user@example.com'),
        smtp_pass_encrypted: encryptText('password'),
        smtp_from_email: 'noreply@shieldtrack.com',
        smtp_from_name: 'ShieldTrack Notificaciones',
        smtp_reply_to: '',
        smtp_timeout_ms: 10000,
        smtp_tls_reject_unauthorized: true,
      });
      await config.save();
    }

    return config;
  }

  private isMaskedSecret(value?: string): boolean {
    const normalized = (value || '').trim();
    return normalized.length >= 3 && /^\*+$/.test(normalized);
  }
}

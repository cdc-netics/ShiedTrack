import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as nodemailer from 'nodemailer';
import { SystemConfig } from '../system-config/schemas/system-config.schema';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * Servicio de Notificaciones por Email
 * Maneja envío de notificaciones usando configuración SMTP del sistema
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    @InjectModel(SystemConfig.name) private systemConfigModel: Model<SystemConfig>,
  ) {
    this.initializeTransporter();
  }

  /**
   * Inicializar/actualizar el transporter con la configuración actual
   */
  private async initializeTransporter(): Promise<void> {
    try {
      const config = await this.systemConfigModel.findOne().lean();
      
      if (!config || !config.smtp_host) {
        this.logger.warn('Configuración SMTP no encontrada - Email deshabilitado');
        return;
      }

      // Usar el método de desencriptación del schema
      const { decryptText } = await import('../system-config/schemas/system-config.schema');
      
      this.transporter = nodemailer.createTransport({
        host: config.smtp_host,
        port: config.smtp_port || 587,
        secure: config.smtp_secure || false,
        auth: {
          user: decryptText(config.smtp_user_encrypted),
          pass: decryptText(config.smtp_pass_encrypted),
        },
      });

      this.logger.log('Transporter SMTP inicializado correctamente');
    } catch (error) {
      this.logger.error(`Error inicializando transporter SMTP: ${error.message}`);
    }
  }

  /**
   * Reinicializar transporter (llamar después de actualizar config SMTP)
   */
  async refreshTransporter(): Promise<void> {
    await this.initializeTransporter();
  }

  /**
   * Enviar email genérico
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn('Transporter no configurado - Email no enviado');
      return false;
    }

    try {
      const config = await this.systemConfigModel.findOne().lean();
      const fromEmail = config?.smtp_from_email || 'noreply@shieldtrack.com';
      const fromName = config?.smtp_from_name || 'ShieldTrack';

      await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''),
      });

      this.logger.log(`Email enviado exitosamente a: ${options.to}`);
      return true;
    } catch (error) {
      this.logger.error(`Error enviando email: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Notificación: Usuario asignado a proyecto
   */
  async notifyUserAssignedToProject(userEmail: string, userName: string, projectName: string, projectCode: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Asignación a Proyecto</h2>
        <p>Hola <strong>${userName}</strong>,</p>
        <p>Has sido asignado al proyecto:</p>
        <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #1976d2; margin: 20px 0;">
          <strong>${projectName}</strong><br>
          <small>Código: ${projectCode}</small>
        </div>
        <p>Puedes acceder al proyecto ingresando a ShieldTrack.</p>
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          Este es un mensaje automático de ShieldTrack. Por favor no responder.
        </p>
      </div>
    `;

    await this.sendEmail({
      to: userEmail,
      subject: `Asignado a proyecto: ${projectName}`,
      html,
    });
  }

  /**
   * Notificación: Hallazgo asignado
   */
  async notifyFindingAssigned(userEmail: string, userName: string, findingTitle: string, findingCode: string, severity: string): Promise<void> {
    const severityColors: any = {
      CRITICAL: '#d32f2f',
      HIGH: '#f57c00',
      MEDIUM: '#fbc02d',
      LOW: '#388e3c',
      INFO: '#1976d2',
    };

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Nuevo Hallazgo Asignado</h2>
        <p>Hola <strong>${userName}</strong>,</p>
        <p>Se te ha asignado un nuevo hallazgo:</p>
        <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid ${severityColors[severity] || '#1976d2'}; margin: 20px 0;">
          <strong>${findingTitle}</strong><br>
          <small>Código: ${findingCode}</small><br>
          <span style="display: inline-block; margin-top: 10px; padding: 4px 8px; background: ${severityColors[severity] || '#1976d2'}; color: white; border-radius: 4px; font-size: 12px;">
            ${severity}
          </span>
        </div>
        <p>Por favor, revisa y gestiona este hallazgo en ShieldTrack.</p>
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          Este es un mensaje automático de ShieldTrack. Por favor no responder.
        </p>
      </div>
    `;

    await this.sendEmail({
      to: userEmail,
      subject: `Hallazgo asignado [${severity}]: ${findingTitle}`,
      html,
    });
  }

  /**
   * Notificación: Retest programado próximo
   */
  async notifyRetestUpcoming(userEmail: string, userName: string, findings: Array<{ title: string; code: string; retestDate: Date }>): Promise<void> {
    const findingsList = findings.map(f => `
      <li style="margin: 10px 0;">
        <strong>${f.title}</strong> (${f.code})<br>
        <small>Fecha retest: ${f.retestDate.toLocaleDateString('es-ES')}</small>
      </li>
    `).join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f57c00;">⚠️ Retests Próximos</h2>
        <p>Hola <strong>${userName}</strong>,</p>
        <p>Tienes <strong>${findings.length}</strong> hallazgo(s) con retest programado en los próximos días:</p>
        <ul style="background: #fff3e0; padding: 20px; border-left: 4px solid #f57c00; margin: 20px 0;">
          ${findingsList}
        </ul>
        <p>Por favor, planifica la ejecución de estos retests.</p>
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          Este es un mensaje automático de ShieldTrack. Por favor no responder.
        </p>
      </div>
    `;

    await this.sendEmail({
      to: userEmail,
      subject: `⚠️ Retests programados: ${findings.length} hallazgo(s)`,
      html,
    });
  }

  /**
   * Notificación: Usuario creado
   */
  async notifyUserCreated(userEmail: string, userName: string, role: string, tempPassword: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4caf50;">¡Bienvenido a ShieldTrack!</h2>
        <p>Hola <strong>${userName}</strong>,</p>
        <p>Tu cuenta ha sido creada exitosamente con el rol de <strong>${role}</strong>.</p>
        <div style="background: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50; margin: 20px 0;">
          <p><strong>Credenciales de acceso:</strong></p>
          <p>Email: <strong>${userEmail}</strong></p>
          <p>Contraseña temporal: <strong>${tempPassword}</strong></p>
        </div>
        <p style="color: #d32f2f;">⚠️ Por seguridad, cambia tu contraseña después del primer inicio de sesión.</p>
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          Este es un mensaje automático de ShieldTrack. Por favor no responder.
        </p>
      </div>
    `;

    await this.sendEmail({
      to: userEmail,
      subject: 'Bienvenido a ShieldTrack - Credenciales de Acceso',
      html,
    });
  }

  /**
   * Notificación: Asignación a área
   */
  async notifyUserAssignedToArea(userEmail: string, userName: string, areaName: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Asignación a Área</h2>
        <p>Hola <strong>${userName}</strong>,</p>
        <p>Has sido asignado al área:</p>
        <div style="background: #e3f2fd; padding: 15px; border-left: 4px solid #1976d2; margin: 20px 0;">
          <strong>${areaName}</strong>
        </div>
        <p>Ahora puedes gestionar proyectos y hallazgos de esta área.</p>
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          Este es un mensaje automático de ShieldTrack. Por favor no responder.
        </p>
      </div>
    `;

    await this.sendEmail({
      to: userEmail,
      subject: `Asignado a área: ${areaName}`,
      html,
    });
  }

  /**
   * Notificación: Hallazgo cerrado
   */
  async notifyFindingClosed(userEmail: string, userName: string, findingTitle: string, findingCode: string, closeReason: string): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4caf50;">Hallazgo Cerrado</h2>
        <p>Hola <strong>${userName}</strong>,</p>
        <p>El hallazgo ha sido cerrado:</p>
        <div style="background: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50; margin: 20px 0;">
          <strong>${findingTitle}</strong><br>
          <small>Código: ${findingCode}</small><br>
          <p style="margin-top: 10px;"><strong>Razón:</strong> ${closeReason}</p>
        </div>
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          Este es un mensaje automático de ShieldTrack. Por favor no responder.
        </p>
      </div>
    `;

    await this.sendEmail({
      to: userEmail,
      subject: `Hallazgo cerrado: ${findingTitle}`,
      html,
    });
  }
}

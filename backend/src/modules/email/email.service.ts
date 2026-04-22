import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as nodemailer from 'nodemailer';
import {
  NotificationEvent,
} from '../../common/enums';
import { resolveSmtpHostToIpv4 } from '../../common/utils/smtp-network';
import { NotificationService } from '../notification/notification.service';
import { SystemConfig, decryptText } from '../system-config/schemas/system-config.schema';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

interface EmailContent {
  subject: string;
  html: string;
  text?: string;
}

interface ContextRecipient {
  email: string;
  name?: string;
}

interface EventNotificationOptions {
  event: NotificationEvent;
  tenantId?: string;
  projectId?: string;
  contextRecipients?: Array<string | ContextRecipient>;
  variables: Record<string, any>;
  fallback: EmailContent;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    @InjectModel(SystemConfig.name)
    private readonly systemConfigModel: Model<SystemConfig>,
    private readonly notificationService: NotificationService,
  ) {
    void this.initializeTransporter();
  }

  private async initializeTransporter(): Promise<void> {
    try {
      const config = await this.systemConfigModel
        .findOne({ configKey: 'smtp_config' })
        .lean();

      if (!config?.smtp_host) {
        this.transporter = null;
        this.logger.warn('Configuracion SMTP no encontrada - email deshabilitado');
        return;
      }

      const resolvedHost = await resolveSmtpHostToIpv4(config.smtp_host);
      if (resolvedHost.resolvedToIpv4) {
        this.logger.log(
          `SMTP host ${config.smtp_host} resuelto a IPv4 ${resolvedHost.connectionHost} para envios`,
        );
      }

      const timeout = Number(config.smtp_timeout_ms || 0);
      const tls: Record<string, unknown> = {
        rejectUnauthorized: config.smtp_tls_reject_unauthorized !== false,
      };

      if (resolvedHost.tlsServername) {
        tls.servername = resolvedHost.tlsServername;
      }

      this.transporter = nodemailer.createTransport({
        host: resolvedHost.connectionHost,
        port: config.smtp_port || 587,
        secure: config.smtp_secure || false,
        auth: {
          user: decryptText(config.smtp_user_encrypted),
          pass: decryptText(config.smtp_pass_encrypted),
        },
        tls,
        ...(timeout > 0
          ? {
              connectionTimeout: timeout,
              greetingTimeout: timeout,
              socketTimeout: timeout,
            }
          : {}),
      });

      this.logger.log('Transporter SMTP inicializado correctamente');
    } catch (error: any) {
      this.transporter = null;
      this.logger.error(
        `Error inicializando transporter SMTP: ${error?.message || error}`,
      );
    }
  }

  async refreshTransporter(): Promise<void> {
    await this.initializeTransporter();
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      await this.initializeTransporter();
    }

    if (!this.transporter) {
      this.logger.warn('Transporter no configurado - email no enviado');
      return false;
    }

    try {
      const config = await this.systemConfigModel
        .findOne({ configKey: 'smtp_config' })
        .lean();
      const fromEmail = config?.smtp_from_email || 'noreply@shieldtrack.com';
      const fromName = config?.smtp_from_name || 'ShieldTrack';
      const replyTo = options.replyTo || config?.smtp_reply_to || undefined;

      await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.htmlToText(options.html),
        ...(replyTo ? { replyTo } : {}),
      });

      this.logger.log(`Email enviado exitosamente a: ${options.to}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Error enviando email: ${error?.message || error}`);
      return false;
    }
  }

  async notifyFindingCreated(
    userEmail: string,
    userName: string,
    findingTitle: string,
    findingCode: string,
    severity: string,
    projectName: string,
    description?: string,
  ): Promise<void> {
    const severityColor = this.getSeverityColor(severity);
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Nuevo Hallazgo Registrado</h2>
        <p>Hola <strong>${this.getDisplayName(userName)}</strong>,</p>
        <p>Se ha registrado correctamente un nuevo hallazgo en ShieldTrack:</p>

        <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid ${severityColor}; margin: 20px 0;">
          <strong>${findingTitle}</strong><br>
          <small>Codigo: ${findingCode}</small><br>
          <small>Proyecto: ${projectName}</small><br>
          <span style="display: inline-block; margin-top: 10px; padding: 4px 8px; background: ${severityColor}; color: white; border-radius: 4px; font-size: 12px;">
            ${severity}
          </span>
        </div>

        ${description ? `<p><strong>Descripcion:</strong><br>${description}</p>` : ''}

        <p>Puedes revisar el detalle directamente en ShieldTrack.</p>
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          Este es un mensaje automatico de ShieldTrack. Por favor no responder.
        </p>
      </div>
    `;

    await this.sendEmail({
      to: userEmail,
      subject: `Nuevo hallazgo registrado: ${findingTitle}`,
      html,
    });
  }

  async notifyUserAssignedToProject(
    userEmail: string,
    userName: string,
    projectName: string,
    projectCode: string,
  ): Promise<void> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Asignacion a Proyecto</h2>
        <p>Hola <strong>${this.getDisplayName(userName)}</strong>,</p>
        <p>Has sido asignado al proyecto:</p>
        <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #1976d2; margin: 20px 0;">
          <strong>${projectName}</strong><br>
          <small>Codigo: ${projectCode}</small>
        </div>
        <p>Puedes acceder al proyecto ingresando a ShieldTrack.</p>
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          Este es un mensaje automatico de ShieldTrack. Por favor no responder.
        </p>
      </div>
    `;

    await this.sendEmail({
      to: userEmail,
      subject: `Asignado a proyecto: ${projectName}`,
      html,
    });
  }

  async notifyFindingAssigned(
    userEmail: string,
    userName: string,
    findingTitle: string,
    findingCode: string,
    severity: string,
    projectName?: string,
    options?: { tenantId?: string; projectId?: string },
  ): Promise<void> {
    const severityColor = this.getSeverityColor(severity);
    const fallbackHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Nuevo Hallazgo Asignado</h2>
        <p>Hola <strong>${this.getDisplayName(userName)}</strong>,</p>
        <p>Se te ha asignado un nuevo hallazgo:</p>
        <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid ${severityColor}; margin: 20px 0;">
          <strong>${findingTitle}</strong><br>
          <small>Codigo: ${findingCode}</small><br>
          ${projectName ? `<small>Proyecto: ${projectName}</small><br>` : ''}
          <span style="display: inline-block; margin-top: 10px; padding: 4px 8px; background: ${severityColor}; color: white; border-radius: 4px; font-size: 12px;">
            ${severity}
          </span>
        </div>
        <p>Por favor, revisa y gestiona este hallazgo en ShieldTrack.</p>
      </div>
    `;

    await this.sendConfiguredNotification({
      event: NotificationEvent.FINDING_ASSIGNED,
      tenantId: options?.tenantId,
      projectId: options?.projectId,
      contextRecipients: [{ email: userEmail, name: userName }],
      variables: {
        userName: this.getDisplayName(userName),
        findingTitle,
        findingCode,
        projectName: projectName || 'Proyecto sin nombre',
        severity,
      },
      fallback: {
        subject: `Hallazgo asignado [${severity}]: ${findingTitle}`,
        html: fallbackHtml,
      },
    });
  }

  async notifyRetestUpcoming(
    recipients: Array<string | ContextRecipient>,
    projectName: string,
    clientName: string,
    retestDate: Date,
    daysUntilRetest: number,
    findings: Array<{
      title: string;
      code: string;
      severity?: string;
      status?: string;
    }>,
    options?: { tenantId?: string; projectId?: string },
  ): Promise<void> {
    const findingsListHtml = `
      <ul style="margin: 0; padding-left: 20px;">
        ${findings
          .map(
            (finding) => `
              <li style="margin-bottom: 10px;">
                <strong>[${finding.severity || 'N/A'}]</strong>
                ${finding.code}: ${finding.title}
                ${finding.status ? `<br><small>Estado: ${finding.status}</small>` : ''}
              </li>
            `,
          )
          .join('')}
      </ul>
    `;

    const fallbackHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
        <h2 style="color: #f57c00;">Recordatorio de Retest</h2>
        <p><strong>Proyecto:</strong> ${projectName}</p>
        <p><strong>Cliente:</strong> ${clientName}</p>
        <p><strong>Fecha de retest:</strong> ${retestDate.toLocaleDateString('es-CL')}</p>
        <p><strong>Dias restantes:</strong> ${daysUntilRetest}</p>
        <div style="background: #fff3e0; padding: 16px; border-left: 4px solid #f57c00; margin-top: 16px;">
          ${findingsListHtml}
        </div>
      </div>
    `;

    await this.sendConfiguredNotification({
      event: NotificationEvent.RETEST_UPCOMING,
      tenantId: options?.tenantId,
      projectId: options?.projectId,
      contextRecipients: recipients,
      variables: {
        projectName,
        clientName,
        retestDate: retestDate.toLocaleDateString('es-CL'),
        daysUntilRetest,
        findingsListHtml,
      },
      fallback: {
        subject: `Recordatorio de Retest - ${projectName} (${daysUntilRetest} dias)`,
        html: fallbackHtml,
      },
    });
  }

  async notifyUserCreated(
    userEmail: string,
    userName: string,
    role: string,
    tempPassword: string,
    options?: { tenantId?: string },
  ): Promise<void> {
    const fallbackHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4caf50;">Bienvenido a ShieldTrack</h2>
        <p>Hola <strong>${this.getDisplayName(userName)}</strong>,</p>
        <p>Tu cuenta ha sido creada exitosamente con el rol de <strong>${role}</strong>.</p>
        <div style="background: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50; margin: 20px 0;">
          <p><strong>Credenciales de acceso:</strong></p>
          <p>Email: <strong>${userEmail}</strong></p>
          <p>Contrasena temporal: <strong>${tempPassword}</strong></p>
        </div>
        <p>Por seguridad, cambia tu contrasena despues del primer inicio de sesion.</p>
      </div>
    `;

    await this.sendConfiguredNotification({
      event: NotificationEvent.USER_CREATED,
      tenantId: options?.tenantId,
      contextRecipients: [{ email: userEmail, name: userName }],
      variables: {
        userName: this.getDisplayName(userName),
        role,
        userEmail,
        tempPassword,
      },
      fallback: {
        subject: 'Bienvenido a ShieldTrack - Credenciales de Acceso',
        html: fallbackHtml,
      },
    });
  }

  async notifyUserAssignedToArea(
    userEmail: string,
    userName: string,
    areaName: string,
    options?: { tenantId?: string },
  ): Promise<void> {
    const fallbackHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Asignacion a Area</h2>
        <p>Hola <strong>${this.getDisplayName(userName)}</strong>,</p>
        <p>Has sido asignado al area:</p>
        <div style="background: #e3f2fd; padding: 15px; border-left: 4px solid #1976d2; margin: 20px 0;">
          <strong>${areaName}</strong>
        </div>
        <p>Ahora puedes gestionar proyectos y hallazgos de esta area.</p>
      </div>
    `;

    await this.sendConfiguredNotification({
      event: NotificationEvent.USER_ASSIGNED_AREA,
      tenantId: options?.tenantId,
      contextRecipients: [{ email: userEmail, name: userName }],
      variables: {
        userName: this.getDisplayName(userName),
        areaName,
      },
      fallback: {
        subject: `Asignado a area: ${areaName}`,
        html: fallbackHtml,
      },
    });
  }

  async notifyFindingClosed(
    recipients: Array<string | ContextRecipient>,
    findingTitle: string,
    findingCode: string,
    closeReason: string,
    projectName?: string,
    options?: { tenantId?: string; projectId?: string },
  ): Promise<void> {
    const fallbackHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4caf50;">Hallazgo Cerrado</h2>
        <p>Hola <strong>${this.getContextGreeting(recipients)}</strong>,</p>
        <p>El hallazgo ha sido cerrado:</p>
        <div style="background: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50; margin: 20px 0;">
          <strong>${findingTitle}</strong><br>
          <small>Codigo: ${findingCode}</small><br>
          ${projectName ? `<small>Proyecto: ${projectName}</small><br>` : ''}
          <p style="margin-top: 10px;"><strong>Razon:</strong> ${closeReason}</p>
        </div>
        <p>Puedes revisar el estado final en ShieldTrack.</p>
      </div>
    `;

    await this.sendConfiguredNotification({
      event: NotificationEvent.FINDING_CLOSED,
      tenantId: options?.tenantId,
      projectId: options?.projectId,
      contextRecipients: recipients,
      variables: {
        userName: this.getContextGreeting(recipients),
        findingTitle,
        findingCode,
        projectName: projectName || 'Proyecto sin nombre',
        closeReason,
      },
      fallback: {
        subject: `Hallazgo cerrado: ${findingTitle}`,
        html: fallbackHtml,
      },
    });
  }

  private async sendConfiguredNotification(
    options: EventNotificationOptions,
  ): Promise<void> {
    const rules = await this.notificationService.getApplicableRules(
      options.event,
      options.tenantId,
      options.projectId,
    );

    if (rules.length === 0) {
      this.logger.log(
        `No hay reglas activas para ${options.event} en tenant=${options.tenantId || '-'} project=${options.projectId || '-'}`,
      );
      return;
    }

    const contextRecipients = this.normalizeContextRecipients(
      options.contextRecipients || [],
    );
    const contextEmails = contextRecipients.map((recipient) => recipient.email);
    const variables = {
      ...options.variables,
      userName:
        options.variables?.userName || this.getContextGreeting(contextRecipients),
    };

    for (const rule of rules) {
      if (this.notificationService.isRuleThrottled(rule)) {
        this.logger.log(`Regla ${rule.name} omitida por throttle`);
        continue;
      }

      const recipients = await this.notificationService.resolveRecipientEmails(
        rule,
        contextEmails,
        options.tenantId,
      );

      if (recipients.length === 0) {
        this.logger.log(`Regla ${rule.name} sin destinatarios resueltos`);
        continue;
      }

      const content = await this.notificationService.renderRuleTemplate(
        rule,
        variables,
        options.fallback,
      );

      const sent = await this.sendEmail({
        to: recipients,
        subject: content.subject,
        html: content.html,
        text: content.text,
      });

      if (sent && (rule as any)?._id) {
        await this.notificationService.markRuleTriggered(
          (rule as any)._id.toString(),
        );
      }
    }
  }

  private normalizeContextRecipients(
    recipients: Array<string | ContextRecipient>,
  ): ContextRecipient[] {
    const deduped = new Map<string, ContextRecipient>();

    for (const recipient of recipients) {
      const normalized =
        typeof recipient === 'string'
          ? {
              email: this.normalizeEmail(recipient),
              name: undefined,
            }
          : {
              email: this.normalizeEmail(recipient.email),
              name: recipient.name?.trim() || undefined,
            };

      if (!normalized.email) {
        continue;
      }

      deduped.set(normalized.email, normalized as ContextRecipient);
    }

    return Array.from(deduped.values());
  }

  private getContextGreeting(
    recipients: Array<string | ContextRecipient>,
  ): string {
    const normalized = this.normalizeContextRecipients(recipients);
    if (normalized.length === 1) {
      return this.getDisplayName(normalized[0].name);
    }

    return 'equipo';
  }

  private getDisplayName(userName?: string): string {
    return userName?.trim() || 'usuario';
  }

  private getSeverityColor(severity?: string): string {
    const severityColors: Record<string, string> = {
      CRITICAL: '#d32f2f',
      HIGH: '#f57c00',
      MEDIUM: '#fbc02d',
      LOW: '#388e3c',
      INFO: '#1976d2',
    };

    return severityColors[severity || ''] || '#1976d2';
  }

  private normalizeEmail(email?: string): string | null {
    const normalized = email?.trim().toLowerCase();
    if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return null;
    }

    return normalized;
  }

  private htmlToText(html: string): string {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
}

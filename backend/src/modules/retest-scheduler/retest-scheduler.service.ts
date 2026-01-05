import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project } from '../project/schemas/project.schema';
import { Finding } from '../finding/schemas/finding.schema';
import * as nodemailer from 'nodemailer';

/**
 * Servicio de programación de Retests
 * Ejecuta diariamente un cron job que verifica proyectos con retest habilitado
 * y envía notificaciones según los offsetDays configurados
 */
@Injectable()
export class RetestSchedulerService {
  private readonly logger = new Logger(RetestSchedulerService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
    @InjectModel(Finding.name) private findingModel: Model<Finding>,
  ) {
    // Configurar transportador de correo
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /**
   * Cron job que se ejecuta diariamente a las 09:00 AM
   * Verifica proyectos con retest habilitado y envía notificaciones
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleRetestNotifications() {
    this.logger.log('Ejecutando cron job de notificaciones de retest...');

    try {
      // Obtener proyectos con retest habilitado
      const projects = await this.projectModel.find({
        'retestPolicy.enabled': true,
        projectStatus: 'ACTIVE',
      }).populate('clientId', 'name');

      this.logger.log(`Encontrados ${projects.length} proyectos con retest habilitado`);

      for (const project of projects) {
        await this.processProjectRetest(project);
      }

      this.logger.log('Cron job de retest completado exitosamente');
    } catch (error) {
      this.logger.error(`Error en cron job de retest: ${error.message}`, error.stack);
    }
  }

  /**
   * Procesa un proyecto individual para verificar si debe enviar notificaciones
   */
  private async processProjectRetest(project: Project): Promise<void> {
    const { retestPolicy } = project;

    if (!retestPolicy.nextRetestAt || !retestPolicy.notify) {
      return; // No hay configuración completa
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalizar a medianoche

    const retestDate = new Date(retestPolicy.nextRetestAt);
    retestDate.setHours(0, 0, 0, 0);

    // Calcular días restantes hasta el retest
    const daysUntilRetest = Math.ceil((retestDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Verificar si alguno de los offsetDays coincide
    const uniqueOffsets = [...new Set(retestPolicy.notify.offsetDays)];
    const shouldNotify = uniqueOffsets.includes(daysUntilRetest);

    if (shouldNotify) {
      await this.sendRetestNotification(project, daysUntilRetest);
    }
  }

  /**
   * Envía notificación de retest por correo electrónico
   */
  private async sendRetestNotification(project: Project, daysUntilRetest: number): Promise<void> {
    try {
      // Obtener hallazgos que deben incluirse en el retest
      const findings = await this.findingModel.find({
        projectId: (project as any)._id,
        retestIncluded: true,
        status: { $ne: 'CLOSED' },
      }).select('code title severity status');

      if (findings.length === 0) {
        this.logger.log(`Proyecto ${project.name} no tiene hallazgos para retest, omitiendo notificación`);
        return;
      }

      // Construir contenido del correo
      const findingsList = findings
        .map((f: any) => `- [${f.severity}] ${f.code}: ${f.title} (Estado: ${f.status})`)
        .join('\n');

      const subject = `🔒 Recordatorio de Retest - ${project.name} (${daysUntilRetest} días)`;
      const htmlContent = `
        <h2>Recordatorio de Retest Programado</h2>
        <p><strong>Proyecto:</strong> ${project.name}</p>
        <p><strong>Cliente:</strong> ${(project as any).clientId?.name || 'N/A'}</p>
        <p><strong>Fecha de Retest:</strong> ${new Date(project.retestPolicy.nextRetestAt ?? new Date()).toLocaleDateString('es-CL')}</p>
        <p><strong>Días restantes:</strong> ${daysUntilRetest}</p>
        
        <h3>Hallazgos a validar (${findings.length}):</h3>
        <pre>${findingsList}</pre>
        
        <p>Por favor, coordine el retest de los hallazgos listados con el cliente.</p>
        <hr>
        <small>Este es un mensaje automático de ShieldTrack</small>
      `;

      // Enviar correo a todos los destinatarios
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@shieldtrack.com',
        to: project.retestPolicy.notify?.recipients.join(', ') || '',
        subject,
        html: htmlContent,
      });

      this.logger.log(
        `Notificación de retest enviada para proyecto ${project.name} ` +
        `(${findings.length} hallazgos, ${daysUntilRetest} días restantes)`,
      );
    } catch (error) {
      this.logger.error(
        `Error enviando notificación de retest para proyecto ${project._id}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Método manual para testing (puede ser llamado desde un endpoint)
   */
  async triggerManualRetestCheck(): Promise<{ message: string; processed: number }> {
    this.logger.log('Ejecución manual de retest check solicitada');
    await this.handleRetestNotifications();
    
    return {
      message: 'Retest check ejecutado manualmente',
      processed: await this.projectModel.countDocuments({ 'retestPolicy.enabled': true }),
    };
  }
}

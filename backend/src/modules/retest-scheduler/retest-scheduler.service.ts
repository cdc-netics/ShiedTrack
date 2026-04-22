import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Finding } from '../finding/schemas/finding.schema';
import { Project } from '../project/schemas/project.schema';
import { EmailService } from '../email/email.service';

@Injectable()
export class RetestSchedulerService {
  private readonly logger = new Logger(RetestSchedulerService.name);

  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<Project>,
    @InjectModel(Finding.name)
    private readonly findingModel: Model<Finding>,
    private readonly emailService: EmailService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async handleRetestNotifications() {
    this.logger.log('Ejecutando cron job de notificaciones de retest...');

    try {
      const projects = await this.projectModel
        .find({
          'retestPolicy.enabled': true,
          projectStatus: 'ACTIVE',
        })
        .populate('clientId', 'name');

      this.logger.log(
        `Encontrados ${projects.length} proyectos con retest habilitado`,
      );

      for (const project of projects) {
        await this.processProjectRetest(project);
      }

      this.logger.log('Cron job de retest completado exitosamente');
    } catch (error: any) {
      this.logger.error(
        `Error en cron job de retest: ${error?.message || error}`,
        error?.stack,
      );
    }
  }

  private async processProjectRetest(project: Project): Promise<void> {
    const { retestPolicy } = project;

    if (!retestPolicy?.nextRetestAt || !retestPolicy.notify) {
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const retestDate = new Date(retestPolicy.nextRetestAt);
    retestDate.setHours(0, 0, 0, 0);

    const daysUntilRetest = Math.ceil(
      (retestDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    const uniqueOffsets = [...new Set(retestPolicy.notify.offsetDays || [])];

    if (uniqueOffsets.includes(daysUntilRetest)) {
      await this.sendRetestNotification(project, daysUntilRetest);
    }
  }

  private async sendRetestNotification(
    project: Project,
    daysUntilRetest: number,
  ): Promise<void> {
    try {
      const findings = await this.findingModel
        .find({
          projectId: (project as any)._id,
          retestIncluded: true,
          status: { $ne: 'CLOSED' },
        })
        .select('code title severity status')
        .lean();

      if (findings.length === 0) {
        this.logger.log(
          `Proyecto ${project.name} no tiene hallazgos para retest, omitiendo notificacion`,
        );
        return;
      }

      const recipients = (project.retestPolicy.notify?.recipients || [])
        .map((email) => email?.trim())
        .filter(Boolean);

      if (recipients.length === 0) {
        this.logger.log(
          `Proyecto ${project.name} no tiene destinatarios para retest`,
        );
        return;
      }

      await this.emailService.notifyRetestUpcoming(
        recipients,
        project.name,
        (project as any).clientId?.name || 'N/A',
        new Date(project.retestPolicy.nextRetestAt ?? new Date()),
        daysUntilRetest,
        findings,
        {
          tenantId: project.tenantId?.toString?.(),
          projectId: (project as any)._id?.toString?.(),
        },
      );

      this.logger.log(
        `Notificacion de retest procesada para proyecto ${project.name} (${findings.length} hallazgos, ${daysUntilRetest} dias restantes)`,
      );
    } catch (error: any) {
      this.logger.error(
        `Error enviando notificacion de retest para proyecto ${project._id}: ${error?.message || error}`,
        error?.stack,
      );
    }
  }

  async triggerManualRetestCheck(): Promise<{ message: string; processed: number }> {
    this.logger.log('Ejecucion manual de retest check solicitada');
    await this.handleRetestNotifications();

    return {
      message: 'Retest check ejecutado manualmente',
      processed: await this.projectModel.countDocuments({
        'retestPolicy.enabled': true,
      }),
    };
  }
}

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  NotificationChannel,
  NotificationEvent,
  NotificationRecipientType,
  NotificationScope,
  UserRole,
} from '../../common/enums';
import { User } from '../auth/schemas/user.schema';
import { Project } from '../project/schemas/project.schema';
import { Tenant } from '../tenant/schemas/tenant.schema';
import {
  CreateNotificationRuleDto,
  CreateNotificationTemplateDto,
  ListNotificationRulesDto,
  ListNotificationTemplatesDto,
  NotificationRecipientDto,
  UpdateNotificationRuleDto,
  UpdateNotificationTemplateDto,
} from './dto/notification.dto';
import { NotificationRule } from './schemas/notification-rule.schema';
import { NotificationTemplate } from './schemas/notification-template.schema';

interface EmailContent {
  subject: string;
  html: string;
  text?: string;
}

interface DefaultTemplateSeed {
  code: string;
  name: string;
  event: NotificationEvent;
  subject: string;
  bodyHtml: string;
  variables: string[];
}

interface DefaultRuleSeed {
  systemKey: string;
  name: string;
  event: NotificationEvent;
  templateCode: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private ensureDefaultsPromise: Promise<void> | null = null;

  private readonly defaultTemplateSeeds: DefaultTemplateSeed[] = [
    {
      code: 'SYSTEM_USER_CREATED',
      name: 'Usuario creado',
      event: NotificationEvent.USER_CREATED,
      subject: 'Bienvenido a ShieldTrack - Credenciales de Acceso',
      bodyHtml:
        '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
        '<h2 style="color: #4caf50;">Bienvenido a ShieldTrack</h2>' +
        '<p>Hola <strong>{{userName}}</strong>,</p>' +
        '<p>Tu cuenta fue creada con el rol <strong>{{role}}</strong>.</p>' +
        '<div style="background: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50; margin: 20px 0;">' +
        '<p><strong>Email:</strong> {{userEmail}}</p>' +
        '<p><strong>Contrasena temporal:</strong> {{tempPassword}}</p>' +
        '</div>' +
        '<p>Por seguridad, cambia tu contrasena en el primer inicio de sesion.</p>' +
        '</div>',
      variables: ['userName', 'role', 'userEmail', 'tempPassword'],
    },
    {
      code: 'SYSTEM_USER_ASSIGNED_AREA',
      name: 'Usuario asignado a area',
      event: NotificationEvent.USER_ASSIGNED_AREA,
      subject: 'Asignado a area: {{areaName}}',
      bodyHtml:
        '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
        '<h2 style="color: #1976d2;">Asignacion a Area</h2>' +
        '<p>Hola <strong>{{userName}}</strong>,</p>' +
        '<p>Has sido asignado al area <strong>{{areaName}}</strong>.</p>' +
        '</div>',
      variables: ['userName', 'areaName'],
    },
    {
      code: 'SYSTEM_FINDING_ASSIGNED',
      name: 'Hallazgo asignado',
      event: NotificationEvent.FINDING_ASSIGNED,
      subject: 'Hallazgo asignado [{{severity}}]: {{findingTitle}}',
      bodyHtml:
        '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
        '<h2 style="color: #1976d2;">Nuevo Hallazgo Asignado</h2>' +
        '<p>Hola <strong>{{userName}}</strong>,</p>' +
        '<p>Se te asigno el hallazgo <strong>{{findingTitle}}</strong>.</p>' +
        '<div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #1976d2; margin: 20px 0;">' +
        '<p><strong>Codigo:</strong> {{findingCode}}</p>' +
        '<p><strong>Proyecto:</strong> {{projectName}}</p>' +
        '<p><strong>Severidad:</strong> {{severity}}</p>' +
        '</div>' +
        '</div>',
      variables: ['userName', 'findingTitle', 'findingCode', 'projectName', 'severity'],
    },
    {
      code: 'SYSTEM_FINDING_CLOSED',
      name: 'Hallazgo cerrado',
      event: NotificationEvent.FINDING_CLOSED,
      subject: 'Hallazgo cerrado: {{findingTitle}}',
      bodyHtml:
        '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
        '<h2 style="color: #4caf50;">Hallazgo Cerrado</h2>' +
        '<p>Hola <strong>{{userName}}</strong>,</p>' +
        '<p>El hallazgo <strong>{{findingTitle}}</strong> fue cerrado.</p>' +
        '<div style="background: #e8f5e9; padding: 15px; border-left: 4px solid #4caf50; margin: 20px 0;">' +
        '<p><strong>Codigo:</strong> {{findingCode}}</p>' +
        '<p><strong>Proyecto:</strong> {{projectName}}</p>' +
        '<p><strong>Razon:</strong> {{closeReason}}</p>' +
        '</div>' +
        '</div>',
      variables: ['userName', 'findingTitle', 'findingCode', 'projectName', 'closeReason'],
    },
    {
      code: 'SYSTEM_RETEST_UPCOMING',
      name: 'Retest proximo',
      event: NotificationEvent.RETEST_UPCOMING,
      subject: 'Recordatorio de Retest - {{projectName}} ({{daysUntilRetest}} dias)',
      bodyHtml:
        '<div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">' +
        '<h2 style="color: #f57c00;">Recordatorio de Retest</h2>' +
        '<p><strong>Proyecto:</strong> {{projectName}}</p>' +
        '<p><strong>Cliente:</strong> {{clientName}}</p>' +
        '<p><strong>Fecha de retest:</strong> {{retestDate}}</p>' +
        '<p><strong>Dias restantes:</strong> {{daysUntilRetest}}</p>' +
        '<div style="background: #fff3e0; padding: 16px; border-left: 4px solid #f57c00; margin-top: 16px;">{{findingsListHtml}}</div>' +
        '</div>',
      variables: [
        'projectName',
        'clientName',
        'retestDate',
        'daysUntilRetest',
        'findingsListHtml',
      ],
    },
  ];

  private readonly defaultRuleSeeds: DefaultRuleSeed[] = [
    {
      systemKey: 'SYSTEM_RULE_USER_CREATED',
      name: 'Regla base - usuario creado',
      event: NotificationEvent.USER_CREATED,
      templateCode: 'SYSTEM_USER_CREATED',
    },
    {
      systemKey: 'SYSTEM_RULE_USER_ASSIGNED_AREA',
      name: 'Regla base - usuario asignado a area',
      event: NotificationEvent.USER_ASSIGNED_AREA,
      templateCode: 'SYSTEM_USER_ASSIGNED_AREA',
    },
    {
      systemKey: 'SYSTEM_RULE_FINDING_ASSIGNED',
      name: 'Regla base - hallazgo asignado',
      event: NotificationEvent.FINDING_ASSIGNED,
      templateCode: 'SYSTEM_FINDING_ASSIGNED',
    },
    {
      systemKey: 'SYSTEM_RULE_FINDING_CLOSED',
      name: 'Regla base - hallazgo cerrado',
      event: NotificationEvent.FINDING_CLOSED,
      templateCode: 'SYSTEM_FINDING_CLOSED',
    },
    {
      systemKey: 'SYSTEM_RULE_RETEST_UPCOMING',
      name: 'Regla base - retest proximo',
      event: NotificationEvent.RETEST_UPCOMING,
      templateCode: 'SYSTEM_RETEST_UPCOMING',
    },
  ];

  constructor(
    @InjectModel(NotificationRule.name)
    private readonly ruleModel: Model<NotificationRule>,
    @InjectModel(NotificationTemplate.name)
    private readonly templateModel: Model<NotificationTemplate>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<Project>,
    @InjectModel(Tenant.name)
    private readonly tenantModel: Model<Tenant>,
  ) {}

  async getOptions(currentUser: any) {
    await this.ensureDefaults();

    const currentTenantId = this.getCurrentTenantId(currentUser);
    const currentTenantObjectId = this.toObjectId(currentTenantId);
    const userFilter: any = {
      isActive: true,
      isDeleted: { $ne: true },
    };
    const projectFilter: any = {};

    if (!this.isPlatformUser(currentUser?.role) && currentTenantObjectId) {
      userFilter.$or = [
        { activeTenantId: currentTenantObjectId },
        { clientId: currentTenantObjectId },
        { tenantIds: currentTenantObjectId },
      ];
      projectFilter.tenantId = currentTenantObjectId;
    }

    const [users, projects, tenants, templates] = await Promise.all([
      this.userModel
        .find(userFilter)
        .select('firstName lastName email role activeTenantId clientId tenantIds')
        .sort({ firstName: 1, lastName: 1, email: 1 })
        .lean(),
      this.projectModel
        .find(projectFilter)
        .select('name tenantId projectStatus')
        .sort({ name: 1 })
        .lean(),
      this.getAccessibleTenants(currentUser),
      this.getActiveTemplatesForUser(currentUser),
    ]);

    return {
      events: Object.values(NotificationEvent),
      scopes: this.isPlatformUser(currentUser?.role)
        ? [
            NotificationScope.GLOBAL,
            NotificationScope.TENANT,
            NotificationScope.PROJECT,
          ]
        : [NotificationScope.TENANT, NotificationScope.PROJECT],
      channels: Object.values(NotificationChannel),
      recipientTypes: Object.values(NotificationRecipientType),
      roles: Object.values(UserRole),
      users,
      projects,
      tenants,
      templates,
    };
  }

  async listRules(currentUser: any, query: ListNotificationRulesDto) {
    await this.ensureDefaults();

    const filter = await this.buildRuleListFilter(currentUser, query);

    return this.ruleModel
      .find(filter)
      .populate('templateId', 'name code event scope tenantId isActive')
      .populate('tenantId', 'name code')
      .populate('projectId', 'name')
      .populate('createdBy', 'firstName lastName email')
      .populate('lastModifiedBy', 'firstName lastName email')
      .sort({ scope: 1, event: 1, createdAt: -1 })
      .lean();
  }

  async createRule(dto: CreateNotificationRuleDto, currentUser: any) {
    await this.ensureDefaults();

    const payload = await this.normalizeRulePayload(dto, currentUser);
    const rule = new this.ruleModel({
      ...payload,
      createdBy: currentUser.userId,
      lastModifiedBy: currentUser.userId,
    });

    await rule.save();
    this.logger.log(
      `Regla de notificacion creada: ${rule.name} (${rule.event}/${rule.scope}) por ${currentUser.email}`,
    );

    return this.ruleModel
      .findById(rule._id)
      .populate('templateId', 'name code')
      .populate('tenantId', 'name code')
      .populate('projectId', 'name')
      .lean();
  }

  async updateRule(
    id: string,
    dto: UpdateNotificationRuleDto,
    currentUser: any,
  ) {
    await this.ensureDefaults();

    const existingRule = await this.getRuleForManagement(id, currentUser);
    const payload = await this.normalizeRulePayload(
      {
        name: dto.name ?? existingRule.name,
        event: dto.event ?? existingRule.event,
        scope: dto.scope ?? existingRule.scope,
        tenantId: dto.tenantId ?? existingRule.tenantId?.toString(),
        projectId: dto.projectId ?? existingRule.projectId?.toString(),
        enabled: dto.enabled ?? existingRule.enabled,
        channel: dto.channel ?? existingRule.channel,
        recipients:
          dto.recipients ?? ((existingRule.recipients as any[]) || []).map((recipient) => ({
            type: recipient.type,
            value: recipient.value,
          })),
        templateId:
          dto.templateId ??
          ((existingRule.templateId as any)?._id?.toString?.() ||
            existingRule.templateId?.toString?.()),
        throttleMinutes: dto.throttleMinutes ?? existingRule.throttleMinutes,
        includeContextRecipients:
          dto.includeContextRecipients ?? existingRule.includeContextRecipients,
      },
      currentUser,
      existingRule.systemKey,
    );

    Object.assign(existingRule, payload, {
      lastModifiedBy: currentUser.userId,
    });

    await existingRule.save();
    this.logger.log(
      `Regla de notificacion actualizada: ${existingRule.name} por ${currentUser.email}`,
    );

    return this.ruleModel
      .findById(existingRule._id)
      .populate('templateId', 'name code')
      .populate('tenantId', 'name code')
      .populate('projectId', 'name')
      .lean();
  }

  async deleteRule(id: string, currentUser: any) {
    await this.ensureDefaults();
    const rule = await this.getRuleForManagement(id, currentUser);

    if (rule.systemKey) {
      rule.enabled = false;
      rule.lastModifiedBy = currentUser.userId;
      await rule.save();
      return;
    }

    await this.ruleModel.findByIdAndDelete(id);
  }

  async listTemplates(currentUser: any, query: ListNotificationTemplatesDto) {
    await this.ensureDefaults();

    const filter = this.buildTemplateListFilter(currentUser, query);

    return this.templateModel
      .find(filter)
      .populate('tenantId', 'name code')
      .populate('createdBy', 'firstName lastName email')
      .sort({ event: 1, scope: 1, createdAt: -1 })
      .lean();
  }

  async createTemplate(dto: CreateNotificationTemplateDto, currentUser: any) {
    await this.ensureDefaults();

    const payload = this.normalizeTemplatePayload(dto, currentUser);
    const template = new this.templateModel({
      ...payload,
      createdBy: currentUser.userId,
    });

    await template.save();
    this.logger.log(
      `Plantilla de notificacion creada: ${template.code} por ${currentUser.email}`,
    );

    return this.templateModel
      .findById(template._id)
      .populate('tenantId', 'name code')
      .lean();
  }

  async updateTemplate(
    id: string,
    dto: UpdateNotificationTemplateDto,
    currentUser: any,
  ) {
    await this.ensureDefaults();

    const template = await this.getTemplateForManagement(id, currentUser);
    const payload = this.normalizeTemplatePayload(
      {
        code: dto.code ?? template.code,
        name: dto.name ?? template.name,
        event: dto.event ?? template.event,
        scope: dto.scope ?? template.scope,
        tenantId: dto.tenantId ?? template.tenantId?.toString(),
        subject: dto.subject ?? template.subject,
        bodyHtml: dto.bodyHtml ?? template.bodyHtml,
        variables: dto.variables ?? template.variables,
        isActive: dto.isActive ?? template.isActive,
      },
      currentUser,
    );

    Object.assign(template, payload);
    await template.save();
    this.logger.log(
      `Plantilla de notificacion actualizada: ${template.code} por ${currentUser.email}`,
    );

    return this.templateModel
      .findById(template._id)
      .populate('tenantId', 'name code')
      .lean();
  }

  async deleteTemplate(id: string, currentUser: any) {
    await this.ensureDefaults();
    const template = await this.getTemplateForManagement(id, currentUser);
    template.isActive = false;
    await template.save();
  }

  async getApplicableRules(
    event: NotificationEvent,
    tenantId?: string,
    projectId?: string,
  ): Promise<NotificationRule[]> {
    await this.ensureDefaults();

    const filter: any = {
      event,
      channel: NotificationChannel.EMAIL,
      $or: [{ scope: NotificationScope.GLOBAL }],
    };

    const tenantObjectId = this.toObjectId(tenantId);
    const projectObjectId = this.toObjectId(projectId);

    if (tenantObjectId) {
      filter.$or.push({
        scope: NotificationScope.TENANT,
        tenantId: tenantObjectId,
      });
    }

    if (projectObjectId) {
      filter.$or.push({
        scope: NotificationScope.PROJECT,
        projectId: projectObjectId,
      });
    }

    const rules = await this.ruleModel
      .find(filter)
      .populate('templateId')
      .sort({ createdAt: 1 });

    const projectRules = projectId
      ? rules.filter(
          (rule) =>
            rule.scope === NotificationScope.PROJECT &&
            rule.projectId?.toString() === projectId,
        )
      : [];

    if (projectRules.length > 0) {
      return projectRules.filter((rule) => rule.enabled);
    }

    const tenantRules = tenantId
      ? rules.filter(
          (rule) =>
            rule.scope === NotificationScope.TENANT &&
            rule.tenantId?.toString() === tenantId,
        )
      : [];

    if (tenantRules.length > 0) {
      return tenantRules.filter((rule) => rule.enabled);
    }

    return rules
      .filter((rule) => rule.scope === NotificationScope.GLOBAL)
      .filter((rule) => rule.enabled);
  }

  async resolveRecipientEmails(
    rule: NotificationRule,
    contextRecipients: string[] = [],
    tenantId?: string,
  ): Promise<string[]> {
    const recipients = new Set<string>();

    if (rule.includeContextRecipients) {
      for (const email of contextRecipients) {
        const normalized = this.normalizeEmail(email);
        if (normalized) {
          recipients.add(normalized);
        }
      }
    }

    const staticRecipients = rule.recipients || [];
    const userIds = staticRecipients
      .filter((recipient) => recipient.type === NotificationRecipientType.USER)
      .map((recipient) => recipient.value)
      .filter((value) => Types.ObjectId.isValid(value));
    const roles = staticRecipients
      .filter((recipient) => recipient.type === NotificationRecipientType.ROLE)
      .map((recipient) => recipient.value as UserRole);

    for (const recipient of staticRecipients) {
      if (recipient.type !== NotificationRecipientType.EMAIL) {
        continue;
      }

      const normalized = this.normalizeEmail(recipient.value);
      if (normalized) {
        recipients.add(normalized);
      }
    }

    if (userIds.length > 0) {
      const users = await this.userModel
        .find({
          _id: { $in: userIds.map((userId) => new Types.ObjectId(userId)) },
          isActive: true,
          isDeleted: { $ne: true },
        })
        .select('email')
        .lean();

      for (const user of users) {
        const normalized = this.normalizeEmail(user.email);
        if (normalized) {
          recipients.add(normalized);
        }
      }
    }

    if (roles.length > 0) {
      const users = await this.userModel
        .find({
          role: { $in: roles },
          isActive: true,
          isDeleted: { $ne: true },
        })
        .select('email role activeTenantId clientId tenantIds')
        .lean();

      for (const user of users) {
        if (
          tenantId &&
          ![UserRole.OWNER, UserRole.PLATFORM_ADMIN].includes(user.role) &&
          !this.userBelongsToTenant(user, tenantId)
        ) {
          continue;
        }

        const normalized = this.normalizeEmail(user.email);
        if (normalized) {
          recipients.add(normalized);
        }
      }
    }

    return Array.from(recipients);
  }

  async renderRuleTemplate(
    rule: NotificationRule,
    variables: Record<string, any>,
    fallback: EmailContent,
  ): Promise<EmailContent> {
    const templateRef = rule.templateId as any;
    const template =
      templateRef && typeof templateRef === 'object' && templateRef.subject
        ? templateRef
        : rule.templateId
          ? await this.templateModel.findById(rule.templateId).lean()
          : null;

    if (!template || template.isActive === false) {
      return fallback;
    }

    const renderedSubject = this.renderString(template.subject, variables).trim();
    const renderedHtml = this.renderString(template.bodyHtml, variables).trim();

    if (!renderedSubject || !renderedHtml) {
      return fallback;
    }

    return {
      subject: renderedSubject,
      html: renderedHtml,
      text: renderedHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
    };
  }

  isRuleThrottled(rule: NotificationRule): boolean {
    if (!rule.throttleMinutes || rule.throttleMinutes <= 0 || !rule.lastTriggeredAt) {
      return false;
    }

    const threshold = Date.now() - rule.throttleMinutes * 60 * 1000;
    return new Date(rule.lastTriggeredAt).getTime() > threshold;
  }

  async markRuleTriggered(ruleId: string): Promise<void> {
    if (!Types.ObjectId.isValid(ruleId)) {
      return;
    }

    await this.ruleModel.findByIdAndUpdate(ruleId, {
      $set: { lastTriggeredAt: new Date() },
    });
  }

  private async ensureDefaults(): Promise<void> {
    if (this.ensureDefaultsPromise) {
      await this.ensureDefaultsPromise;
      return;
    }

    this.ensureDefaultsPromise = this.seedDefaults()
      .catch((error: any) => {
        this.logger.warn(
          `No se pudieron asegurar reglas/plantillas por defecto: ${error?.message}`,
        );
      })
      .finally(() => {
        this.ensureDefaultsPromise = null;
      });

    await this.ensureDefaultsPromise;
  }

  private async seedDefaults(): Promise<void> {
    for (const templateSeed of this.defaultTemplateSeeds) {
      await this.templateModel.updateOne(
        { code: templateSeed.code },
        {
          $setOnInsert: {
            ...templateSeed,
            scope: NotificationScope.GLOBAL,
            isActive: true,
          },
        },
        { upsert: true },
      );
    }

    const templates = await this.templateModel
      .find({
        code: { $in: this.defaultTemplateSeeds.map((template) => template.code) },
      })
      .select('_id code')
      .lean();

    const templateMap = new Map(
      templates.map((template) => [template.code, template._id]),
    );

    for (const ruleSeed of this.defaultRuleSeeds) {
      const templateId = templateMap.get(ruleSeed.templateCode);
      if (!templateId) {
        continue;
      }

      await this.ruleModel.updateOne(
        { systemKey: ruleSeed.systemKey },
        {
          $setOnInsert: {
            name: ruleSeed.name,
            systemKey: ruleSeed.systemKey,
            event: ruleSeed.event,
            scope: NotificationScope.GLOBAL,
            enabled: true,
            channel: NotificationChannel.EMAIL,
            recipients: [],
            templateId,
            throttleMinutes: 0,
            includeContextRecipients: true,
          },
        },
        { upsert: true },
      );
    }
  }

  private async buildRuleListFilter(
    currentUser: any,
    query: ListNotificationRulesDto,
  ): Promise<any> {
    const filter: any = {};

    if (query.event) {
      filter.event = query.event;
    }

    if (query.scope) {
      filter.scope = query.scope;
    }

    if (this.isPlatformUser(currentUser?.role)) {
      return filter;
    }

    const currentTenantId = this.getCurrentTenantId(currentUser);
    const currentTenantObjectId = this.toObjectId(currentTenantId);

    if (!currentTenantObjectId) {
      filter._id = null;
      return filter;
    }

    filter.$or = [
      { scope: NotificationScope.GLOBAL },
      { scope: NotificationScope.TENANT, tenantId: currentTenantObjectId },
      { scope: NotificationScope.PROJECT, tenantId: currentTenantObjectId },
    ];

    return filter;
  }

  private buildTemplateListFilter(
    currentUser: any,
    query: ListNotificationTemplatesDto,
  ) {
    const filter: any = {};

    if (query.event) {
      filter.event = query.event;
    }

    if (query.scope) {
      filter.scope = query.scope;
    }

    if (this.isPlatformUser(currentUser?.role)) {
      return filter;
    }

    const currentTenantId = this.getCurrentTenantId(currentUser);
    const currentTenantObjectId = this.toObjectId(currentTenantId);

    if (!currentTenantObjectId) {
      filter._id = null;
      return filter;
    }

    filter.$or = [
      { scope: NotificationScope.GLOBAL },
      { scope: NotificationScope.TENANT, tenantId: currentTenantObjectId },
    ];

    return filter;
  }

  private normalizeTemplatePayload(
    dto: CreateNotificationTemplateDto | UpdateNotificationTemplateDto,
    currentUser: any,
  ) {
    const scope =
      dto.scope ??
      (this.isPlatformUser(currentUser?.role)
        ? NotificationScope.GLOBAL
        : NotificationScope.TENANT);

    if (scope === NotificationScope.PROJECT) {
      throw new BadRequestException(
        'Las plantillas solo pueden tener scope GLOBAL o TENANT',
      );
    }

    if (scope === NotificationScope.GLOBAL && !this.isPlatformUser(currentUser?.role)) {
      throw new ForbiddenException(
        'Solo OWNER/PLATFORM_ADMIN pueden gestionar plantillas globales',
      );
    }

    const currentTenantId = this.getCurrentTenantId(currentUser);
    const tenantId =
      scope === NotificationScope.GLOBAL
        ? undefined
        : this.isPlatformUser(currentUser?.role)
          ? dto.tenantId || currentTenantId
          : currentTenantId;

    if (scope === NotificationScope.TENANT && !tenantId) {
      throw new BadRequestException(
        'Debe seleccionar un tenant para plantillas TENANT',
      );
    }

    const subject = dto.subject?.trim();
    const bodyHtml = dto.bodyHtml?.trim();

    if (!subject || !bodyHtml) {
      throw new BadRequestException(
        'La plantilla debe incluir subject y bodyHtml',
      );
    }

    return {
      code: dto.code?.trim().toUpperCase(),
      name: dto.name?.trim(),
      event: dto.event,
      scope,
      tenantId: this.toObjectId(tenantId),
      subject,
      bodyHtml,
      variables:
        dto.variables && dto.variables.length > 0
          ? Array.from(new Set(dto.variables.map((item) => item.trim()).filter(Boolean)))
          : this.extractTemplateVariables(subject, bodyHtml),
      isActive: dto.isActive ?? true,
    };
  }

  private async normalizeRulePayload(
    dto: CreateNotificationRuleDto | UpdateNotificationRuleDto,
    currentUser: any,
    systemKey?: string,
  ) {
    const scope = dto.scope;
    const isPlatformUser = this.isPlatformUser(currentUser?.role);
    const currentTenantId = this.getCurrentTenantId(currentUser);
    let tenantId = dto.tenantId;
    let projectId = dto.projectId;

    if (!scope) {
      throw new BadRequestException('Debe indicar un scope para la regla');
    }

    if (scope === NotificationScope.GLOBAL && !isPlatformUser) {
      throw new ForbiddenException(
        'Solo OWNER/PLATFORM_ADMIN pueden gestionar reglas globales',
      );
    }

    if (!isPlatformUser && ![NotificationScope.TENANT, NotificationScope.PROJECT].includes(scope)) {
      throw new ForbiddenException('No tiene permisos para este scope');
    }

    if (scope === NotificationScope.TENANT || scope === NotificationScope.PROJECT) {
      tenantId = isPlatformUser ? tenantId || currentTenantId : currentTenantId;

      if (!tenantId) {
        throw new BadRequestException(
          'Debe seleccionar un tenant para reglas TENANT/PROJECT',
        );
      }
    } else {
      tenantId = undefined;
      projectId = undefined;
    }

    if (scope === NotificationScope.PROJECT) {
      if (!projectId) {
        throw new BadRequestException(
          'Debe seleccionar un proyecto para reglas PROJECT',
        );
      }

      const project = await this.projectModel
        .findById(projectId)
        .select('tenantId name')
        .lean();

      if (!project) {
        throw new NotFoundException('Proyecto no encontrado');
      }

      tenantId = project.tenantId?.toString();

      if (!isPlatformUser && tenantId !== currentTenantId?.toString()) {
        throw new ForbiddenException(
          'No puede crear reglas para proyectos fuera de su tenant',
        );
      }
    }

    const recipients = this.normalizeRecipients(dto.recipients || []);
    const templateId = dto.templateId || undefined;

    if (templateId) {
      const template = await this.getTemplateForRule(templateId, currentUser);
      const ruleTenantId = tenantId?.toString();

      if (template.event !== dto.event) {
        throw new BadRequestException(
          'La plantilla seleccionada pertenece a otro evento',
        );
      }

      if (
        template.scope === NotificationScope.TENANT &&
        template.tenantId?.toString() !== ruleTenantId
      ) {
        throw new BadRequestException(
          'La plantilla TENANT seleccionada no pertenece al tenant de la regla',
        );
      }
    }

    return {
      systemKey,
      name: dto.name?.trim(),
      event: dto.event,
      scope,
      tenantId: this.toObjectId(tenantId),
      projectId: this.toObjectId(projectId),
      enabled: dto.enabled ?? true,
      channel: dto.channel ?? NotificationChannel.EMAIL,
      recipients,
      templateId: this.toObjectId(templateId),
      throttleMinutes: Math.max(0, Number(dto.throttleMinutes ?? 0)),
      includeContextRecipients: dto.includeContextRecipients ?? true,
    };
  }

  private normalizeRecipients(recipients: NotificationRecipientDto[]) {
    return recipients.map((recipient) => {
      const type = recipient.type;
      const value = recipient.value?.trim();

      if (!value) {
        throw new BadRequestException('Todos los destinatarios deben tener valor');
      }

      if (
        type === NotificationRecipientType.EMAIL &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ) {
        throw new BadRequestException(`Email invalido en destinatarios: ${value}`);
      }

      if (
        type === NotificationRecipientType.USER &&
        !Types.ObjectId.isValid(value)
      ) {
        throw new BadRequestException(
          `Usuario invalido en destinatarios: ${value}`,
        );
      }

      if (
        type === NotificationRecipientType.ROLE &&
        !Object.values(UserRole).includes(value as UserRole)
      ) {
        throw new BadRequestException(`Rol invalido en destinatarios: ${value}`);
      }

      return { type, value };
    });
  }

  private async getRuleForManagement(id: string, currentUser: any) {
    const rule = await this.ruleModel.findById(id);

    if (!rule) {
      throw new NotFoundException('Regla de notificacion no encontrada');
    }

    if (rule.scope === NotificationScope.GLOBAL && !this.isPlatformUser(currentUser?.role)) {
      throw new ForbiddenException(
        'Solo OWNER/PLATFORM_ADMIN pueden gestionar reglas globales',
      );
    }

    if (
      rule.scope !== NotificationScope.GLOBAL &&
      !this.isPlatformUser(currentUser?.role)
    ) {
      const tenantId = this.getCurrentTenantId(currentUser);
      if (!tenantId || rule.tenantId?.toString() !== tenantId.toString()) {
        throw new ForbiddenException('No tiene acceso a esta regla');
      }
    }

    return rule;
  }

  private async getTemplateForManagement(id: string, currentUser: any) {
    const template = await this.templateModel.findById(id);

    if (!template) {
      throw new NotFoundException('Plantilla de notificacion no encontrada');
    }

    if (
      template.scope === NotificationScope.GLOBAL &&
      !this.isPlatformUser(currentUser?.role)
    ) {
      throw new ForbiddenException(
        'Solo OWNER/PLATFORM_ADMIN pueden gestionar plantillas globales',
      );
    }

    if (
      template.scope === NotificationScope.TENANT &&
      !this.isPlatformUser(currentUser?.role)
    ) {
      const tenantId = this.getCurrentTenantId(currentUser);
      if (!tenantId || template.tenantId?.toString() !== tenantId.toString()) {
        throw new ForbiddenException('No tiene acceso a esta plantilla');
      }
    }

    return template;
  }

  private async getTemplateForRule(id: string, currentUser: any) {
    const template = await this.templateModel.findById(id);

    if (!template) {
      throw new NotFoundException('Plantilla de notificacion no encontrada');
    }

    if (!template.isActive) {
      throw new BadRequestException('La plantilla seleccionada esta inactiva');
    }

    if (
      template.scope === NotificationScope.GLOBAL &&
      !this.isPlatformUser(currentUser?.role)
    ) {
      return template;
    }

    if (template.scope === NotificationScope.TENANT) {
      const tenantId = this.getCurrentTenantId(currentUser);
      if (
        !this.isPlatformUser(currentUser?.role) &&
        template.tenantId?.toString() !== tenantId?.toString()
      ) {
        throw new ForbiddenException('No tiene acceso a la plantilla seleccionada');
      }
    }

    return template;
  }

  private async getAccessibleTenants(currentUser: any) {
    if (this.isPlatformUser(currentUser?.role)) {
      return this.tenantModel.find().select('name code').sort({ name: 1 }).lean();
    }

    const tenantId = this.getCurrentTenantId(currentUser);
    if (!tenantId || !Types.ObjectId.isValid(tenantId)) {
      return [];
    }

    return this.tenantModel
      .find({ _id: new Types.ObjectId(tenantId) })
      .select('name code')
      .lean();
  }

  private async getActiveTemplatesForUser(currentUser: any) {
    const filter = this.buildTemplateListFilter(currentUser, {});
    filter.isActive = true;

    return this.templateModel
      .find(filter)
      .select('name code event scope tenantId')
      .sort({ event: 1, name: 1 })
      .lean();
  }

  private renderString(template: string, variables: Record<string, any>) {
    return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, rawKey: string) => {
      const key = rawKey.trim();
      const value = this.getValueByPath(variables, key);
      return value === undefined || value === null ? '' : String(value);
    });
  }

  private extractTemplateVariables(subject: string, bodyHtml: string): string[] {
    const keys = new Set<string>();
    const matcher = /\{\{\s*([^}]+?)\s*\}\}/g;
    const source = `${subject}\n${bodyHtml}`;
    let match: RegExpExecArray | null = null;

    while ((match = matcher.exec(source))) {
      keys.add(match[1].trim());
    }

    return Array.from(keys);
  }

  private getValueByPath(
    variables: Record<string, any>,
    path: string,
  ): any {
    return path.split('.').reduce((acc: any, key: string) => acc?.[key], variables);
  }

  private userBelongsToTenant(user: any, tenantId: string): boolean {
    const normalizedTenantId = tenantId.toString();

    return (
      user?.activeTenantId?.toString?.() === normalizedTenantId ||
      user?.clientId?.toString?.() === normalizedTenantId ||
      (Array.isArray(user?.tenantIds) &&
        user.tenantIds.some(
          (item: any) => item?.toString?.() === normalizedTenantId,
        ))
    );
  }

  private isPlatformUser(role?: string): boolean {
    return [UserRole.OWNER, UserRole.PLATFORM_ADMIN].includes(role as UserRole);
  }

  private getCurrentTenantId(currentUser?: any): string | undefined {
    return (
      currentUser?.activeTenantId?.toString?.() ??
      currentUser?.clientId?.toString?.()
    );
  }

  private toObjectId(id?: string): Types.ObjectId | undefined {
    if (!id || !Types.ObjectId.isValid(id)) {
      return undefined;
    }

    return new Types.ObjectId(id);
  }

  private normalizeEmail(email?: string): string | null {
    const normalized = email?.trim().toLowerCase();
    if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return null;
    }

    return normalized;
  }
}

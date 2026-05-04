import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

interface Recipient {
  type: string;
  value: string;
}

interface RuleForm {
  name: string;
  event: string;
  scope: string;
  tenantId: string;
  projectId: string;
  templateId: string;
  throttleMinutes: number;
  enabled: boolean;
  includeContextRecipients: boolean;
  recipients: Recipient[];
}

interface TemplateForm {
  code: string;
  name: string;
  event: string;
  scope: string;
  tenantId: string;
  subject: string;
  bodyHtml: string;
  variables: string;
  isActive: boolean;
}

@Component({
  standalone: true,
  selector: 'app-notification-management',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="page">
      <div class="header">
        <div>
          <h1>Notificaciones</h1>
          <p>Reglas, destinatarios y plantillas de correo por tenant o proyecto.</p>
        </div>
        <button mat-stroked-button color="primary" (click)="reloadData()">
          <mat-icon>refresh</mat-icon>
          Actualizar
        </button>
      </div>

      @if (loading()) {
        <p class="state">Cargando modulo de notificaciones...</p>
      } @else {
        <div class="grid">
          <mat-card>
            <mat-card-header>
              <mat-card-title>{{ editingRuleId() ? 'Editar regla' : 'Nueva regla' }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Nombre</mat-label>
                  <input matInput [ngModel]="ruleForm().name" (ngModelChange)="updateRule('name', $event)">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Evento</mat-label>
                  <mat-select [ngModel]="ruleForm().event" (ngModelChange)="onRuleEventChange($event)">
                    @for (event of options().events; track event) {
                      <mat-option [value]="event">{{ event }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Scope</mat-label>
                  <mat-select [ngModel]="ruleForm().scope" (ngModelChange)="onRuleScopeChange($event)">
                    @for (scope of availableRuleScopes(); track scope) {
                      <mat-option [value]="scope">{{ scope }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                @if (needsRuleTenant()) {
                  <mat-form-field appearance="outline">
                    <mat-label>Tenant</mat-label>
                    <mat-select [ngModel]="ruleForm().tenantId" (ngModelChange)="onRuleTenantChange($event)">
                      @for (tenant of options().tenants; track tenant._id) {
                        <mat-option [value]="tenant._id">{{ tenant.name }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                }
                @if (needsRuleProject()) {
                  <mat-form-field appearance="outline">
                    <mat-label>Proyecto</mat-label>
                    <mat-select [ngModel]="ruleForm().projectId" (ngModelChange)="updateRule('projectId', $event)">
                      @for (project of projectsForTenant(); track project._id) {
                        <mat-option [value]="project._id">{{ project.name }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                }
                <mat-form-field appearance="outline">
                  <mat-label>Plantilla</mat-label>
                  <mat-select [ngModel]="ruleForm().templateId" (ngModelChange)="updateRule('templateId', $event)">
                    <mat-option value="">Sin plantilla explicita</mat-option>
                    @for (template of templatesForRule(); track template._id) {
                      <mat-option [value]="template._id">{{ template.name }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Throttle</mat-label>
                  <input matInput type="number" [ngModel]="ruleForm().throttleMinutes" (ngModelChange)="updateRule('throttleMinutes', toNumber($event))">
                </mat-form-field>
              </div>

              <div class="toggles">
                <mat-slide-toggle [ngModel]="ruleForm().enabled" (ngModelChange)="updateRule('enabled', $event)">Habilitada</mat-slide-toggle>
                <mat-slide-toggle [ngModel]="ruleForm().includeContextRecipients" (ngModelChange)="updateRule('includeContextRecipients', $event)">Incluir destinatarios del evento</mat-slide-toggle>
              </div>

              <mat-divider></mat-divider>

              <div class="recipient-row">
                <mat-form-field appearance="outline">
                  <mat-label>Tipo</mat-label>
                  <mat-select [ngModel]="recipientDraft().type" (ngModelChange)="changeRecipientType($event)">
                    @for (type of options().recipientTypes; track type) {
                      <mat-option [value]="type">{{ type }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                @if (recipientDraft().type === 'ROLE') {
                  <mat-form-field appearance="outline">
                    <mat-label>Rol</mat-label>
                    <mat-select [ngModel]="recipientDraft().value" (ngModelChange)="updateRecipientDraft('value', $event)">
                      @for (role of options().roles; track role) {
                        <mat-option [value]="role">{{ role }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                } @else if (recipientDraft().type === 'USER') {
                  <mat-form-field appearance="outline">
                    <mat-label>Usuario</mat-label>
                    <mat-select [ngModel]="recipientDraft().value" (ngModelChange)="updateRecipientDraft('value', $event)">
                      @for (user of usersForTenant(); track user._id) {
                        <mat-option [value]="user._id">{{ user.firstName }} {{ user.lastName }} - {{ user.email }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                } @else {
                  <mat-form-field appearance="outline">
                    <mat-label>Email</mat-label>
                    <input matInput [ngModel]="recipientDraft().value" (ngModelChange)="updateRecipientDraft('value', $event)">
                  </mat-form-field>
                }

                <button mat-raised-button color="primary" (click)="addRecipient()">Agregar</button>
              </div>

              @if (ruleForm().recipients.length > 0) {
                <div class="chips">
                  @for (recipient of ruleForm().recipients; track recipient.type + '-' + recipient.value) {
                    <button type="button" class="chip" (click)="removeRecipient(recipient)">{{ getRecipientLabel(recipient) }} x</button>
                  }
                </div>
              }
            </mat-card-content>
            <mat-card-actions align="end">
              <button mat-button (click)="resetRuleForm()">Limpiar</button>
              <button mat-raised-button color="primary" [disabled]="savingRule()" (click)="saveRule()">{{ editingRuleId() ? 'Actualizar' : 'Crear' }}</button>
            </mat-card-actions>
          </mat-card>

          <mat-card>
            <mat-card-header>
              <mat-card-title>Reglas</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              @if (filteredRules().length === 0) {
                <p class="state small">No hay reglas cargadas.</p>
              } @else {
                <div class="list">
                  @for (rule of filteredRules(); track rule._id) {
                    <div class="item" [class.off]="rule.enabled === false">
                      <div class="item-head">
                        <div>
                          <strong>{{ rule.name }}</strong>
                          <p>{{ rule.event }} - {{ rule.scope }}</p>
                        </div>
                        <div>
                          <button mat-icon-button (click)="editRule(rule)"><mat-icon>edit</mat-icon></button>
                          <button mat-icon-button color="warn" (click)="deleteRule(rule)"><mat-icon>delete</mat-icon></button>
                        </div>
                      </div>
                      <p class="meta">{{ rule.includeContextRecipients ? 'Incluye contexto' : 'Solo destinatarios manuales' }} - throttle {{ rule.throttleMinutes || 0 }} min</p>
                      @if (rule.recipients?.length) {
                        <div class="chips">
                          @for (recipient of rule.recipients; track recipient.type + '-' + recipient.value) {
                            <span class="chip static">{{ getRecipientLabel(recipient) }}</span>
                          }
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </mat-card-content>
          </mat-card>

          <mat-card>
            <mat-card-header>
              <mat-card-title>{{ editingTemplateId() ? 'Editar plantilla' : 'Nueva plantilla' }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Codigo</mat-label>
                  <input matInput [ngModel]="templateForm().code" (ngModelChange)="updateTemplate('code', $event)">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Nombre</mat-label>
                  <input matInput [ngModel]="templateForm().name" (ngModelChange)="updateTemplate('name', $event)">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Evento</mat-label>
                  <mat-select [ngModel]="templateForm().event" (ngModelChange)="updateTemplate('event', $event)">
                    @for (event of options().events; track event) {
                      <mat-option [value]="event">{{ event }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Scope</mat-label>
                  <mat-select [ngModel]="templateForm().scope" (ngModelChange)="onTemplateScopeChange($event)">
                    @for (scope of availableTemplateScopes(); track scope) {
                      <mat-option [value]="scope">{{ scope }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                @if (needsTemplateTenant()) {
                  <mat-form-field appearance="outline">
                    <mat-label>Tenant</mat-label>
                    <mat-select [ngModel]="templateForm().tenantId" (ngModelChange)="updateTemplate('tenantId', $event)">
                      @for (tenant of options().tenants; track tenant._id) {
                        <mat-option [value]="tenant._id">{{ tenant.name }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                }
                <mat-form-field appearance="outline" class="full">
                  <mat-label>Subject</mat-label>
                  <input matInput [ngModel]="templateForm().subject" (ngModelChange)="updateTemplate('subject', $event)">
                </mat-form-field>
                <mat-form-field appearance="outline" class="full">
                  <mat-label>Body HTML</mat-label>
                  <textarea matInput rows="7" [ngModel]="templateForm().bodyHtml" (ngModelChange)="updateTemplate('bodyHtml', $event)"></textarea>
                </mat-form-field>
                <mat-form-field appearance="outline" class="full">
                  <mat-label>Variables</mat-label>
                  <input matInput [ngModel]="templateForm().variables" (ngModelChange)="updateTemplate('variables', $event)" placeholder="userName, findingTitle">
                </mat-form-field>
              </div>
              <div class="toggles">
                <mat-slide-toggle [ngModel]="templateForm().isActive" (ngModelChange)="updateTemplate('isActive', $event)">Activa</mat-slide-toggle>
              </div>
            </mat-card-content>
            <mat-card-actions align="end">
              <button mat-button (click)="resetTemplateForm()">Limpiar</button>
              <button mat-raised-button color="primary" [disabled]="savingTemplate()" (click)="saveTemplate()">{{ editingTemplateId() ? 'Actualizar' : 'Crear' }}</button>
            </mat-card-actions>
          </mat-card>

          <mat-card>
            <mat-card-header>
              <mat-card-title>Plantillas</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              @if (filteredTemplates().length === 0) {
                <p class="state small">No hay plantillas cargadas.</p>
              } @else {
                <div class="list">
                  @for (template of filteredTemplates(); track template._id) {
                    <div class="item" [class.off]="template.isActive === false">
                      <div class="item-head">
                        <div>
                          <strong>{{ template.name }}</strong>
                          <p>{{ template.code }} - {{ template.event }}</p>
                        </div>
                        <div>
                          <button mat-icon-button (click)="editTemplate(template)"><mat-icon>edit</mat-icon></button>
                          <button mat-icon-button color="warn" (click)="deleteTemplate(template)"><mat-icon>delete</mat-icon></button>
                        </div>
                      </div>
                      <p class="meta">{{ template.scope }} - {{ template.subject }}</p>
                    </div>
                  }
                </div>
              }
            </mat-card-content>
          </mat-card>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { display: flex; flex-direction: column; gap: 20px; }
    .header { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
    h1 { margin: 0 0 8px 0; font-size: 28px; }
    .header p { margin: 0; color: #64748b; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
    .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .full { grid-column: 1 / -1; }
    .toggles { display: flex; flex-wrap: wrap; gap: 20px; margin: 12px 0; }
    .recipient-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)) auto; gap: 12px; margin-top: 16px; align-items: start; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
    .chip { border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 999px; padding: 6px 10px; cursor: pointer; }
    .chip.static { cursor: default; }
    .list { display: flex; flex-direction: column; gap: 12px; }
    .item { border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; }
    .item.off { opacity: 0.7; }
    .item-head { display: flex; justify-content: space-between; gap: 12px; }
    .item-head p, .meta { margin: 6px 0 0 0; color: #64748b; }
    .state { padding: 24px; background: #f8fafc; border-radius: 12px; text-align: center; color: #64748b; }
    .state.small { padding: 12px; }
    @media (max-width: 1000px) {
      .grid, .form-grid, .recipient-row { grid-template-columns: 1fr; }
      .header { flex-direction: column; }
    }
  `],
})
export class NotificationManagementComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/notifications`;

  loading = signal(true);
  savingRule = signal(false);
  savingTemplate = signal(false);
  editingRuleId = signal<string | null>(null);
  editingTemplateId = signal<string | null>(null);
  options = signal<any>({ events: [], scopes: [], recipientTypes: [], roles: [], users: [], projects: [], tenants: [] });
  rules = signal<any[]>([]);
  templates = signal<any[]>([]);
  recipientDraft = signal<Recipient>({ type: 'EMAIL', value: '' });
  ruleForm = signal<RuleForm>(this.emptyRuleForm());
  templateForm = signal<TemplateForm>(this.emptyTemplateForm());
  filteredRules = computed(() => this.rules());
  filteredTemplates = computed(() => this.templates());

  ngOnInit(): void {
    this.reloadData();
  }

  reloadData(): void {
    this.loading.set(true);
    forkJoin({
      options: this.http.get<any>(`${this.apiUrl}/options`),
      rules: this.http.get<any[]>(`${this.apiUrl}/rules`),
      templates: this.http.get<any[]>(`${this.apiUrl}/templates`),
    }).subscribe({
      next: ({ options, rules, templates }) => {
        this.options.set(options);
        this.rules.set(rules);
        this.templates.set(templates);
        this.loading.set(false);
        this.resetRuleForm();
        this.resetTemplateForm();
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        this.loading.set(false);
        this.show(error?.error?.message || 'No se pudo cargar el modulo');
      },
    });
  }

  availableRuleScopes(): string[] {
    return this.canManageGlobal()
      ? this.options().scopes
      : this.options().scopes.filter((scope: string) => scope !== 'GLOBAL');
  }

  availableTemplateScopes(): string[] {
    return this.availableRuleScopes().filter((scope: string) => scope !== 'PROJECT');
  }

  needsRuleTenant(): boolean {
    return ['TENANT', 'PROJECT'].includes(this.ruleForm().scope);
  }

  needsRuleProject(): boolean {
    return this.ruleForm().scope === 'PROJECT';
  }

  needsTemplateTenant(): boolean {
    return this.templateForm().scope === 'TENANT';
  }

  projectsForTenant(): any[] {
    const tenantId = this.ruleForm().tenantId;
    return this.options().projects.filter((project: any) => !tenantId || this.idOf(project.tenantId) === tenantId);
  }

  usersForTenant(): any[] {
    const tenantId = this.ruleForm().tenantId;
    if (!tenantId) return this.options().users;
    return this.options().users.filter((user: any) =>
      this.idOf(user.activeTenantId) === tenantId ||
      this.idOf(user.clientId) === tenantId ||
      (Array.isArray(user.tenantIds) && user.tenantIds.some((item: any) => this.idOf(item) === tenantId)),
    );
  }

  templatesForRule(): any[] {
    const form = this.ruleForm();
    return this.templates().filter((template) =>
      template.isActive !== false &&
      template.event === form.event &&
      (template.scope === 'GLOBAL' || this.idOf(template.tenantId) === form.tenantId),
    );
  }

  updateRule<K extends keyof RuleForm>(key: K, value: RuleForm[K]): void {
    this.ruleForm.update((current) => ({ ...current, [key]: value }));
  }

  updateTemplate<K extends keyof TemplateForm>(key: K, value: TemplateForm[K]): void {
    this.templateForm.update((current) => ({ ...current, [key]: value }));
  }

  updateRecipientDraft<K extends keyof Recipient>(key: K, value: Recipient[K]): void {
    this.recipientDraft.update((current) => ({ ...current, [key]: value }));
  }

  changeRecipientType(type: string): void {
    this.recipientDraft.set({ type, value: '' });
  }

  onRuleEventChange(event: string): void {
    this.ruleForm.update((current) => ({ ...current, event, templateId: '' }));
  }

  onRuleScopeChange(scope: string): void {
    this.ruleForm.update((current) => ({
      ...current,
      scope,
      tenantId: scope === 'GLOBAL' ? '' : current.tenantId || this.defaultTenantId(),
      projectId: scope === 'PROJECT' ? current.projectId : '',
      templateId: '',
    }));
  }

  onRuleTenantChange(tenantId: string): void {
    this.ruleForm.update((current) => ({ ...current, tenantId, projectId: '', templateId: '' }));
  }

  onTemplateScopeChange(scope: string): void {
    this.templateForm.update((current) => ({
      ...current,
      scope,
      tenantId: scope === 'TENANT' ? current.tenantId || this.defaultTenantId() : '',
    }));
  }

  addRecipient(): void {
    const draft = this.recipientDraft();
    const value = (draft.value || '').trim();
    if (!value) {
      this.show('Selecciona un destinatario valido');
      return;
    }
    this.ruleForm.update((current) => ({
      ...current,
      recipients: [...current.recipients, { type: draft.type, value }],
    }));
    this.recipientDraft.set({ type: draft.type, value: '' });
  }

  removeRecipient(recipient: Recipient): void {
    this.ruleForm.update((current) => ({
      ...current,
      recipients: current.recipients.filter((item) => !(item.type === recipient.type && item.value === recipient.value)),
    }));
  }

  saveRule(): void {
    const form = this.ruleForm();
    const payload: any = {
      name: form.name.trim(),
      event: form.event,
      scope: form.scope,
      enabled: form.enabled,
      channel: 'EMAIL',
      recipients: form.recipients,
      templateId: form.templateId || undefined,
      throttleMinutes: this.toNumber(form.throttleMinutes),
      includeContextRecipients: form.includeContextRecipients,
    };
    if (!payload.name) {
      this.show('Debes indicar un nombre para la regla');
      return;
    }
    if (this.needsRuleTenant() && !form.tenantId) {
      this.show('Debes seleccionar un tenant');
      return;
    }
    if (this.needsRuleProject() && !form.projectId) {
      this.show('Debes seleccionar un proyecto');
      return;
    }
    if (form.scope !== 'GLOBAL') payload.tenantId = form.tenantId;
    if (form.scope === 'PROJECT') payload.projectId = form.projectId;
    this.savingRule.set(true);
    const request$ = this.editingRuleId()
      ? this.http.patch(`${this.apiUrl}/rules/${this.editingRuleId()}`, payload)
      : this.http.post(`${this.apiUrl}/rules`, payload);
    request$.subscribe({
      next: () => {
        this.savingRule.set(false);
        this.show('Regla guardada correctamente');
        this.reloadData();
      },
      error: (error) => {
        console.error('Error saving rule:', error);
        this.savingRule.set(false);
        this.show(error?.error?.message || 'No se pudo guardar la regla');
      },
    });
  }

  editRule(rule: any): void {
    this.editingRuleId.set(rule._id);
    this.ruleForm.set({
      name: rule.name || '',
      event: rule.event || this.defaultEvent(),
      scope: rule.scope || this.defaultRuleScope(),
      tenantId: this.idOf(rule.tenantId),
      projectId: this.idOf(rule.projectId),
      templateId: this.idOf(rule.templateId),
      throttleMinutes: Number(rule.throttleMinutes || 0),
      enabled: rule.enabled !== false,
      includeContextRecipients: rule.includeContextRecipients !== false,
      recipients: (rule.recipients || []).map((recipient: any) => ({ type: recipient.type, value: recipient.value })),
    });
  }

  deleteRule(rule: any): void {
    if (!confirm(`Eliminar o desactivar la regla "${rule.name}"?`)) return;
    this.http.delete(`${this.apiUrl}/rules/${rule._id}`).subscribe({
      next: () => {
        this.show('Regla eliminada o desactivada');
        this.reloadData();
      },
      error: (error) => {
        console.error('Error deleting rule:', error);
        this.show(error?.error?.message || 'No se pudo eliminar la regla');
      },
    });
  }

  resetRuleForm(): void {
    this.editingRuleId.set(null);
    this.ruleForm.set(this.emptyRuleForm());
    this.recipientDraft.set({ type: 'EMAIL', value: '' });
  }

  saveTemplate(): void {
    const form = this.templateForm();
    const payload: any = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      event: form.event,
      scope: form.scope,
      subject: form.subject.trim(),
      bodyHtml: form.bodyHtml.trim(),
      variables: this.parseVariables(form.variables),
      isActive: form.isActive,
    };
    if (!payload.code || !payload.name || !payload.subject || !payload.bodyHtml) {
      this.show('Completa codigo, nombre, subject y body');
      return;
    }
    if (form.scope === 'TENANT' && !form.tenantId) {
      this.show('Debes seleccionar un tenant para la plantilla');
      return;
    }
    if (form.scope === 'TENANT') payload.tenantId = form.tenantId;
    this.savingTemplate.set(true);
    const request$ = this.editingTemplateId()
      ? this.http.patch(`${this.apiUrl}/templates/${this.editingTemplateId()}`, payload)
      : this.http.post(`${this.apiUrl}/templates`, payload);
    request$.subscribe({
      next: () => {
        this.savingTemplate.set(false);
        this.show('Plantilla guardada correctamente');
        this.reloadData();
      },
      error: (error) => {
        console.error('Error saving template:', error);
        this.savingTemplate.set(false);
        this.show(error?.error?.message || 'No se pudo guardar la plantilla');
      },
    });
  }

  editTemplate(template: any): void {
    this.editingTemplateId.set(template._id);
    this.templateForm.set({
      code: template.code || '',
      name: template.name || '',
      event: template.event || this.defaultEvent(),
      scope: template.scope || this.defaultTemplateScope(),
      tenantId: this.idOf(template.tenantId),
      subject: template.subject || '',
      bodyHtml: template.bodyHtml || '',
      variables: Array.isArray(template.variables) ? template.variables.join(', ') : '',
      isActive: template.isActive !== false,
    });
  }

  deleteTemplate(template: any): void {
    if (!confirm(`Desactivar la plantilla "${template.name}"?`)) return;
    this.http.delete(`${this.apiUrl}/templates/${template._id}`).subscribe({
      next: () => {
        this.show('Plantilla desactivada');
        this.reloadData();
      },
      error: (error) => {
        console.error('Error deleting template:', error);
        this.show(error?.error?.message || 'No se pudo desactivar la plantilla');
      },
    });
  }

  resetTemplateForm(): void {
    this.editingTemplateId.set(null);
    this.templateForm.set(this.emptyTemplateForm());
  }

  getRecipientLabel(recipient: Recipient): string {
    if (recipient.type === 'EMAIL') return recipient.value;
    if (recipient.type === 'ROLE') return `Rol: ${recipient.value}`;
    const user = this.options().users.find((item: any) => this.idOf(item) === recipient.value);
    return user ? `Usuario: ${user.firstName} ${user.lastName}` : `Usuario: ${recipient.value}`;
  }

  toNumber(value: any): number {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
  }

  private emptyRuleForm(): RuleForm {
    return {
      name: '',
      event: this.defaultEvent(),
      scope: this.defaultRuleScope(),
      tenantId: this.defaultTenantId(),
      projectId: '',
      templateId: '',
      throttleMinutes: 0,
      enabled: true,
      includeContextRecipients: true,
      recipients: [],
    };
  }

  private emptyTemplateForm(): TemplateForm {
    return {
      code: '',
      name: '',
      event: this.defaultEvent(),
      scope: this.defaultTemplateScope(),
      tenantId: this.defaultTenantId(),
      subject: '',
      bodyHtml: '',
      variables: '',
      isActive: true,
    };
  }

  private defaultEvent(): string {
    return this.options().events[0] || 'USER_CREATED';
  }

  private defaultRuleScope(): string {
    return this.canManageGlobal() ? 'GLOBAL' : 'TENANT';
  }

  private defaultTemplateScope(): string {
    return this.canManageGlobal() ? 'GLOBAL' : 'TENANT';
  }

  private defaultTenantId(): string {
    return this.options().tenants[0]?._id || '';
  }

  private canManageGlobal(): boolean {
    const role = this.authService.currentUser()?.role;
    return role === 'OWNER' || role === 'PLATFORM_ADMIN';
  }

  private parseVariables(value: string): string[] {
    return Array.from(new Set((value || '').split(/[,\n]/).map((item) => item.trim()).filter(Boolean)));
  }

  private idOf(entity: any): string {
    if (!entity) return '';
    if (typeof entity === 'string') return entity;
    return entity._id || entity.id || '';
  }

  private show(message: string): void {
    this.snackBar.open(message, 'Cerrar', { duration: 3500, horizontalPosition: 'end', verticalPosition: 'top' });
  }
}

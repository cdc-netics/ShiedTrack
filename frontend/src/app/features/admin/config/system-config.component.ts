import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-system-config',
  standalone: true,
  imports: [
    CommonModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDividerModule,
    FormsModule
  ],
  template: `
    <div class="config-container">
      <h1>⚙️ Configuración del Sistema</h1>

      <mat-accordion class="config-accordion">
        <!-- NOMENCLATURA DE CÓDIGOS -->
        <mat-expansion-panel [expanded]="true">
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon>tag</mat-icon>
              Nomenclatura de Códigos
            </mat-panel-title>
            <mat-panel-description>
              Formato de códigos de hallazgos
            </mat-panel-description>
          </mat-expansion-panel-header>

          <p class="info-text">
            @if (isOwner()) {
              <mat-icon class="info-icon">info</mat-icon>
              Como OWNER, esta configuración aplicará a TODO el sistema
            } @else {
              <mat-icon class="info-icon">info</mat-icon>
              Como ADMIN, aplica solo a tu tenant. Si no configuras, se usará la del Owner
            }
          </p>
          
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Prefijo de Código</mat-label>
            <input matInput [(ngModel)]="config().codePrefix" placeholder="VULN">
            <mat-hint>Ej: VULN, FIND, HAL</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Formato</mat-label>
            <mat-select [(ngModel)]="config().codeFormat">
              <mat-option value="PREFIX-NNNNNN">PREFIX-NNNNNN (Ej: VULN-000123)</mat-option>
              <mat-option value="PREFIX-YYYY-NNNN">PREFIX-YYYY-NNNN (Ej: VULN-2025-0001)</mat-option>
              <mat-option value="PREFIX-MM-NNNN">PREFIX-MM-NNNN (Ej: VULN-12-0001)</mat-option>
            </mat-select>
          </mat-form-field>

          <div class="preview-box">
            <strong>Vista previa:</strong> {{ generateCodePreview() }}
          </div>

          <mat-action-row>
            <button mat-button color="primary" (click)="saveConfig()">Guardar</button>
          </mat-action-row>
        </mat-expansion-panel>

        <!-- CONFIGURACIÓN DE TENANTS -->
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon>domain</mat-icon>
              Tenants
            </mat-panel-title>
            <mat-panel-description>
              Gestión de tenants y configuración por tenant
            </mat-panel-description>
          </mat-expansion-panel-header>

          <p class="info-text">
            <mat-icon class="info-icon">info</mat-icon>
            Configura tu Tenant
          </p>

          <div class="form-field">
            <mat-slide-toggle [(ngModel)]="areaConfig().requireAreaPerProject">
              Requerir tenant para cada proyecto
            </mat-slide-toggle>
            <p class="hint-text">Los proyectos deberán tener un tenant asignado</p>
          </div>

          <div class="form-field">
            <mat-slide-toggle [(ngModel)]="areaConfig().autoCreateDefaultArea">
              Crear tenant "General" automáticamente
            </mat-slide-toggle>
            <p class="hint-text">Para nuevos clientes sin tenants definidos</p>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Prefijo de código de tenant</mat-label>
            <input matInput [(ngModel)]="areaConfig().areaCodePrefix" placeholder="AREA">
            <mat-hint>Se usará en reportes: TENANT-001, TENANT-002</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Niveles de jerarquía</mat-label>
            <mat-select [(ngModel)]="areaConfig().hierarchyLevels">
              <mat-option [value]="1">1 nivel (Cliente → Proyecto)</mat-option>
              <mat-option [value]="2">2 niveles (Cliente → Tenant → Proyecto)</mat-option>
              <mat-option [value]="3">3 niveles (Cliente → Tenant → Sub-tenant → Proyecto)</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-divider></mat-divider>

          <!-- CONFIGURACIÓN DE TENANT/CLIENTE (Display Name, Favicon, Logo, Colores) -->
          <h3 style="margin-top: 20px; margin-bottom: 10px;">Configuración de Tenant</h3>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nombre Mostrado del Tenant</mat-label>
            <input matInput placeholder="ej: ACME" [(ngModel)]="tenantConfig().displayName">
            <mat-icon matSuffix>business</mat-icon>
            <mat-hint>Este nombre aparecerá en la interfaz del usuario</mat-hint>
          </mat-form-field>

          <!-- Favicon -->
          <div class="form-field" style="margin-top: 16px;">
            <label>Favicon del Sistema</label>
            <div style="border: 2px dashed #ccc; padding: 16px; border-radius: 4px; margin-top: 8px;">
              @if (tenantConfig().faviconPreview) {
                <img [src]="tenantConfig().faviconPreview" alt="Favicon" style="width: 64px; height: 64px; margin-bottom: 12px;">
              }
              <input type="file" accept="image/*" (change)="onFaviconSelected($event)" #faviconInput hidden>
              <button mat-raised-button color="primary" (click)="faviconInput.click()">
                <mat-icon>upload</mat-icon>
                Subir Favicon
              </button>
            </div>
          </div>

          <!-- Logo -->
          <div class="form-field" style="margin-top: 16px;">
            <label>Logo del Sistema</label>
            <div style="border: 2px dashed #ccc; padding: 16px; border-radius: 4px; margin-top: 8px;">
              @if (tenantConfig().logoPreview) {
                <img [src]="tenantConfig().logoPreview" alt="Logo" style="max-width: 150px; max-height: 150px; margin-bottom: 12px;">
              }
              <input type="file" accept="image/*" (change)="onLogoSelected($event)" #logoInput hidden>
              <button mat-raised-button color="primary" (click)="logoInput.click()">
                <mat-icon>upload</mat-icon>
                Subir Logo
              </button>
            </div>
          </div>

          <!-- Color Primario -->
          <mat-form-field appearance="outline" class="full-width" style="margin-top: 16px;">
            <mat-label>Color Primario del Sistema</mat-label>
            <input matInput type="color" [(ngModel)]="tenantConfig().primaryColor" placeholder="#1976D2">
            <mat-icon matSuffix>palette</mat-icon>
          </mat-form-field>

          @if (tenantConfig().primaryColor) {
            <div style="width: 100%; height: 60px; background-color: {{ tenantConfig().primaryColor }}; border-radius: 4px; margin-top: 8px;"></div>
          }

          <mat-action-row>
            <button mat-button color="primary" (click)="saveAreaConfig(); saveTenantConfig();">Guardar</button>
          </mat-action-row>
        </mat-expansion-panel>

        <!-- FUSIÓN DE PROYECTOS -->
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon>merge_type</mat-icon>
              Fusión de Proyectos
            </mat-panel-title>
            <mat-panel-description>
              Unir proyectos duplicados o mal escritos
            </mat-panel-description>
          </mat-expansion-panel-header>

          <p class="info-text">
            <mat-icon class="info-icon">warning</mat-icon>
            Unir proyectos mal escritos a uno existente (Solo Admin/Owner)
          </p>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Proyecto Origen (mal escrito)</mat-label>
            <mat-select [(ngModel)]="mergeConfig().sourceProject">
              @for (project of projects(); track project.id) {
                <mat-option [value]="project.id">{{ project.name }}</mat-option>
              }
            </mat-select>
            <mat-hint>El proyecto que será fusionado</mat-hint>
          </mat-form-field>

          <mat-icon class="merge-arrow">arrow_downward</mat-icon>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Proyecto Destino (correcto)</mat-label>
            <mat-select [(ngModel)]="mergeConfig().targetProject">
              @for (project of projects(); track project.id) {
                <mat-option [value]="project.id">{{ project.name }}</mat-option>
              }
            </mat-select>
            <mat-hint>El proyecto que recibirá los hallazgos</mat-hint>
          </mat-form-field>

          <p class="warning-text">
            ⚠️ Esta acción NO se puede deshacer. Todos los hallazgos del proyecto origen se moverán al destino.
          </p>

          <mat-action-row>
            <button mat-raised-button color="warn" 
                    (click)="mergeProjects()"
                    [disabled]="!canMerge()">
              <mat-icon>merge_type</mat-icon>
              Fusionar Proyectos
            </button>
          </mat-action-row>
        </mat-expansion-panel>

        <!-- SEGURIDAD -->
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon>security</mat-icon>
              Seguridad
            </mat-panel-title>
            <mat-panel-description>
              Políticas de autenticación y sesiones
            </mat-panel-description>
          </mat-expansion-panel-header>

          <div class="form-field">
            <mat-slide-toggle [(ngModel)]="config().mfaRequired">
              Requerir MFA para administradores
            </mat-slide-toggle>
          </div>
          <div class="form-field">
            <mat-slide-toggle [(ngModel)]="config().passwordExpiry">
              Expiración de contraseñas (90 días)
            </mat-slide-toggle>
          </div>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Intentos de login fallidos</mat-label>
            <input matInput type="number" [(ngModel)]="config().maxLoginAttempts">
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Tiempo de sesión (minutos)</mat-label>
            <input matInput type="number" [(ngModel)]="config().sessionTimeout">
          </mat-form-field>

          <mat-action-row>
            <button mat-button color="primary" (click)="saveConfig()">Guardar</button>
          </mat-action-row>
        </mat-expansion-panel>

        <!-- CONFIGURACIÓN SMTP (EMAIL) -->
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon>email</mat-icon>
              Servidor SMTP
            </mat-panel-title>
            <mat-panel-description>
              Configuración de credenciales de correo
            </mat-panel-description>
          </mat-expansion-panel-header>
          
          <div class="smtp-form">
            <p class="info-text">
              <mat-icon class="info-icon">lock</mat-icon>
              Las credenciales se guardan encriptadas en la base de datos.
            </p>

            <!-- Host & Port Row -->
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>SMTP Host</mat-label>
                <input matInput [(ngModel)]="smtpConfig().host" placeholder="smtp.gmail.com">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Puerto</mat-label>
                <input matInput type="number" [(ngModel)]="smtpConfig().port" placeholder="587">
              </mat-form-field>
            </div>

            <!-- User & Pass Row -->
             <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Usuario</mat-label>
                <input matInput [(ngModel)]="smtpConfig().user" placeholder="user@example.com">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Contraseña</mat-label>
                <input matInput [type]="hidePassword() ? 'password' : 'text'" [(ngModel)]="smtpConfig().pass">
                <button mat-icon-button matSuffix (click)="hidePassword.set(!hidePassword())">
                  <mat-icon>{{hidePassword() ? 'visibility_off' : 'visibility'}}</mat-icon>
                </button>
              </mat-form-field>
            </div>
            
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Email Remitente</mat-label>
                <input matInput [(ngModel)]="smtpConfig().fromEmail" placeholder="noreply@shieldtrack.com">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Nombre Remitente</mat-label>
                <input matInput [(ngModel)]="smtpConfig().fromName" placeholder="ShieldTrack Security">
              </mat-form-field>
            </div>

            <!-- Security Toggle -->
             <div class="form-field">
              <mat-slide-toggle [(ngModel)]="smtpConfig().secure">
                Usar SSL/TLS
              </mat-slide-toggle>
            </div>
            
            <div class="actions">
                <button mat-stroked-button color="accent" (click)="testSmtp()">
                    <mat-icon>send</mat-icon> Probar Conexión
                </button>
                <button mat-raised-button color="primary" (click)="saveSmtpConfig()">Guardar Configuración</button>
            </div>
          </div>
        </mat-expansion-panel>

        <!-- NOTIFICACIONES -->
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon>email</mat-icon>
              Notificaciones
            </mat-panel-title>
            <mat-panel-description>
              Configuración de correos y alertas
            </mat-panel-description>
          </mat-expansion-panel-header>

          <div class="form-field">
            <mat-slide-toggle [(ngModel)]="config().emailNotifications">
              Notificaciones por email
            </mat-slide-toggle>
          </div>
          <p class="hint-text">Configure las credenciales en el panel "Servidor SMTP" arriba.</p>
          
          <mat-action-row>
            <button mat-button color="primary" (click)="saveConfig()">Guardar</button>
          </mat-action-row>
        </mat-expansion-panel>

        <!-- RESPALDOS Y ALMACENAMIENTO -->
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon>backup</mat-icon>
              Respaldos y Almacenamiento
            </mat-panel-title>
            <mat-panel-description>
              Backup automático y retención de datos
            </mat-panel-description>
          </mat-expansion-panel-header>

          <div class="form-field">
            <mat-slide-toggle [(ngModel)]="config().autoBackup">
              Respaldos automáticos
            </mat-slide-toggle>
          </div>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Frecuencia</mat-label>
            <mat-select [(ngModel)]="config().backupFrequency">
              <mat-option value="daily">Diario</mat-option>
              <mat-option value="weekly">Semanal</mat-option>
              <mat-option value="monthly">Mensual</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Retención (días)</mat-label>
            <input matInput type="number" [(ngModel)]="config().retentionDays" placeholder="30">
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Tamaño máximo de archivo (MB)</mat-label>
            <input matInput type="number" [(ngModel)]="config().maxFileSize" placeholder="10">
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Tipos de archivo permitidos</mat-label>
            <input matInput [(ngModel)]="config().allowedFileTypes" placeholder="pdf,png,jpg,jpeg,txt,doc,docx">
            <mat-hint>Separados por comas</mat-hint>
          </mat-form-field>

          <div class="storage-info">
            <p><strong>Uso de almacenamiento:</strong></p>
            <p>Evidencias: 245 MB</p>
            <p>Reportes: 89 MB</p>
            <p>Total: 334 MB de 10 GB</p>
          </div>

          <mat-action-row>
            <button mat-button color="primary" (click)="saveConfig()">Guardar</button>
          </mat-action-row>
        </mat-expansion-panel>
        <!-- DANGER ZONE -->
        <mat-expansion-panel class="danger-zone" *ngIf="isOwner()">
          <mat-expansion-panel-header>
            <mat-panel-title style="color: #f44336;">
              <mat-icon color="warn">warning</mat-icon>
              Zone de Peligro (Danger Zone)
            </mat-panel-title>
            <mat-panel-description>
              Acciones destructivas y reset de base de datos
            </mat-panel-description>
          </mat-expansion-panel-header>

          <div style="background: #ffebee; border: 1px solid #ffcdd2; color: #b71c1c; padding: 16px; border-radius: 4px; margin-bottom: 16px;">
             <h3 style="margin-top:0">⚠️ Reset Completo de Base de Datos</h3>
             <p>Esta acción eliminará <strong>permanentemente</strong>:</p>
             <ul>
               <li>Todos los Hallazgos</li>
               <li>Todos los Proyectos</li>
               <li>Todos los Clientes</li>
               <li>Todos los Tenants</li>
               <li>Registros de Auditoría</li>
             </ul>
             <p>No eliminará Usuarios ni la Configuración de Sistema.</p>
          </div>

          <div style="display: flex; gap: 16px; align-items: center;">
            <mat-form-field appearance="outline" style="flex: 1;">
              <mat-label>Escribe "DELETE" para confirmar</mat-label>
              <input matInput [(ngModel)]="resetConfirmation">
            </mat-form-field>

            <button mat-flat-button color="warn" 
                    [disabled]="resetConfirmation !== 'DELETE'"
                    (click)="resetDatabase()">
              <mat-icon>delete_forever</mat-icon>
              ELIMINAR TODO
            </button>
          </div>
        </mat-expansion-panel>

      </mat-accordion>
    </div>
  `,
  styles: [`
    .config-container {
      padding: 0;
      max-width: 1400px;
    }

    h1 {
      margin: 0 0 24px 0;
      font-size: 28px;
      font-weight: 500;
    }

    .config-accordion {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      align-items: start;
    }

    .smtp-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .actions {
      display: flex;
      gap: 16px;
      justify-content: flex-end;
      margin-top: 16px;
    }

    @media (max-width: 800px) {
      .config-accordion {
        grid-template-columns: 1fr;
      }
    }

    mat-expansion-panel {
      margin-bottom: 0 !important;
    }

    mat-panel-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    mat-panel-description {
      color: rgba(0,0,0,0.6);
    }

    .form-field {
      margin-bottom: 16px;
    }

    .hint-text {
      font-size: 12px;
      color: rgba(0,0,0,0.6);
      margin: 4px 0 0 0;
    }

    .full-width {
      width: 100%;
    }

    .storage-info {
      margin-top: 16px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 4px;
    }

    .storage-info p {
      margin: 4px 0;
      font-size: 14px;
    }

    .info-text {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #e3f2fd;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 16px;
      font-size: 14px;
    }

    .info-icon {
      color: #1976d2;
    }

    .preview-box {
      background: #f5f5f5;
      padding: 12px;
      border-radius: 4px;
      margin-top: 16px;
      font-family: 'Courier New', monospace;
    }

    .merge-arrow {
      display: block;
      text-align: center;
      font-size: 32px;
      color: #2196f3;
      margin: 16px 0;
    }

    .warning-text {
      background: #fff3e0;
      padding: 12px;
      border-radius: 4px;
      border-left: 4px solid #ff9800;
      margin-top: 16px;
      font-size: 13px;
    }

    mat-action-row {
      padding: 16px 0 0 0;
    }
  `]
})
export class SystemConfigComponent implements OnInit {
  // Servicio HTTP y estado de permisos
  private http = inject(HttpClient);
  authService = inject(AuthService);

  // Estado UI
  hidePassword = signal(true);
  
  // Configuracion SMTP
  smtpConfig = signal({
    host: '',
    port: 587,
    user: '',
    pass: '',
    secure: false,
    fromEmail: 'noreply@shieldtrack.com',
    fromName: 'ShieldTrack Security'
  });

  // Configuracion general del sistema (mock/placeholder)
  config = signal({
    codePrefix: 'VULN',
    codeFormat: 'PREFIX-NNNNNN',
    mfaRequired: false,
    passwordExpiry: true,
    maxLoginAttempts: 5,
    sessionTimeout: 30,
    emailNotifications: true,
    smtpServer: 'smtp.gmail.com', // DEPRECATED
    smtpPort: 587, // DEPRECATED
    fromEmail: 'noreply@shieldtrack.com', // DEPRECATED
    autoBackup: true,
    backupFrequency: 'daily',
    retentionDays: 30,
    maxFileSize: 10,
    allowedFileTypes: 'pdf,png,jpg,jpeg,txt,doc,docx'
  });

  // Configuracion para fusion de proyectos
  mergeConfig = signal({
    sourceProject: '',
    targetProject: ''
  });

  // Configuracion de areas/tenants
  areaConfig = signal({
    requireAreaPerProject: false,
    autoCreateDefaultArea: true,
    areaCodePrefix: 'AREA',
    hierarchyLevels: 2
  });

  // Configuracion de tenant/cliente (favicon, logo, colores, etc)
  tenantConfig = signal({
    displayName: '',
    favicon: null as File | null,
    faviconPreview: '',
    logo: null as File | null,
    logoPreview: '',
    primaryColor: '#1976D2'
  });

  // Lista mock de proyectos para la UI
  projects = signal([
    { id: '1', name: 'Proyecto Web App' },
    { id: '2', name: 'Proyecto Móvil' },
    { id: '3', name: 'Proyecto API Rest' }
  ]);

  ngOnInit() {
    if (this.isOwner()) {
      this.loadSmtpConfig();
    }
    this.loadProjects();
  }

  loadProjects(): void {
    this.http.get<any[]>('http://localhost:3000/api/projects').subscribe({
      next: (projects) => {
        this.projects.set(projects.map(p => ({ id: p._id, name: p.name })));
      },
      error: (err) => console.error('Error loading projects:', err)
    });
  }

  loadSmtpConfig(): void {
    this.http.get<any>('http://localhost:3000/api/system-config/smtp').subscribe({
      next: (config) => {
        this.smtpConfig.set({
          host: config.smtp_host || '',
          port: config.smtp_port || 587,
          user: config.smtp_user || '', // Masked *******
          pass: config.smtp_pass || '', // Masked *******
          secure: config.smtp_secure || false,
          fromEmail: config.smtp_from_email || '',
          fromName: config.smtp_from_name || ''
        });
      },
      error: (err) => console.error('Error loading SMTP config:', err)
    });
  }

  saveSmtpConfig(): void {
    const data = {
      smtp_host: this.smtpConfig().host,
      smtp_port: this.smtpConfig().port,
      smtp_secure: this.smtpConfig().secure,
      smtp_user: this.smtpConfig().user,
      smtp_pass: this.smtpConfig().pass,
      smtp_from_email: this.smtpConfig().fromEmail,
      smtp_from_name: this.smtpConfig().fromName
    };

    // Validar si es una contraseña mascara
    if (data.smtp_pass && data.smtp_pass.includes('***')) {
        // TODO: Handle password update logic (send only if changed)
        // For now, API handles encryption, but we should not re-encrypt masked password
        // Backend should check if pass == '*******' then ignore update
    }

    console.log('📤 Guardando SMTP:', data);
    this.http.put('http://localhost:3000/api/system-config/smtp', data).subscribe({
      next: () => {
        alert('✅ Configuración SMTP guardada exitosamente');
      },
      error: (error) => {
        console.error('❌ Error saving SMTP:', error);
        alert(`❌ Error: ${error?.error?.message || 'Error al guardar'}`);
      }
    });
  }

  testSmtp(): void {
    this.http.post('http://localhost:3000/api/system-config/smtp/test', {}).subscribe({
      next: (res: any) => {
        if (res.success) {
          alert('✅ ' + res.message);
        } else {
          alert('❌ ' + res.message);
        }
      },
      error: (error) => {
        alert(`❌ Error de conexión: ${error?.error?.message || error.message}`);
      }
    });
  }

  isOwner(): boolean {
    // Permiso para configuracion global
    return this.authService.currentUser()?.role === 'OWNER';
  }

  generateCodePreview(): string {
    // Genera una vista previa segun formato seleccionado
    const prefix = this.config().codePrefix || 'VULN';
    const format = this.config().codeFormat;
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');

    switch (format) {
      case 'PREFIX-YYYY-NNNN':
        return `${prefix}-${year}-0001`;
      case 'PREFIX-MM-NNNN':
        return `${prefix}-${month}-0001`;
      default:
        return `${prefix}-000001`;
    }
  }

  resetConfirmation = '';

  resetDatabase(): void {
    if (this.resetConfirmation !== 'DELETE') return;

    if (confirm('☠️ ¿ESTÁS ABSOLUTAMENTE SEGURO? ESTA ACCIÓN NO SE PUEDE DESHACER.')) {
      this.http.delete(`${environment.apiUrl}/system-config/database/reset`, {
        body: { confirmation: 'DELETE' } // Delete requests with body need this syntax in HttpClient
      }).subscribe({
        next: (res: any) => {
          alert(`✅ ${res.message}. Se eliminaron ${JSON.stringify(res.details)} registros.`);
          this.resetConfirmation = '';
        },
        error: (error) => {
          console.error('Error resetting DB:', error);
          alert(`❌ Error: ${error.error?.message || 'Error desconocido'}`);
        }
      });
    }
  }

  canMerge(): boolean {
    // Valida que ambos proyectos sean distintos
    const config = this.mergeConfig();
    return !!(config.sourceProject && config.targetProject && config.sourceProject !== config.targetProject);
  }

  mergeProjects(): void {
    // Accion destructiva; se confirma antes de ejecutar
    if (!this.canMerge()) return;
    
    const config = this.mergeConfig();
    const sourceProject = this.projects().find(p => p.id === config.sourceProject);
    const targetProject = this.projects().find(p => p.id === config.targetProject);

    const confirmMessage = `¿Estás seguro de fusionar estos proyectos?\n\n` +
      `📁 ORIGEN (será eliminado): ${sourceProject?.name}\n` +
      `📂 DESTINO (recibirá hallazgos): ${targetProject?.name}\n\n` +
      `⚠️ Esta acción NO se puede deshacer. Todos los hallazgos del proyecto origen se moverán al destino.`;

    if (confirm(confirmMessage)) {
      console.log('Fusionando proyectos:', this.mergeConfig());
      
      this.http.post('http://localhost:3000/api/projects/merge', {
        sourceProjectId: config.sourceProject,
        targetProjectId: config.targetProject
      }).subscribe({
        next: (response: any) => {
          console.log('✅ Fusión exitosa:', response);
          alert(`✅ Proyectos fusionados exitosamente!\n\n` +
            `Hallazgos movidos: ${response.findingsMoved}\n` +
            `Nuevo total en "${response.targetProject.name}": ${response.targetProject.newFindingsCount}`);
          
          // Limpiar selección
          this.mergeConfig.update(cfg => ({ sourceProject: '', targetProject: '' }));
          
          // Recargar lista de proyectos
          this.loadProjects();
        },
        error: (error) => {
          console.error('❌ Error fusionando proyectos:', error);
          alert(`❌ Error al fusionar proyectos:\n${error.error?.message || 'Error desconocido'}`);
        }
      });
    }
  }

  saveConfig(): void {
    // Guarda configuracion general en backend
    console.log('📤 Guardando configuración:', this.config());
    this.http.put('/api/system-config', this.config()).subscribe({
      next: () => {
        console.log('✅ Configuración guardada');
        alert('✅ Configuración guardada exitosamente');
      },
      error: (error) => {
        console.error('❌ Error al guardar configuración:', error);
        alert(`❌ Error: ${error?.error?.message || 'No se pudo guardar la configuración'}`);
      }
    });
  }

  saveAreaConfig(): void {
    // Guarda configuracion de areas en backend
    console.log('📤 Guardando configuración de áreas:', this.areaConfig());
    this.http.put('/api/system-config/areas', this.areaConfig()).subscribe({
      next: () => {
        console.log('✅ Configuración de áreas guardada');
        alert('✅ Configuración de áreas guardada exitosamente');
      },
      error: (error) => {
        console.error('❌ Error al guardar configuración de áreas:', error);
        alert(`❌ Error: ${error?.error?.message || 'No se pudo guardar'}`);
      }
    });
  }

  // MÉTODOS PARA CONFIGURACIÓN DE TENANT
  
  onFaviconSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        this.tenantConfig.update(config => ({
          ...config,
          favicon: file,
          faviconPreview: preview
        }));
      };
      reader.readAsDataURL(file);
    }
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        this.tenantConfig.update(config => ({
          ...config,
          logo: file,
          logoPreview: preview
        }));
      };
      reader.readAsDataURL(file);
    }
  }

  saveTenantConfig(): void {
    // Guarda configuracion de tenant (favicon, logo, colores) en backend
    console.log('📤 Guardando configuración de tenant:', this.tenantConfig());
    
    const formData = new FormData();
    formData.append('displayName', this.tenantConfig().displayName || '');
    formData.append('primaryColor', this.tenantConfig().primaryColor || '#1976D2');
    
    const favicon = this.tenantConfig().favicon;
    if (favicon) {
      formData.append('favicon', favicon);
    }
    
    const logo = this.tenantConfig().logo;
    if (logo) {
      formData.append('logo', logo);
    }

    this.http.post('/api/clients/me/branding', formData).subscribe({
      next: (response: any) => {
        console.log('✅ Configuración de tenant guardada:', response);
        alert('✅ Configuración de tenant guardada exitosamente');
        
        // Actualizar localStorage con nuevo color primario
        if (this.tenantConfig().primaryColor) {
          localStorage.setItem('primaryColor', this.tenantConfig().primaryColor);
        }
      },
      error: (error) => {
        console.error('❌ Error al guardar configuración de tenant:', error);
        alert(`❌ Error: ${error?.error?.message || 'No se pudo guardar la configuración'}`);
      }
    });
  }
}

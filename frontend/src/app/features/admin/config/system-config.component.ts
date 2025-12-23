import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

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

        <!-- CONFIGURACIÓN DE ÁREAS/TENANTS -->
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>
              <mat-icon>domain</mat-icon>
              Áreas y Tenants
            </mat-panel-title>
            <mat-panel-description>
              Gestión de áreas y configuración por tenant
            </mat-panel-description>
          </mat-expansion-panel-header>

          <p class="info-text">
            <mat-icon class="info-icon">info</mat-icon>
            Configura cómo se organizan las áreas en tu tenant
          </p>

          <div class="form-field">
            <mat-slide-toggle [(ngModel)]="areaConfig().requireAreaPerProject">
              Requerir área para cada proyecto
            </mat-slide-toggle>
            <p class="hint-text">Los proyectos deberán tener un área asignada</p>
          </div>

          <div class="form-field">
            <mat-slide-toggle [(ngModel)]="areaConfig().autoCreateDefaultArea">
              Crear área "General" automáticamente
            </mat-slide-toggle>
            <p class="hint-text">Para nuevos clientes sin áreas definidas</p>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Prefijo de código de área</mat-label>
            <input matInput [(ngModel)]="areaConfig().areaCodePrefix" placeholder="AREA">
            <mat-hint>Se usará en reportes: AREA-001, AREA-002</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Niveles de jerarquía</mat-label>
            <mat-select [(ngModel)]="areaConfig().hierarchyLevels">
              <mat-option [value]="1">1 nivel (Cliente → Proyecto)</mat-option>
              <mat-option [value]="2">2 niveles (Cliente → Área → Proyecto)</mat-option>
              <mat-option [value]="3">3 niveles (Cliente → Área → Sub-área → Proyecto)</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-action-row>
            <button mat-button color="primary" (click)="saveAreaConfig()">Guardar</button>
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
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Servidor SMTP</mat-label>
            <input matInput [(ngModel)]="config().smtpServer" placeholder="smtp.gmail.com">
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Puerto SMTP</mat-label>
            <input matInput type="number" [(ngModel)]="config().smtpPort" placeholder="587">
          </mat-form-field>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Email remitente</mat-label>
            <input matInput type="email" [(ngModel)]="config().fromEmail" placeholder="noreply@shieldtrack.com">
          </mat-form-field>

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
    }

    @media (max-width: 900px) {
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
export class SystemConfigComponent {
  // Servicio HTTP y estado de permisos
  private http = inject(HttpClient);
  authService = inject(AuthService);

  // Configuracion general del sistema (mock/placeholder)
  config = signal({
    codePrefix: 'VULN',
    codeFormat: 'PREFIX-NNNNNN',
    mfaRequired: false,
    passwordExpiry: true,
    maxLoginAttempts: 5,
    sessionTimeout: 30,
    emailNotifications: true,
    smtpServer: 'smtp.gmail.com',
    smtpPort: 587,
    fromEmail: 'noreply@shieldtrack.com',
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

  // Lista mock de proyectos para la UI
  projects = signal([
    { id: '1', name: 'Proyecto Web App' },
    { id: '2', name: 'Proyecto Móvil' },
    { id: '3', name: 'Proyecto API Rest' }
  ]);

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

  canMerge(): boolean {
    // Valida que ambos proyectos sean distintos
    const config = this.mergeConfig();
    return !!(config.sourceProject && config.targetProject && config.sourceProject !== config.targetProject);
  }

  mergeProjects(): void {
    // Accion destructiva; se confirma antes de ejecutar
    if (!this.canMerge()) return;
    
    if (confirm('¿Estás seguro de fusionar estos proyectos? Esta acción NO se puede deshacer.')) {
      console.log('Fusionando proyectos:', this.mergeConfig());
      // TODO: Implementar llamada al backend
      alert('Proyectos fusionados exitosamente');
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
}

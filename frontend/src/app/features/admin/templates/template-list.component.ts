import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { TemplateDialogComponent } from './template-dialog.component';

@Component({
    selector: 'app-template-list',
    imports: [
        CommonModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatChipsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDialogModule,
        MatSnackBarModule,
        MatTooltipModule,
        FormsModule
    ],
    template: `
    <div class="template-container">
      <div class="header">
        <h1>� Plantillas de Vulnerabilidades</h1>
        <button mat-raised-button color="primary" (click)="openTemplateDialog()">
          <mat-icon>add</mat-icon>
          Nueva Plantilla
        </button>
      </div>

      <div class="filters">
        <mat-form-field appearance="outline">
          <mat-label>Buscar</mat-label>
          <input matInput [ngModel]="searchTerm()" 
                 (ngModelChange)="searchTerm.set($event); applyFilters()"
                 placeholder="Nombre, CWE...">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Severidad</mat-label>
          <mat-select [ngModel]="severityFilter()" 
                      (ngModelChange)="severityFilter.set($event); applyFilters()">
            <mat-option value="">Todas</mat-option>
            <mat-option value="CRITICAL">Crítica</mat-option>
            <mat-option value="HIGH">Alta</mat-option>
            <mat-option value="MEDIUM">Media</mat-option>
            <mat-option value="LOW">Baja</mat-option>
            <mat-option value="INFO">Informativa</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      @if (loading()) {
        <p class="loading">Cargando plantillas...</p>
      } @else {
        <table mat-table [dataSource]="filteredTemplates()" class="templates-table">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nombre</th>
            <td mat-cell *matCellDef="let template">
              <strong>{{ template.name }}</strong>
              @if (template.cweId) {
                <br><small class="cwe-tag">{{ template.cweId }}</small>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="severity">
            <th mat-header-cell *matHeaderCellDef>Severidad</th>
            <td mat-cell *matCellDef="let template">
              <mat-chip [class]="'severity-' + template.severity.toLowerCase()">
                {{ getSeverityName(template.severity) }}
              </mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="cvss">
            <th mat-header-cell *matHeaderCellDef>CVSS</th>
            <td mat-cell *matCellDef="let template">
              @if (template.cvssScore) {
                <span class="cvss-score">{{ template.cvssScore }}</span>
              } @else {
                <span class="text-muted">N/A</span>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="description">
            <th mat-header-cell *matHeaderCellDef>Descripción</th>
            <td mat-cell *matCellDef="let template">
              <div class="description-preview">
                {{ template.description | slice:0:100 }}{{ template.description.length > 100 ? '...' : '' }}
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Acciones</th>
            <td mat-cell *matCellDef="let template">
              <button mat-icon-button (click)="openTemplateDialog(template)" 
                      matTooltip="Editar plantilla">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button (click)="duplicateTemplate(template)"
                      matTooltip="Duplicar plantilla">
                <mat-icon>content_copy</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="deleteTemplate(template)"
                      matTooltip="Eliminar">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        @if (filteredTemplates().length === 0) {
          <p class="no-data">No hay plantillas para mostrar</p>
        }
      }
    </div>
  `,
    styles: [`
    .template-container {
      padding: 0;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 500;
    }

    .filters {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
    }

    .filters mat-form-field {
      flex: 1;
      max-width: 300px;
    }

    .templates-table {
      width: 100%;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .templates-table th {
      font-weight: 600;
      background: #f5f5f5;
    }

    .cwe-tag {
      color: #666;
      background: #f0f0f0;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 11px;
    }

    .severity-critical {
      background: #d32f2f;
      color: white;
    }

    .severity-high {
      background: #f57c00;
      color: white;
    }

    .severity-medium {
      background: #fbc02d;
      color: #333;
    }

    .severity-low {
      background: #388e3c;
      color: white;
    }

    .severity-info {
      background: #1976d2;
      color: white;
    }

    .cvss-score {
      font-weight: 600;
      color: #1976d2;
    }

    .description-preview {
      font-size: 13px;
      color: #666;
      line-height: 1.4;
    }

    .text-muted {
      color: #999;
    }

    .loading, .no-data {
      text-align: center;
      padding: 48px;
      color: #666;
    }
  `]
})
export class TemplateListComponent implements OnInit {
  // Servicios de red y UI
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  
  // Estado local y filtros
  templates = signal<any[]>([]);
  filteredTemplates = signal<any[]>([]);
  loading = signal(false);
  searchTerm = signal('');
  severityFilter = signal('');
  
  displayedColumns = ['name', 'severity', 'cvss', 'description', 'actions'];
  private API_URL = `${environment.apiUrl}/templates`;

  ngOnInit(): void {
    // Carga inicial de catalogo de plantillas
    this.loadTemplates();
  }

  loadTemplates(): void {
    // Intenta cargar desde backend; si falla, usa templates por defecto
    this.loading.set(true);
    this.http.get<any[]>(this.API_URL).subscribe({
      next: (data) => {
        this.templates.set(data.length > 0 ? data : this.getDefaultTemplates());
        this.filteredTemplates.set(this.templates());
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar plantillas:', err);
        // Si hay error, usar plantillas por defecto
        this.templates.set(this.getDefaultTemplates());
        this.filteredTemplates.set(this.templates());
        this.loading.set(false);
      }
    });
  }

  getDefaultTemplates(): any[] {
    // Fallback local para no bloquear la UI en ambientes sin datos
    return [
      {
        _id: '1',
        name: 'SQL Injection',
        severity: 'CRITICAL',
        cvssScore: 9.8,
        cweId: 'CWE-89',
        description: 'Vulnerabilidad de inyección SQL que permite a un atacante manipular consultas a la base de datos mediante la inserción de código SQL malicioso en campos de entrada no validados.',
        impact: 'Acceso no autorizado a datos sensibles, modificación o eliminación de información, y potencial compromiso completo del sistema.',
        recommendation: '1. Usar consultas preparadas (prepared statements)\n2. Validar y sanitizar todas las entradas\n3. Aplicar el principio de menor privilegio en cuentas de BD\n4. Implementar WAF',
        references: ['https://owasp.org/www-community/attacks/SQL_Injection', 'https://cwe.mitre.org/data/definitions/89.html']
      },
      {
        _id: '2',
        name: 'Cross-Site Scripting (XSS) Reflejado',
        severity: 'HIGH',
        cvssScore: 7.5,
        cweId: 'CWE-79',
        description: 'XSS reflejado donde el script malicioso es incluido en una solicitud HTTP y reflejado por el servidor en la respuesta sin validación adecuada.',
        impact: 'Robo de cookies de sesión, redirección a sitios maliciosos, modificación del contenido visible para el usuario.',
        recommendation: '1. Codificar todas las salidas\n2. Usar Content Security Policy (CSP)\n3. Validar y sanitizar entradas\n4. Implementar HttpOnly en cookies',
        references: ['https://owasp.org/www-community/attacks/xss/']
      },
      {
        _id: '3',
        name: 'Cross-Site Scripting (XSS) Almacenado',
        severity: 'CRITICAL',
        cvssScore: 9.0,
        cweId: 'CWE-79',
        description: 'XSS persistente donde el script malicioso se almacena en el servidor (BD, archivos) y se ejecuta cada vez que se accede al contenido comprometido.',
        impact: 'Compromiso masivo de usuarios, robo de credenciales, distribución de malware, defacement persistente.',
        recommendation: '1. Validación estricta de entradas antes de almacenar\n2. Codificación de salidas al renderizar\n3. CSP restrictivo\n4. Auditorías regulares de contenido almacenado',
        references: ['https://owasp.org/www-community/attacks/xss/']
      },
      {
        _id: '4',
        name: 'Cross-Site Request Forgery (CSRF)',
        severity: 'MEDIUM',
        cvssScore: 6.5,
        cweId: 'CWE-352',
        description: 'Ataque que fuerza a un usuario autenticado a ejecutar acciones no deseadas en una aplicación web donde está actualmente autenticado.',
        impact: 'Ejecución de acciones no autorizadas como transferencias, cambios de configuración, o modificación de datos en nombre del usuario.',
        recommendation: '1. Implementar tokens CSRF\n2. Verificar el header Referer\n3. Usar SameSite en cookies\n4. Requerir reautenticación para acciones críticas',
        references: ['https://owasp.org/www-community/attacks/csrf']
      },
      {
        _id: '5',
        name: 'Path Traversal / Directory Traversal',
        severity: 'HIGH',
        cvssScore: 8.2,
        cweId: 'CWE-22',
        description: 'Vulnerabilidad que permite acceder a archivos y directorios fuera del directorio raíz mediante secuencias como ../ en parámetros de archivo.',
        impact: 'Acceso a archivos sensibles del sistema, lectura de configuraciones, contraseñas, y potencial ejecución de código.',
        recommendation: '1. Validar y normalizar rutas de archivo\n2. Usar listas blancas de archivos permitidos\n3. Implementar chroot o contenedores\n4. Nunca confiar en entrada del usuario para rutas',
        references: ['https://owasp.org/www-community/attacks/Path_Traversal']
      },
      {
        _id: '6',
        name: 'Autenticación Débil',
        severity: 'HIGH',
        cvssScore: 7.8,
        cweId: 'CWE-287',
        description: 'Implementación inadecuada de mecanismos de autenticación que permite bypass o acceso no autorizado.',
        impact: 'Acceso no autorizado a cuentas de usuario, escalación de privilegios, compromiso de sesiones.',
        recommendation: '1. Implementar MFA\n2. Políticas de contraseñas robustas\n3. Bloqueo tras intentos fallidos\n4. Tokens de sesión seguros',
        references: ['https://owasp.org/www-project-top-ten/2017/A2_2017-Broken_Authentication']
      }
    ];
  }

  applyFilters(): void {
    // Filtra por texto y severidad
    let filtered = this.templates();

    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(search) ||
        t.cweId?.toLowerCase().includes(search)
      );
    }

    const severity = this.severityFilter();
    if (severity) {
      filtered = filtered.filter(t => t.severity === severity);
    }

    this.filteredTemplates.set(filtered);
  }

  openTemplateDialog(template?: any): void {
    // Abre dialogo de alta/edicion
    const dialogRef = this.dialog.open(TemplateDialogComponent, {
      width: '700px',
      maxHeight: '90vh',
      data: template
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTemplates();
      }
    });
  }

  duplicateTemplate(template: any): void {
    // Crea una copia local y reutiliza el dialogo de edicion
    const duplicated = { 
      ...template, 
      _id: undefined,
      name: `${template.name} (Copia)` 
    };
    this.openTemplateDialog(duplicated);
  }

  deleteTemplate(template: any): void {
    // Eliminacion con confirmacion
    const confirmed = confirm(`¿Está seguro de eliminar la plantilla "${template.name}"?`);
    if (!confirmed) return;

    this.http.delete(`${this.API_URL}/${template._id}`).subscribe({
      next: () => {
        this.snackBar.open('Plantilla eliminada', 'Cerrar', { duration: 3000 });
        this.loadTemplates();
      },
      error: (err) => {
        console.error('Error al eliminar plantilla:', err);
        this.snackBar.open('Error al eliminar plantilla', 'Cerrar', { duration: 3000 });
      }
    });
  }

  getSeverityName(severity: string): string {
    // Traduce severidad a etiqueta legible
    const map: Record<string, string> = {
      'CRITICAL': 'Crítica',
      'HIGH': 'Alta',
      'MEDIUM': 'Media',
      'LOW': 'Baja',
      'INFO': 'Info'
    };
    return map[severity] || severity;
  }
}

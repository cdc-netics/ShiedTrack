import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { FindingService } from '../../../core/services/finding.service';
import { ProjectService } from '../../../core/services/project.service';
import { environment } from '../../../../environments/environment';

/**
 * Componente de Lista de Hallazgos
 * Tabla con filtros por severidad, estado y búsqueda
 * Colores visuales según criticidad
 */
@Component({
  selector: 'app-finding-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCardModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatMenuModule
  ],
  template: `
    <div class="finding-list-container">
      <mat-card class="header-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>bug_report</mat-icon>
            Gestión de Hallazgos
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="actions-bar">
            <button mat-raised-button color="primary" routerLink="/findings/new">
              <mat-icon>add</mat-icon>
              Nuevo Hallazgo
            </button>
            
            <div class="filters">
              <mat-form-field appearance="outline" class="filter-field">
                <mat-label>Buscar</mat-label>
                <input matInput [ngModel]="searchTerm()" 
                       (ngModelChange)="searchTerm.set($event); applyFilters()"
                       placeholder="Código, título o CVE...">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filter-field">
                <mat-label>Cliente</mat-label>
                <mat-select [ngModel]="clientFilter()" (selectionChange)="onClientChange($event.value)">
                  <mat-option value="">Todos</mat-option>
                  @for (client of clients(); track client._id) {
                    <mat-option [value]="client._id">{{ client.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="filter-field">
                <mat-label>Proyecto</mat-label>
                <mat-select [ngModel]="projectFilter()" (selectionChange)="onProjectChange($event.value)" [disabled]="!clientFilter()">
                  <mat-option value="">Todos</mat-option>
                  @for (project of projects(); track project._id) {
                    <mat-option [value]="project._id">{{ project.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="filter-field">
                <mat-label>Severidad</mat-label>
                <mat-select [ngModel]="severityFilter()" (ngModelChange)="severityFilter.set($event); applyFilters()">
                  <mat-option value="">Todas</mat-option>
                  <mat-option value="CRITICAL">Crítica</mat-option>
                  <mat-option value="HIGH">Alta</mat-option>
                  <mat-option value="MEDIUM">Media</mat-option>
                  <mat-option value="LOW">Baja</mat-option>
                  <mat-option value="INFO">Informativa</mat-option>
                </mat-select>
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="filter-field">
                <mat-label>Estado</mat-label>
                <mat-select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event); applyFilters()">
                  <mat-option value="">Todos</mat-option>
                  <mat-option value="OPEN">Abierto</mat-option>
                  <mat-option value="IN_PROGRESS">En Progreso</mat-option>
                  <mat-option value="RETEST">Retest</mat-option>
                  <mat-option value="CLOSED">Cerrado</mat-option>
                </mat-select>
              </mat-form-field>
              
              <button mat-icon-button (click)="loadFindings()" matTooltip="Actualizar">
                <mat-icon>refresh</mat-icon>
              </button>

              <button mat-icon-button [matMenuTriggerFor]="exportMenu" matTooltip="Exportar" [disabled]="!clientFilter() && !projectFilter()">
                <mat-icon>download</mat-icon>
              </button>
              <mat-menu #exportMenu="matMenu">
                @if (projectFilter()) {
                  <button mat-menu-item (click)="exportProject('excel')">
                    <mat-icon>table_view</mat-icon>
                    <span>Excel</span>
                  </button>
                  <button mat-menu-item (click)="exportProject('csv')">
                    <mat-icon>description</mat-icon>
                    <span>CSV</span>
                  </button>
                } @else if (clientFilter()) {
                  <button mat-menu-item (click)="exportClient()">
                    <mat-icon>folder_zip</mat-icon>
                    <span>Portfolio (ZIP)</span>
                  </button>
                }
              </mat-menu>
            </div>
          </div>
          
          <!-- Resumen de estadísticas -->
          <div class="stats-summary">
            <div class="stat-item critical">
              <span class="count">{{ getCountBySeverity('CRITICAL') }}</span>
              <span class="label">Críticos</span>
            </div>
            <div class="stat-item high">
              <span class="count">{{ getCountBySeverity('HIGH') }}</span>
              <span class="label">Altos</span>
            </div>
            <div class="stat-item medium">
              <span class="count">{{ getCountBySeverity('MEDIUM') }}</span>
              <span class="label">Medios</span>
            </div>
            <div class="stat-item low">
              <span class="count">{{ getCountBySeverity('LOW') }}</span>
              <span class="label">Bajos</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="table-card">
        @if (findingService.loading()) {
          <div class="loading-container">
            <mat-spinner></mat-spinner>
            <p>Cargando hallazgos...</p>
          </div>
        } @else if (filteredFindings().length === 0) {
          <div class="empty-state">
            <mat-icon>search_off</mat-icon>
            <h3>No se encontraron hallazgos</h3>
            <p>Intenta ajustar los filtros o crear un nuevo hallazgo</p>
            <button mat-raised-button color="primary" routerLink="/findings/new">
              <mat-icon>add</mat-icon>
              Crear Hallazgo
            </button>
          </div>
        } @else {
          <table mat-table [dataSource]="filteredFindings()" class="findings-table">
            <!-- Columna Código -->
            <ng-container matColumnDef="code">
              <th mat-header-cell *matHeaderCellDef>Código</th>
              <td mat-cell *matCellDef="let finding">
                <div class="code-cell">
                  <strong>{{ finding.code }}</strong>
                  @if (finding.internal_code) {
                    <small>{{ finding.internal_code }}</small>
                  }
                </div>
              </td>
            </ng-container>

            <!-- Columna Título -->
            <ng-container matColumnDef="title">
              <th mat-header-cell *matHeaderCellDef>Título</th>
              <td mat-cell *matCellDef="let finding">
                <div class="title-cell">
                  <span class="title">{{ finding.title }}</span>
                  @if (finding.cve_id) {
                    <mat-chip class="cve-chip">{{ finding.cve_id }}</mat-chip>
                  }
                </div>
              </td>
            </ng-container>

            <!-- Columna Severidad -->
            <ng-container matColumnDef="severity">
              <th mat-header-cell *matHeaderCellDef>Severidad</th>
              <td mat-cell *matCellDef="let finding">
                <mat-chip [class]="'severity-chip severity-' + finding.severity.toLowerCase()">
                  <mat-icon>{{ getSeverityIcon(finding.severity) }}</mat-icon>
                  {{ getSeverityLabel(finding.severity) }}
                </mat-chip>
              </td>
            </ng-container>

            <!-- Columna CVSS -->
            <ng-container matColumnDef="cvss">
              <th mat-header-cell *matHeaderCellDef>CVSS</th>
              <td mat-cell *matCellDef="let finding">
                <div class="cvss-score" [class]="'cvss-' + getCvssLevel(finding.cvss_score)">
                  {{ finding.cvss_score?.toFixed(1) || 'N/A' }}
                </div>
              </td>
            </ng-container>

            <!-- Columna Estado -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let finding">
                <mat-chip [class]="'status-chip status-' + finding.status.toLowerCase()">
                  {{ getStatusLabel(finding.status) }}
                </mat-chip>
              </td>
            </ng-container>

            <!-- Columna Proyecto -->
            <ng-container matColumnDef="project">
              <th mat-header-cell *matHeaderCellDef>Proyecto</th>
              <td mat-cell *matCellDef="let finding">
                {{ getProjectName(finding.projectId) }}
              </td>
            </ng-container>

            <!-- Columna Fecha -->
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Fecha</th>
              <td mat-cell *matCellDef="let finding">
                <small>{{ formatDate(finding.createdAt) }}</small>
              </td>
            </ng-container>

            <!-- Columna Acciones -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Acciones</th>
              <td mat-cell *matCellDef="let finding">
                <button mat-icon-button [routerLink]="['/findings', finding._id]" 
                        matTooltip="Ver detalles">
                  <mat-icon>visibility</mat-icon>
                </button>
                <button mat-icon-button [routerLink]="['/findings', finding._id, 'edit']"
                        matTooltip="Editar">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button [routerLink]="['/findings', finding._id, 'timeline']"
                        matTooltip="Ver timeline">
                  <mat-icon>history</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" 
                [class.row-critical]="row.severity === 'CRITICAL'"></tr>
          </table>
        }
      </mat-card>
    </div>
  `,
  styles: [`
    .finding-list-container {
      padding: 24px;
      max-width: 1800px;
      margin: 0 auto;
    }

    .header-card {
      margin-bottom: 24px;
    }

    .actions-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      margin-top: 16px;
    }

    .filters {
      display: flex;
      gap: 16px;
      align-items: center;
    }

    .filter-field {
      width: 180px;
    }

    .stats-summary {
      display: flex;
      gap: 24px;
      margin-top: 24px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px 24px;
      border-radius: 8px;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .stat-item .count {
      font-size: 32px;
      font-weight: 700;
      line-height: 1;
    }

    .stat-item .label {
      font-size: 12px;
      color: #757575;
      margin-top: 4px;
    }

    .stat-item.critical .count { color: #d32f2f; }
    .stat-item.high .count { color: #f57c00; }
    .stat-item.medium .count { color: #fbc02d; }
    .stat-item.low .count { color: #388e3c; }

    .table-card {
      overflow-x: auto;
    }

    .findings-table {
      width: 100%;
    }

    .row-critical {
      background: #ffebee !important;
    }

    .code-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .code-cell small {
      font-size: 11px;
      color: #757575;
    }

    .title-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .title-cell .title {
      font-weight: 500;
      color: #212121;
    }

    .cve-chip {
      font-size: 10px;
      min-height: 20px;
      background: #e1bee7;
      color: #6a1b9a;
      width: fit-content;
    }

    .severity-chip {
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .severity-chip mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .severity-chip.severity-critical {
      background: #d32f2f;
      color: white;
    }

    .severity-chip.severity-high {
      background: #f57c00;
      color: white;
    }

    .severity-chip.severity-medium {
      background: #fbc02d;
      color: #212121;
    }

    .severity-chip.severity-low {
      background: #388e3c;
      color: white;
    }

    .severity-chip.severity-info {
      background: #1976d2;
      color: white;
    }

    .cvss-score {
      font-weight: 700;
      font-size: 16px;
      padding: 4px 12px;
      border-radius: 4px;
      text-align: center;
      width: 50px;
    }

    .cvss-score.cvss-critical {
      background: #d32f2f;
      color: white;
    }

    .cvss-score.cvss-high {
      background: #f57c00;
      color: white;
    }

    .cvss-score.cvss-medium {
      background: #fbc02d;
      color: #212121;
    }

    .cvss-score.cvss-low {
      background: #388e3c;
      color: white;
    }

    .status-chip {
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
    }

    .status-chip.status-open {
      background: #f44336;
      color: white;
    }

    .status-chip.status-in_progress {
      background: #ff9800;
      color: white;
    }

    .status-chip.status-retest {
      background: #2196f3;
      color: white;
    }

    .status-chip.status-closed {
      background: #4caf50;
      color: white;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      gap: 16px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px;
      text-align: center;
      gap: 16px;
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #bdbdbd;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  `]
})
export class FindingListComponent implements OnInit {
  // Servicio para traer hallazgos y estado de carga
  findingService = inject(FindingService);
  projectService = inject(ProjectService);
  http = inject(HttpClient);
  
  // Columnas visibles de la tabla
  displayedColumns = ['code', 'title', 'severity', 'cvss', 'status', 'project', 'date', 'actions'];
  
  // Estado local de filtros y resultados
  searchTerm = signal('');
  severityFilter = signal('');
  statusFilter = signal('');
  clientFilter = signal('');
  projectFilter = signal('');
  
  clients = signal<any[]>([]);
  projects = signal<any[]>([]);
  
  filteredFindings = signal<any[]>([]);

  private CLIENTS_URL = `${environment.apiUrl}/clients`;

  ngOnInit() {
    // Carga inicial del listado
    this.loadFindings();
    this.loadClients();
  }

  loadClients() {
    this.http.get<any[]>(this.CLIENTS_URL).subscribe({
      next: (clients) => this.clients.set(clients),
      error: (err) => console.error('Error loading clients', err)
    });
  }

  onClientChange(clientId: string) {
    this.clientFilter.set(clientId);
    this.projectFilter.set('');
    this.projects.set([]);
    
    if (clientId) {
      this.projectService.loadProjects({ clientId }).subscribe(projects => {
        this.projects.set(projects);
        this.applyFilters();
      });
    } else {
      this.applyFilters();
    }
  }

  onProjectChange(projectId: string) {
    this.projectFilter.set(projectId);
    this.applyFilters();
  }

  loadFindings() {
    // Consulta al servicio y recalcula filtros locales
    this.findingService.loadFindings().subscribe(() => {
      this.applyFilters();
    });
  }

  applyFilters() {
    // Filtros combinados por texto, severidad y estado
    let findings = this.findingService.findings();
    
    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      findings = findings.filter(f => 
        f.code?.toLowerCase().includes(term) ||
        f.title?.toLowerCase().includes(term) ||
        f.cweId?.toLowerCase().includes(term)
      );
    }
    
    if (this.severityFilter()) {
      findings = findings.filter(f => f.severity === this.severityFilter());
    }
    
    if (this.statusFilter()) {
      findings = findings.filter(f => f.status === this.statusFilter());
    }

    if (this.projectFilter()) {
      findings = findings.filter(f => {
        const pId = typeof f.projectId === 'string' ? f.projectId : f.projectId._id;
        return pId === this.projectFilter();
      });
    } else if (this.clientFilter()) {
      // Filter by client
      // We use the loaded projects for this client to filter findings
      const clientProjectIds = this.projects().map(p => p._id);
      findings = findings.filter(f => {
        const pId = typeof f.projectId === 'string' ? f.projectId : f.projectId._id;
        return clientProjectIds.includes(pId);
      });
    }
    
    this.filteredFindings.set(findings);
  }

  exportProject(format: 'excel' | 'csv') {
    const projectId = this.projectFilter();
    if (!projectId) return;
    
    const url = `${environment.apiUrl}/export/project/${projectId}/${format}`;
    window.open(url, '_blank');
  }

  exportClient() {
    const clientId = this.clientFilter();
    if (!clientId) return;
    
    const url = `${environment.apiUrl}/export/client/${clientId}/portfolio`;
    window.open(url, '_blank');
  }

  getCountBySeverity(severity: string): number {
    // Recuento rapido para tarjetas de resumen
    return this.findingService.findings().filter(f => f.severity === severity).length;
  }

  getSeverityLabel(severity: string): string {
    // Traduce severidad a etiqueta legible
    const labels: any = {
      'CRITICAL': 'Crítica',
      'HIGH': 'Alta',
      'MEDIUM': 'Media',
      'LOW': 'Baja',
      'INFO': 'Info'
    };
    return labels[severity] || severity;
  }

  getSeverityIcon(severity: string): string {
    // Icono visual por severidad
    const icons: any = {
      'CRITICAL': 'dangerous',
      'HIGH': 'warning',
      'MEDIUM': 'error_outline',
      'LOW': 'info',
      'INFO': 'info_outline'
    };
    return icons[severity] || 'circle';
  }

  getCvssLevel(score: number): string {
    // Clasifica CVSS en rangos para estilos
    if (score >= 9.0) return 'critical';
    if (score >= 7.0) return 'high';
    if (score >= 4.0) return 'medium';
    return 'low';
  }

  getStatusLabel(status: string): string {
    // Traduce estados internos a texto
    const labels: any = {
      'OPEN': 'Abierto',
      'IN_PROGRESS': 'En Progreso',
      'RETEST': 'Retest',
      'CLOSED': 'Cerrado'
    };
    return labels[status] || status;
  }

  getProjectName(projectId: any): string {
    // Normaliza si el proyecto viene poblado o solo como id
    if (typeof projectId === 'string') return 'Proyecto';
    return projectId?.name || 'N/A';
  }

  formatDate(date: any): string {
    // Formato local de fechas opcionales
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-ES');
  }
}

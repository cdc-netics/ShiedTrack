import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatBadgeModule } from '@angular/material/badge';
import { SelectionModel } from '@angular/cdk/collections';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { FindingService } from '../../../core/services/finding.service';
import { ProjectService } from '../../../core/services/project.service';
import { environment } from '../../../../environments/environment';

/**
 * Componente de Lista de Hallazgos
 * Tabla con filtros avanzados por severidad, estado, fecha, CVSS y búsqueda
 * Colores visuales según criticidad
 * Panel de filtros expandible con animaciones
 */
@Component({
  standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-finding-list',
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
        MatTooltipModule,
        MatProgressSpinnerModule,
        MatMenuModule,
        MatCheckboxModule,
        MatExpansionModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatBadgeModule
    ],
    template: `
    <div class="list-page ui-stack">
      <header class="ui-screen-toolbar">
        <h1 class="ui-screen-title">Hallazgos</h1>
      </header>

      <section class="ui-data-panel" aria-label="Filtros y resumen">
          <div class="finding-toolbar ui-cluster ui-cluster--between">
            <div class="ui-cluster">
              <button mat-raised-button color="primary" type="button" routerLink="/findings/new">
                <mat-icon aria-hidden="true">add</mat-icon>
                Nuevo hallazgo
              </button>

              @if (selection.hasValue()) {
                <button mat-raised-button color="warn" type="button" (click)="bulkClose()">
                  <mat-icon aria-hidden="true">done_all</mat-icon>
                  Cerrar ({{ selection.selected.length }})
                </button>
              }
            </div>
            
            <div class="finding-filters ui-cluster">
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
              
              <button mat-icon-button type="button" (click)="loadFindings()" matTooltip="Actualizar lista" aria-label="Actualizar lista">
                <mat-icon aria-hidden="true">refresh</mat-icon>
              </button>

              <button mat-icon-button type="button" [matMenuTriggerFor]="exportMenu" matTooltip="Exportar" [disabled]="!clientFilter() && !projectFilter()" aria-label="Exportar datos">
                <mat-icon aria-hidden="true">download</mat-icon>
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
          
          <div class="ui-stat-strip" aria-label="Conteo por severidad">
            <button type="button" class="ui-stat-pill ui-stat-pill--critical" (click)="quickFilterBySeverity('CRITICAL')">
              <span class="ui-stat-pill__count">{{ getCountBySeverity('CRITICAL') }}</span>
              <span class="ui-stat-pill__label">Críticos</span>
            </button>
            <button type="button" class="ui-stat-pill ui-stat-pill--high" (click)="quickFilterBySeverity('HIGH')">
              <span class="ui-stat-pill__count">{{ getCountBySeverity('HIGH') }}</span>
              <span class="ui-stat-pill__label">Altos</span>
            </button>
            <button type="button" class="ui-stat-pill ui-stat-pill--medium" (click)="quickFilterBySeverity('MEDIUM')">
              <span class="ui-stat-pill__count">{{ getCountBySeverity('MEDIUM') }}</span>
              <span class="ui-stat-pill__label">Medios</span>
            </button>
            <button type="button" class="ui-stat-pill ui-stat-pill--low" (click)="quickFilterBySeverity('LOW')">
              <span class="ui-stat-pill__count">{{ getCountBySeverity('LOW') }}</span>
              <span class="ui-stat-pill__label">Bajos</span>
            </button>
          </div>
      </section>

      <section class="ui-data-panel" aria-labelledby="findings-table-heading">
        <h2 id="findings-table-heading" class="sr-only">Tabla de hallazgos</h2>
        @if (findingService.loading()) {
          <div class="ui-loading-block">
            <mat-spinner aria-label="Cargando hallazgos"></mat-spinner>
            <p>Cargando hallazgos…</p>
          </div>
        } @else if (filteredFindings().length === 0) {
          <div class="ui-empty-state">
            <mat-icon aria-hidden="true">search_off</mat-icon>
            <p class="ui-empty-state__title">No se encontraron hallazgos</p>
            <p>Ajusta los filtros o crea un nuevo hallazgo.</p>
            <button mat-raised-button color="primary" type="button" routerLink="/findings/new">
              <mat-icon aria-hidden="true">add</mat-icon>
              Crear hallazgo
            </button>
          </div>
        } @else {
          <div class="ui-table-scroll">
          <table mat-table [dataSource]="filteredFindings()" class="findings-table">
            
            <!-- Checkbox Column -->
            <ng-container matColumnDef="select">
              <th mat-header-cell *matHeaderCellDef>
                <mat-checkbox (change)="$event ? toggleAllRows() : null"
                              [checked]="selection.hasValue() && isAllSelected()"
                              [indeterminate]="selection.hasValue() && !isAllSelected()">
                </mat-checkbox>
              </th>
              <td mat-cell *matCellDef="let row">
                <mat-checkbox (click)="$event.stopPropagation()"
                              (change)="$event ? selection.toggle(row) : null"
                              [checked]="selection.isSelected(row)">
                </mat-checkbox>
              </td>
            </ng-container>

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
                <button mat-icon-button [routerLink]="['/findings', finding._id]" (click)="$event.stopPropagation()"
                        matTooltip="Ver detalles">
                  <mat-icon>visibility</mat-icon>
                </button>
                <button mat-icon-button [routerLink]="['/findings', finding._id, 'edit']" (click)="$event.stopPropagation()"
                        matTooltip="Editar">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button [routerLink]="['/findings', finding._id, 'timeline']" (click)="$event.stopPropagation()"
                        matTooltip="Ver timeline">
                  <mat-icon>history</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                (click)="openFinding(row)"
                class="clickable-row"
                [class.row-critical]="row.severity === 'CRITICAL'"></tr>
          </table>
          </div>
        }
      </section>
    </div>
  `,
    styles: [`
    .finding-toolbar {
      align-items: flex-start;
      gap: 1rem;
    }

    .finding-filters {
      flex-wrap: wrap;
      max-width: 100%;
    }

    .filter-field {
      width: 160px;
    }

    .findings-table {
      width: 100%;
    }

    .ui-empty-state__title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1f2937;
    }

    .row-critical {
      background: #ffebee !important;
    }

    .clickable-row {
      cursor: pointer;
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

  `]
})
export class FindingListComponent implements OnInit {
  // Servicio para traer hallazgos y estado de carga
  findingService = inject(FindingService);
  projectService = inject(ProjectService);
  http = inject(HttpClient);
  route = inject(ActivatedRoute);
  private router = inject(Router);
  
  // Columnas visibles de la tabla
  displayedColumns = ['select', 'code', 'title', 'severity', 'cvss', 'status', 'project', 'date', 'actions'];
  selection = new SelectionModel<any>(true, []);
  
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

  /** Si todos los elementos filtrados están seleccionados */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.filteredFindings().length;
    return numSelected === numRows && numRows > 0;
  }

  /** Selecciona o deselecciona todas las filas */
  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.filteredFindings());
  }

  /** Cierra masivamente los hallazgos seleccionados */
  bulkClose() {
    const selectedIds = this.selection.selected
      .map(f => f._id || f.id)
      .filter(Boolean);
    if (!selectedIds.length) return;

    if (confirm(`¿Estás seguro de cerrar ${selectedIds.length} hallazgos?`)) {
      this.findingService.bulkClose(selectedIds).subscribe({
        next: () => {
          this.selection.clear();
          this.loadFindings();
          // Opcional: mostrar notificación de éxito
        },
        error: (err) => console.error('Error closing findings', err)
      });
    }
  }

  ngOnInit() {
    // Carga inicial del listado
    this.loadFindings();
    this.loadClients();

    // Soporte para filtros por cliente vía query param (ej. /findings?clientId=...)
    const clientIdFromQuery = this.route.snapshot.queryParamMap.get('clientId');
    if (clientIdFromQuery) {
      this.onClientChange(clientIdFromQuery);
    }
    const severityFromQuery = this.route.snapshot.queryParamMap.get('severity');
    if (severityFromQuery) {
      this.severityFilter.set(String(severityFromQuery).toUpperCase());
      this.applyFilters();
    }
    const statusFromQuery = this.route.snapshot.queryParamMap.get('status');
    if (statusFromQuery) {
      this.statusFilter.set(String(statusFromQuery).toUpperCase());
      this.applyFilters();
    }
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
        const pId = typeof f.projectId === 'string' ? f.projectId : f.projectId?._id;
        return pId === this.projectFilter();
      });
    } else if (this.clientFilter() && this.projects().length > 0) {
      // Filter by client ONLY if we have loaded projects
      // Otherwise, don't apply client filter (avoid empty list)
      const clientProjectIds = this.projects().map(p => p._id);
      findings = findings.filter(f => {
        const pId = typeof f.projectId === 'string' ? f.projectId : f.projectId?._id;
        return clientProjectIds.includes(pId);
      });
    }
    
    this.filteredFindings.set(findings);
    console.log(`🔍 Filtros aplicados: ${findings.length} hallazgos mostrados de ${this.findingService.findings().length} totales`);
  }

  exportProject(format: 'excel' | 'csv') {
    const projectId = this.projectFilter();
    if (!projectId) {
      alert('Por favor selecciona un proyecto para exportar');
      return;
    }
    
    const url = `${environment.apiUrl}/export/project/${projectId}/${format}`;
    console.log('📥 Exportando proyecto:', projectId, 'formato:', format);
    
    // Usar HttpClient para incluir el token de autenticación
    this.http.get(url, { 
      responseType: 'blob',
      observe: 'response'
    }).subscribe({
      next: (response) => {
        console.log('✅ Respuesta recibida, tamaño:', response.body?.size, 'bytes');
        const blob = response.body;
        if (blob && blob.size > 0) {
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          const extension = format === 'excel' ? 'xlsx' : 'csv';
          link.download = `proyecto_${projectId}_${Date.now()}.${extension}`;
          link.click();
          window.URL.revokeObjectURL(downloadUrl);
        } else {
          console.error('❌ Archivo vacío recibido');
          alert('El archivo exportado está vacío. Verifica que el proyecto tenga hallazgos.');
        }
      },
      error: (err) => {
        console.error('❌ Error exportando proyecto:', err);
        alert(`Error al exportar: ${err.error?.message || err.message || 'Error desconocido'}`);
      }
    });
  }

  exportClient() {
    const clientId = this.clientFilter();
    if (!clientId) {
      alert('Por favor selecciona un cliente para exportar');
      return;
    }
    
    const url = `${environment.apiUrl}/export/client/${clientId}/portfolio`;
    console.log('📥 Exportando portfolio de cliente:', clientId);
    
    // Usar HttpClient para incluir el token de autenticación
    this.http.get(url, { 
      responseType: 'blob'
    }).subscribe({
      next: (blob) => {
        console.log('✅ Portfolio recibido, tamaño:', blob.size, 'bytes');
        if (blob && blob.size > 0) {
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `cliente_${clientId}_portfolio_${Date.now()}.zip`;
          link.click();
          window.URL.revokeObjectURL(downloadUrl);
        } else {
          console.error('❌ Archivo vacío recibido');
          alert('El portfolio está vacío. Verifica que el cliente tenga proyectos con hallazgos.');
        }
      },
      error: (err) => {
        console.error('❌ Error exportando cliente:', err);
        const errorMsg = err.error?.message || err.message || 'Error desconocido';
        alert(`Error al exportar: ${errorMsg}\n\nVerifica que tengas permisos de CLIENT_ADMIN o superior.`);
      }
    });
  }

  getCountBySeverity(severity: string): number {
    // Recuento rapido para tarjetas de resumen
    return this.findingService.findings().filter(f => f.severity === severity).length;
  }

  quickFilterBySeverity(severity: string): void {
    this.severityFilter.set(severity);
    this.applyFilters();
  }

  openFinding(finding: any): void {
    if (!finding?._id) return;
    void this.router.navigate(['/findings', finding._id]);
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

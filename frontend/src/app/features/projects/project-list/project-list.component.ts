import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../../core/services/project.service';
import { AuthService } from '../../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { UserRole } from '../../../shared/enums';
import { matchesSearchTerm } from '../../../shared/utils/search-utils';
import { roleSatisfies } from '../../../shared/utils/rbac';

/**
 * Componente de Lista de Proyectos
 * Muestra proyectos con filtros, estados visuales y acciones CRUD
 * Desktop-First: Optimizado para analistas SOC
 */
@Component({
  standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-project-list',
    imports: [
        CommonModule,
        RouterLink,
        FormsModule,
        MatTableModule,
        MatTabsModule,
        MatButtonModule,
        MatIconModule,
        MatChipsModule,
        MatInputModule,
        MatFormFieldModule,
        MatSelectModule,
        MatTooltipModule,
        MatProgressSpinnerModule,
        MatDialogModule,
        MatSnackBarModule
    ],
    template: `
    <div class="list-page list-page--narrow ui-stack">
      <header class="ui-screen-toolbar">
        <div class="ui-cluster">
          @if (clientFilter()) {
            <button mat-icon-button routerLink="/clients" aria-label="Volver a clientes" matTooltip="Volver a Clientes">
              <mat-icon aria-hidden="true">arrow_back</mat-icon>
            </button>
          }
          <h1 class="ui-screen-title">Proyectos</h1>
        </div>
      </header>

      @if (clientFilter()) {
        <div class="active-filter-banner">
          <mat-icon aria-hidden="true">filter_alt</mat-icon>
          <span>Mostrando proyectos de: <strong>{{ clientFilterName() }}</strong></span>
          <button mat-button type="button" (click)="clearClientFilter()">
            Ver todos los proyectos
          </button>
        </div>
      }

      <mat-tab-group class="projects-tabs" [selectedIndex]="activeTab() === 'archived' ? 1 : 0"
                      (selectedIndexChange)="onTabChange($event)">
        <mat-tab label="Activos"></mat-tab>
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon aria-hidden="true" class="archived-tab-icon">inventory_2</mat-icon>
            Archivados
          </ng-template>
        </mat-tab>
      </mat-tab-group>

      <section class="ui-cluster ui-cluster--between" aria-label="Filtros y acciones">
        @if (activeTab() === 'active') {
          @if (canCreateProject()) {
            <button mat-raised-button color="primary" type="button" routerLink="/projects/new">
              <mat-icon aria-hidden="true">add</mat-icon>
              Nuevo proyecto
            </button>
          }
        } @else {
          <p class="archived-hint">
            <mat-icon aria-hidden="true">info</mat-icon>
            Solo consulta histórica — para reactivar un proyecto, edítalo y cambia su Estado.
          </p>
        }
        <div class="ui-cluster">
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Buscar</mat-label>
            <input matInput [ngModel]="searchTerm()"
                   (ngModelChange)="searchTerm.set($event); applyFilters()"
                   placeholder="Nombre, código, cliente, área o descripción…"
                   aria-label="Filtrar proyectos">
            <mat-icon matSuffix aria-hidden="true">search</mat-icon>
          </mat-form-field>
          @if (activeTab() === 'active') {
            <mat-form-field appearance="outline" class="filter-field filter-field--status">
              <mat-label>Estado</mat-label>
              <mat-select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event); applyFilters()">
                <mat-option value="">Todos</mat-option>
                <mat-option value="ACTIVE">Activo</mat-option>
                <mat-option value="CLOSED">Cerrado</mat-option>
              </mat-select>
            </mat-form-field>
          }
          <button mat-icon-button type="button" (click)="loadProjects()" matTooltip="Actualizar lista" aria-label="Actualizar lista">
            <mat-icon aria-hidden="true">refresh</mat-icon>
          </button>
        </div>
      </section>

      <section class="ui-data-panel" aria-labelledby="projects-table-heading">
        <h2 id="projects-table-heading" class="sr-only">Listado de proyectos</h2>
        @if (projectService.loading()) {
          <div class="ui-loading-block">
            <mat-spinner aria-label="Cargando proyectos"></mat-spinner>
            <p>Cargando proyectos…</p>
          </div>
        } @else if (filteredProjects().length === 0) {
          <div class="ui-empty-state">
            @if (activeTab() === 'archived') {
              <mat-icon aria-hidden="true">inventory_2</mat-icon>
              <p class="ui-empty-state__title">No hay proyectos archivados</p>
              <p>Los proyectos que archives desde su detalle van a aparecer aquí.</p>
            } @else {
              <mat-icon aria-hidden="true">folder_off</mat-icon>
              <p class="ui-empty-state__title">No hay proyectos</p>
              @if (canCreateProject()) {
                <p>Crea tu primer proyecto para comenzar.</p>
                <button mat-raised-button color="primary" type="button" routerLink="/projects/new">
                  <mat-icon aria-hidden="true">add</mat-icon>
                  Crear proyecto
                </button>
              } @else {
                <p>No hay proyectos disponibles para tu usuario.</p>
              }
            }
          </div>
        } @else {
          <div class="ui-table-scroll">
          <table mat-table [dataSource]="filteredProjects()" class="projects-table">
            <!-- Columna Código -->
            <ng-container matColumnDef="code">
              <th mat-header-cell *matHeaderCellDef>Código</th>
              <td mat-cell *matCellDef="let project">
                <strong>{{ project.code || 'N/A' }}</strong>
              </td>
            </ng-container>

            <!-- Columna Nombre -->
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Nombre</th>
              <td mat-cell *matCellDef="let project">
                <div class="project-name">
                  <span class="name">{{ project.name }}</span>
                  @if (project.description) {
                    <span class="description">{{ project.description }}</span>
                  }
                </div>
              </td>
            </ng-container>

            <!-- Columna Cliente -->
            <ng-container matColumnDef="client">
              <th mat-header-cell *matHeaderCellDef>Cliente</th>
              <td mat-cell *matCellDef="let project">
              {{ getClientName(project.client || project.clientId) }}
            </td>
            </ng-container>

            <!-- Columna Arquitectura -->
            <ng-container matColumnDef="architecture">
              <th mat-header-cell *matHeaderCellDef>Arquitectura</th>
              <td mat-cell *matCellDef="let project">
                <mat-chip class="architecture-chip">
                  {{ project.serviceArchitecture || 'N/A' }}
                </mat-chip>
              </td>
            </ng-container>

            <!-- Columna Estado -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let project">
                <mat-chip [class]="'status-chip status-' + project.projectStatus.toLowerCase()">
                  {{ getStatusLabel(project.projectStatus) }}
                </mat-chip>
              </td>
            </ng-container>

            <!-- Columna Hallazgos -->
            <ng-container matColumnDef="findings">
              <th mat-header-cell *matHeaderCellDef>Hallazgos</th>
              <td mat-cell *matCellDef="let project">
                <button type="button" class="badge badge--link" matTooltip="Ver hallazgos de este proyecto"
                        (click)="viewFindings(project); $event.stopPropagation()">
                  {{ project.findingsCount || 0 }}
                </button>
              </td>
            </ng-container>

            <!-- Columna Fechas -->
            <ng-container matColumnDef="dates">
              <th mat-header-cell *matHeaderCellDef>Fechas</th>
              <td mat-cell *matCellDef="let project">
                <div class="dates">
                  <small>Inicio: {{ formatDate(project.startDate) }}</small>
                  <small>Fin: {{ formatDate(project.endDate) }}</small>
                </div>
              </td>
            </ng-container>

            <!-- Columna Acciones -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Acciones</th>
              <td mat-cell *matCellDef="let project">
                <button mat-icon-button [routerLink]="['/projects', project._id]" (click)="$event.stopPropagation()"
                        [matTooltip]="canCreateProject() ? 'Ver/Editar detalles' : 'Ver detalles'">
                  <mat-icon>{{ canCreateProject() ? 'edit' : 'visibility' }}</mat-icon>
                </button>
                @if (canCloseProject(project) && project.projectStatus !== 'CLOSED' && project.projectStatus !== 'ARCHIVED') {
                  <button mat-icon-button (click)="closeProject(project); $event.stopPropagation()"
                          matTooltip="Cerrar proyecto"
                          color="warn">
                    <mat-icon>lock</mat-icon>
                  </button>
                }
                @if (currentUserRole === 'OWNER') {
                  <button mat-icon-button (click)="deleteProject(project); $event.stopPropagation()"
                          matTooltip="Eliminar proyecto permanentemente"
                          color="warn">
                    <mat-icon>delete_forever</mat-icon>
                  </button>
                }
                @if (project.projectStatus === 'CLOSED') {
                  <button mat-icon-button (click)="reopenProject(project); $event.stopPropagation()"
                          matTooltip="Proyecto cerrado — clic para reabrir"
                          class="reopen-btn">
                    <mat-icon class="closed-icon">lock</mat-icon>
                  </button>
                }
                @if (canCloseProject(project) && project.projectStatus === 'ARCHIVED') {
                  <button mat-icon-button (click)="reactivateProject(project); $event.stopPropagation()"
                          matTooltip="Reactivar proyecto (volver a Activo)"
                          color="primary">
                    <mat-icon>unarchive</mat-icon>
                  </button>
                }
                @if (canCloseProject(project) && project.projectStatus !== 'ARCHIVED') {
                  <button mat-icon-button (click)="archiveProject(project); $event.stopPropagation()"
                          matTooltip="Archivar proyecto (solo consulta histórica)">
                    <mat-icon>archive</mat-icon>
                  </button>
                }
                <button mat-icon-button (click)="exportProject(project._id); $event.stopPropagation()"
                        matTooltip="Exportar">
                  <mat-icon>download</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
          </div>
        }
      </section>
    </div>
  `,
    styles: [`
    .projects-tabs {
      margin-bottom: 4px;
    }

    .archived-tab-icon {
      margin-right: 6px;
      font-size: 18px;
      width: 18px;
      height: 18px;
      vertical-align: text-bottom;
    }

    .archived-hint {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0;
      color: #757575;
      font-size: 13px;
    }

    .archived-hint mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #9e9e9e;
    }

    .filter-field {
      width: min(100%, 220px);
    }

    .filter-field--status {
      width: min(100%, 160px);
    }

    .projects-table {
      width: 100%;
    }

    .reopen-btn .closed-icon {
      color: #f44336;
    }

    .project-name {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .project-name .name {
      font-weight: 500;
      color: #212121;
    }

    .project-name .description {
      font-size: 12px;
      color: #757575;
    }

    .architecture-chip {
      font-size: 11px;
      min-height: 24px;
      background: #e3f2fd;
      color: #1976d2;
    }

    .status-chip {
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
    }

    .status-chip.status-active {
      background: #4caf50;
      color: white;
    }

    .status-chip.status-closed {
      background: #9e9e9e;
      color: white;
    }

    .status-chip.status-archived {
      background: #757575;
      color: white;
    }

    .badge {
      background: #ff9800;
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 12px;
    }

    .badge--link {
      border: none;
      cursor: pointer;
      font-family: inherit;
    }

    .badge--link:hover {
      background: #f57c00;
    }

    .active-filter-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      margin-bottom: 12px;
      background: #e3f2fd;
      color: #0d47a1;
      border-radius: 8px;
      font-size: 14px;
    }

    .active-filter-banner button {
      margin-left: auto;
    }

    .dates {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .dates small {
      font-size: 11px;
      color: #757575;
    }

    .ui-empty-state__title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1f2937;
    }

    .closed-icon {
      color: #f44336;
      font-size: 20px;
    }
  `]
})
export class ProjectListComponent implements OnInit {
  // Servicios y utilidades de UI usados en el listado
  projectService = inject(ProjectService);
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private API_URL = `${environment.apiUrl}/projects`;
  
  // Columnas visibles en la tabla (orden importa para MatTable)
  displayedColumns = ['code', 'name', 'client', 'architecture', 'status', 'findings', 'dates', 'actions'];
  
  // Estado reactivo de filtros y resultados visibles
  searchTerm = signal('');
  statusFilter = signal('');
  clientFilter = signal('');
  // Pestaña activa: separa los proyectos archivados (solo consulta histórica) del resto
  activeTab = signal<'active' | 'archived'>('active');
  clientFilterName = computed(() =>
    this.clients().find(c => c?._id === this.clientFilter())?.name || 'Cliente'
  );
  filteredProjects = signal<any[]>([]);
  
  // Rol actual para habilitar acciones criticas
  get currentUserRole(): string {
    return this.authService.currentUser()?.role || '';
  }

  ngOnInit() {
    this.loadClients();
    this.clientFilter.set(this.route.snapshot.queryParamMap.get('clientId') || '');
    this.loadProjects();
  }

  clearClientFilter(): void {
    this.clientFilter.set('');
    void this.router.navigate(['/projects']);
    this.loadProjects();
  }

  onTabChange(index: number): void {
    this.activeTab.set(index === 1 ? 'archived' : 'active');
    // El filtro de Estado (Activo/Cerrado) solo aplica dentro de la pestaña Activos
    this.statusFilter.set('');
    this.applyFilters();
  }

  loadClients() {
    this.http.get<any[]>(this.CLIENTS_URL).subscribe({
      next: (clients) => {
        this.clients.set(clients || []);
        this.clientNameById.clear();
        for (const c of (clients || [])) {
          if (c?._id) this.clientNameById.set(String(c._id), c.name || 'N/A');
        }
      },
      error: (err) => console.error('Error loading clients', err),
    });
  }

  loadProjects() {
    // Obtiene proyectos desde el servicio centralizado y aplica filtros locales
    const clientId = this.clientFilter() || undefined;
    this.projectService.loadProjects(clientId ? { clientId } : undefined).subscribe(() => {
      this.applyFilters();
    });
  }

  applyFilters() {
    // Aplica filtros de busqueda y estado sobre el cache local
    let projects = this.projectService.projects();
    
    // Filtro por búsqueda
    if (this.searchTerm()) {
      const term = this.searchTerm();
      projects = projects.filter(p => {
        const client = typeof p.clientId === 'string' ? null : p.clientId;
        const areaNames = [
          ...(p.areaId && typeof p.areaId !== 'string' ? [p.areaId.name] : []),
          ...(Array.isArray(p.areaIds) ? p.areaIds.filter((a: any) => typeof a !== 'string').map((a: any) => a.name) : []),
        ];
        return matchesSearchTerm(term, p.name, p.code, p.description, client?.name, areaNames);
      });
    }
    
    // Pestaña Archivados vs Activos (siempre se aplica primero, es excluyente)
    if (this.activeTab() === 'archived') {
      projects = projects.filter(p => p.projectStatus === 'ARCHIVED');
    } else {
      projects = projects.filter(p => p.projectStatus !== 'ARCHIVED');
      // Sub-filtro por estado (Activo/Cerrado), solo tiene sentido dentro de la pestaña Activos
      if (this.statusFilter()) {
        projects = projects.filter(p => p.projectStatus === this.statusFilter());
      }
    }

    this.filteredProjects.set(projects);
  }

  /** Mismos roles que el backend exige en POST /projects (crear proyecto) */
  canCreateProject(): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;
    return (
      roleSatisfies(UserRole.OWNER, user.role) ||
      roleSatisfies(UserRole.PENTESTER, user.role) ||
      roleSatisfies(UserRole.ADMIN_AREA, user.role)
    );
  }

  canCloseProject(project: any): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;

    // OWNER puede cerrar cualquier proyecto
    if (roleSatisfies(UserRole.OWNER, user.role)) return true;

    // PENTESTER/QA: usuarios operacionales, sin scoping por tenant/área
    // (igual que el backend en PATCH /projects/:id)
    if (roleSatisfies(UserRole.PENTESTER, user.role)) return true;

    // ADMIN_AREA: solo su propio tenant o sus áreas asignadas
    if (roleSatisfies(UserRole.ADMIN_AREA, user.role)) {
      const projClientId = project.clientId?._id || project.clientId;
      const userClientId = user.clientId;
      if (projClientId && userClientId && projClientId === userClientId) return true;

      const userAreas = user.areaIds || [];
      const projAreas = project.areaIds?.map((a: any) => a._id || a) || [];
      const projLegacyArea = project.areaId?._id || project.areaId;

      return projAreas.some((id: string) => userAreas.includes(id)) ||
             (!!projLegacyArea && userAreas.includes(projLegacyArea));
    }

    return false;
  }

  closeProject(project: any): void {
    // Confirmacion explicita antes de bloquear hallazgos
    const confirmMessage = `¿Estás seguro de cerrar el proyecto "${project.name}"?\n\n` +
                          `⚠️ Esta acción bloqueará todos los hallazgos asociados y no podrán modificarse.`;
    
    if (!confirm(confirmMessage)) return;

    this.http.patch(`${this.API_URL}/${project._id}`, { 
      projectStatus: 'CLOSED' 
    }).subscribe({
      next: () => {
        this.snackBar.open('✅ Proyecto cerrado exitosamente', 'Cerrar', { duration: 3000 });
        this.loadProjects();
      },
      error: (err) => {
        console.error('Error al cerrar proyecto:', err);
        this.snackBar.open('❌ Error al cerrar el proyecto', 'Cerrar', { duration: 3000 });
      }
    });
  }

  reopenProject(project: any): void {
    if (!confirm(`¿Abrir nuevamente el proyecto "${project.name}"?\n\nSe restaurará a estado Activo.`)) return;

    this.http.patch(`${this.API_URL}/${project._id}`, {
      projectStatus: 'ACTIVE'
    }).subscribe({
      next: () => {
        this.snackBar.open('Proyecto reactivado exitosamente', 'Cerrar', { duration: 3000 });
        this.loadProjects();
      },
      error: (err) => {
        console.error('Error al reabrir proyecto:', err);
        this.snackBar.open(err?.error?.message || 'Error al reabrir el proyecto', 'Cerrar', { duration: 3000 });
      }
    });
  }

  archiveProject(project: any): void {
    if (!confirm(`¿Archivar el proyecto "${project.name}"?\n\nPasará a la pestaña "Archivados" como solo consulta histórica. Podrás reactivarlo cuando quieras.`)) return;

    this.http.patch(`${this.API_URL}/${project._id}`, {
      projectStatus: 'ARCHIVED'
    }).subscribe({
      next: () => {
        this.snackBar.open('📦 Proyecto archivado', 'Cerrar', { duration: 3000 });
        this.loadProjects();
      },
      error: (err) => {
        console.error('Error al archivar proyecto:', err);
        this.snackBar.open(err?.error?.message || '❌ Error al archivar el proyecto', 'Cerrar', { duration: 3000 });
      }
    });
  }

  reactivateProject(project: any): void {
    if (!confirm(`¿Reactivar el proyecto "${project.name}"?\n\nVolverá a la pestaña "Activos" con estado Activo.`)) return;

    this.http.patch(`${this.API_URL}/${project._id}`, {
      projectStatus: 'ACTIVE'
    }).subscribe({
      next: () => {
        this.snackBar.open('✅ Proyecto reactivado', 'Cerrar', { duration: 3000 });
        this.loadProjects();
      },
      error: (err) => {
        console.error('Error al reactivar proyecto:', err);
        this.snackBar.open(err?.error?.message || '❌ Error al reactivar el proyecto', 'Cerrar', { duration: 3000 });
      }
    });
  }

  deleteProject(project: any): void {
    // Flujo de eliminacion con doble confirmacion si hay hallazgos
    const findingsCount = project.findingsCount || 0;
    const message = findingsCount > 0
      ? `⚠️ ATENCIÓN: Vas a ELIMINAR PERMANENTEMENTE el proyecto "${project.name}" y sus ${findingsCount} hallazgo(s).\n\n⚠️ Esta acción NO SE PUEDE DESHACER.\n\n¿Estás seguro?`
      : `¿Eliminar permanentemente el proyecto "${project.name}"?\n\nEsta acción no se puede deshacer.`;
    
    if (!confirm(message)) {
      return;
    }

    // Doble confirmación para proyectos con hallazgos
    if (findingsCount > 0) {
      const confirmText = prompt(`Escribe "ELIMINAR" para confirmar la eliminación de ${findingsCount} hallazgo(s):`);
      if (confirmText !== 'ELIMINAR') {
        this.snackBar.open('❌ Eliminación cancelada', 'Cerrar', { duration: 3000 });
        return;
      }
    }

    this.http.delete(`${this.API_URL}/${project._id}/hard`).subscribe({
      next: () => {
        this.snackBar.open(`✅ Proyecto eliminado${findingsCount > 0 ? ` con ${findingsCount} hallazgo(s)` : ''}`, 'Cerrar', { duration: 4000 });
        this.loadProjects();
      },
      error: (err) => {
        console.error('Error al eliminar proyecto:', err);
        this.snackBar.open(`❌ ${err?.error?.message || 'Error al eliminar proyecto'}`, 'Cerrar', { duration: 4000 });
      }
    });
  }

  private CLIENTS_URL = `${environment.apiUrl}/clients`;
  clients = signal<any[]>([]);
  private clientNameById = new Map<string, string>();


  getClientName(client: any): string {
    if (!client) return 'N/A';

    // Caso 1: viene populado { _id, name }
    if (typeof client === 'object') {
      return client?.name || 'N/A';
    }

    // Caso 2: viene como string (id)
    const id = String(client);
    return this.clientNameById.get(id) || 'N/A';
  }

  getStatusLabel(status: string): string {
    // Mapea estados internos a etiquetas legibles
    const labels: any = {
      'ACTIVE': 'Activo',
      'CLOSED': 'Cerrado',
      'ARCHIVED': 'Archivado'
    };
    return labels[status] || status;
  }

  formatDate(date: any): string {
    // Formato local para fechas opcionales
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-ES');
  }

  exportProject(projectId: string) {
    console.log('📥 Exportando proyecto:', projectId);
    
    this.http.get(`${environment.apiUrl}/export/project/${projectId}/excel`, {
      responseType: 'blob'
    }).subscribe({
      next: (blob) => {
        // Crear URL temporal del blob
        const url = window.URL.createObjectURL(blob);
        
        // Crear enlace temporal y hacer click
        const link = document.createElement('a');
        link.href = url;
        link.download = `proyecto_${projectId}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Limpiar URL
        window.URL.revokeObjectURL(url);
        
        console.log('✅ Proyecto exportado correctamente');
        this.snackBar.open('Proyecto exportado correctamente', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        console.error('❌ Error exportando proyecto:', err);
        const blob: Blob = err.error;
        if (blob instanceof Blob) {
          blob.text().then(text => {
            let msg = 'Error al exportar el proyecto';
            try { msg = JSON.parse(text)?.message || msg; } catch { /* non-json */ }
            this.snackBar.open(msg, 'Cerrar', { duration: 5000 });
          });
        } else {
          this.snackBar.open(err.error?.message || 'Error al exportar el proyecto', 'Cerrar', { duration: 5000 });
        }
      }
    });
  }

  openProject(project: any): void {
    if (!project?._id) return;
    void this.router.navigate(['/projects', project._id]);
  }

  viewFindings(project: any): void {
    if (!project?._id) return;
    const clientId = project.clientId?._id || project.clientId || project.client?._id;
    this.router.navigate(['/findings'], {
      queryParams: {
        projectId: project._id,
        ...(clientId ? { clientId } : {}),
      },
    });
  }
}

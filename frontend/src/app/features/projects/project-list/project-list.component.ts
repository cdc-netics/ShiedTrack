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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../../core/services/project.service';
import { AuthService } from '../../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { UserRole } from '../../../shared/enums';

/**
 * Componente de Lista de Proyectos
 * Muestra proyectos con filtros, estados visuales y acciones CRUD
 * Desktop-First: Optimizado para analistas SOC
 */
@Component({
    selector: 'app-project-list',
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
        MatDialogModule,
        MatSnackBarModule
    ],
    template: `
    <div class="project-list-container">
      <mat-card class="header-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>folder</mat-icon>
            Gestión de Proyectos
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="actions-bar">
            <button mat-raised-button color="primary" routerLink="/projects/new">
              <mat-icon>add</mat-icon>
              Nuevo Proyecto
            </button>
            
            <div class="filters">
              <mat-form-field appearance="outline" class="filter-field">
                <mat-label>Buscar</mat-label>
                <input matInput [ngModel]="searchTerm()" 
                       (ngModelChange)="searchTerm.set($event); applyFilters()"
                       placeholder="Nombre o código...">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="filter-field">
                <mat-label>Estado</mat-label>
                <mat-select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event); applyFilters()">
                  <mat-option value="">Todos</mat-option>
                  <mat-option value="ACTIVE">Activo</mat-option>
                  <mat-option value="CLOSED">Cerrado</mat-option>
                  <mat-option value="ARCHIVED">Archivado</mat-option>
                </mat-select>
              </mat-form-field>
              
              <button mat-icon-button (click)="loadProjects()" matTooltip="Actualizar">
                <mat-icon>refresh</mat-icon>
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="table-card">
        @if (projectService.loading()) {
          <div class="loading-container">
            <mat-spinner></mat-spinner>
            <p>Cargando proyectos...</p>
          </div>
        } @else if (filteredProjects().length === 0) {
          <div class="empty-state">
            <mat-icon>folder_off</mat-icon>
            <h3>No hay proyectos</h3>
            <p>Crea tu primer proyecto para comenzar</p>
            <button mat-raised-button color="primary" routerLink="/projects/new">
              <mat-icon>add</mat-icon>
              Crear Proyecto
            </button>
          </div>
        } @else {
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
                {{ getClientName(project.clientId) }}
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
                <span class="badge">{{ project.findingsCount || 0 }}</span>
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
                <button mat-icon-button [routerLink]="['/projects', project._id]" 
                        matTooltip="Ver/Editar detalles">
                  <mat-icon>edit</mat-icon>
                </button>
                @if (canCloseProject(project) && project.projectStatus !== 'CLOSED') {
                  <button mat-icon-button (click)="closeProject(project)" 
                          matTooltip="Cerrar proyecto"
                          color="warn">
                    <mat-icon>lock</mat-icon>
                  </button>
                }
                @if (currentUserRole === 'OWNER') {
                  <button mat-icon-button (click)="deleteProject(project)" 
                          matTooltip="Eliminar proyecto permanentemente"
                          color="warn">
                    <mat-icon>delete_forever</mat-icon>
                  </button>
                }
                @if (project.projectStatus === 'CLOSED') {
                  <mat-icon class="closed-icon" matTooltip="Proyecto cerrado">lock</mat-icon>
                }
                <button mat-icon-button (click)="exportProject(project._id)" 
                        matTooltip="Exportar">
                  <mat-icon>download</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        }
      </mat-card>
    </div>
  `,
    styles: [`
    .project-list-container {
      padding: 24px;
      max-width: 1600px;
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
      width: 200px;
    }

    .table-card {
      overflow-x: auto;
    }

    .projects-table {
      width: 100%;
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

    .dates {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .dates small {
      font-size: 11px;
      color: #757575;
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

    .empty-state h3 {
      margin: 0;
      color: #757575;
    }

    .empty-state p {
      color: #9e9e9e;
      margin: 0;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 12px;
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
  private API_URL = `${environment.apiUrl}/projects`;
  
  // Columnas visibles en la tabla (orden importa para MatTable)
  displayedColumns = ['code', 'name', 'client', 'architecture', 'status', 'findings', 'dates', 'actions'];
  
  // Estado reactivo de filtros y resultados visibles
  searchTerm = signal('');
  statusFilter = signal('');
  filteredProjects = signal<any[]>([]);
  
  // Rol actual para habilitar acciones criticas
  get currentUserRole(): string {
    return this.authService.currentUser()?.role || '';
  }

  ngOnInit() {
    // Carga inicial para poblar la tabla
    this.loadProjects();
  }

  loadProjects() {
    // Obtiene proyectos desde el servicio centralizado y aplica filtros locales
    this.projectService.loadProjects().subscribe(() => {
      this.applyFilters();
    });
  }

  applyFilters() {
    // Aplica filtros de busqueda y estado sobre el cache local
    let projects = this.projectService.projects();
    
    // Filtro por búsqueda
    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      projects = projects.filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.code?.toLowerCase().includes(term)
      );
    }
    
    // Filtro por estado
    if (this.statusFilter()) {
      projects = projects.filter(p => p.projectStatus === this.statusFilter());
    }
    
    this.filteredProjects.set(projects);
  }

  canCloseProject(project: any): boolean {
    // Regla de negocio simple para permitir cierre segun rol
    const user = this.authService.currentUser();
    if (!user) return false;
    
    // OWNER puede cerrar cualquier proyecto
    if (user.role === UserRole.OWNER) return true;
    
    // CLIENT_ADMIN: Verificar tenant
    if (user.role === UserRole.CLIENT_ADMIN) {
       const projClientId = project.clientId?._id || project.clientId;
       const userClientId = user.clientId;
       return projClientId === userClientId;
    }

    // AREA_ADMIN: Verificar tenants
    if (user.role === UserRole.AREA_ADMIN) {
      const userAreas = user.areaIds || [];
      const projAreas = project.areaIds?.map((a: any) => a._id || a) || [];
      const projLegacyArea = project.areaId?._id || project.areaId;

      return projAreas.some((id: string) => userAreas.includes(id)) || 
             (projLegacyArea && userAreas.includes(projLegacyArea));
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

  getClientName(clientId: any): string {
    // Normaliza el nombre del cliente si viene poblado o solo como id
    if (typeof clientId === 'string') return 'Cliente';
    return clientId?.name || 'N/A';
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
        this.snackBar.open(
          err.error?.message || 'Error al exportar el proyecto',
          'Cerrar',
          { duration: 5000 }
        );
      }
    });
  }
}

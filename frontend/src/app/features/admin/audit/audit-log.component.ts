import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { catchError, of } from 'rxjs';

@Component({
  standalone: true,
    selector: 'app-audit-log',
    imports: [
        CommonModule,
        MatTableModule,
        MatChipsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatIconModule,
        MatProgressBarModule,
        MatPaginatorModule,
        MatButtonModule,
        FormsModule,
        MatSnackBarModule
    ],
    template: `
    <div class="audit-container">
      <h1>📜 Registro de Auditoría</h1>

      @if (loading()) {
        <mat-progress-bar mode="indeterminate"></mat-progress-bar>
      }

      <div class="filters">
        <mat-form-field appearance="outline">
          <mat-label>Búsqueda general</mat-label>
          <input matInput [(ngModel)]="searchFilter" (ngModelChange)="applyFilters()" placeholder="Usuario, recurso, detalle, ID...">
          <mat-icon matSuffix>manage_search</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Usuario</mat-label>
          <input matInput [(ngModel)]="userFilter" (ngModelChange)="applyFilters()" placeholder="Email o nombre de usuario...">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Acción</mat-label>
          <mat-select [(ngModel)]="actionFilter">
            <mat-option value="">Todas</mat-option>
            <mat-option value="POST">POST</mat-option>
            <mat-option value="PUT">PUT</mat-option>
            <mat-option value="PATCH">PATCH</mat-option>
            <mat-option value="DELETE">DELETE</mat-option>
            <mat-option value="GET">GET</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Entidad</mat-label>
          <mat-select [(ngModel)]="entityFilter">
            <mat-option value="">Todas</mat-option>
            <mat-option value="HTTP">HTTP</mat-option>
            <mat-option value="HTTP_ERROR">HTTP Error</mat-option>
            <mat-option value="EXPORT">Export</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Actor</mat-label>
          <mat-select [(ngModel)]="actorTypeFilter" (ngModelChange)="applyFilters()">
            <mat-option value="">Todos</mat-option>
            <mat-option value="USER">Usuario</mat-option>
            <mat-option value="SYSTEM">Sistema</mat-option>
            <mat-option value="ANONYMOUS">Anónimo</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Severidad</mat-label>
          <mat-select [(ngModel)]="severityFilter">
            <mat-option value="">Todas</mat-option>
            <mat-option value="INFO">INFO</mat-option>
            <mat-option value="WARNING">WARNING</mat-option>
            <mat-option value="CRITICAL">CRITICAL</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Desde (fecha/hora)</mat-label>
          <input matInput type="datetime-local" [(ngModel)]="fromDateTime">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Hasta (fecha/hora)</mat-label>
          <input matInput type="datetime-local" [(ngModel)]="toDateTime">
        </mat-form-field>

        <button mat-raised-button color="primary" (click)="loadLogs(true)">
          <mat-icon>refresh</mat-icon>
          Aplicar
        </button>
        <button mat-stroked-button type="button" (click)="clearFilters()">
          Limpiar
        </button>
      </div>

      <table mat-table [dataSource]="auditLogs()" class="audit-table">
        <ng-container matColumnDef="createdAt">
          <th mat-header-cell *matHeaderCellDef>Fecha/Hora</th>
          <td mat-cell *matCellDef="let log">{{ log.createdAt | date:'medium' }}</td>
        </ng-container>

        <ng-container matColumnDef="actor">
          <th mat-header-cell *matHeaderCellDef>Actor</th>
          <td mat-cell *matCellDef="let log">{{ log.actor }}</td>
        </ng-container>

        <ng-container matColumnDef="actorType">
          <th mat-header-cell *matHeaderCellDef>Tipo</th>
          <td mat-cell *matCellDef="let log">
            <mat-chip [class]="'actor-' + (log.actorType || '').toLowerCase()">
              {{ actorTypeLabel(log.actorType) }}
            </mat-chip>
          </td>
        </ng-container>

        <ng-container matColumnDef="result">
          <th mat-header-cell *matHeaderCellDef>Resultado</th>
          <td mat-cell *matCellDef="let log">{{ log.statusText }} · {{ log.durationText }}</td>
        </ng-container>

        <ng-container matColumnDef="description">
          <th mat-header-cell *matHeaderCellDef>Detalle (qué hizo)</th>
          <td mat-cell *matCellDef="let log">
            <div>{{ log.description }}</div>
            <small>{{ log.contextLine }}</small>
            @if (log.entityId && log.entityId !== 'N/A') {
              <small>ID: {{ log.entityId }}</small>
            }
          </td>
        </ng-container>

        <ng-container matColumnDef="severity">
          <th mat-header-cell *matHeaderCellDef>Severidad</th>
          <td mat-cell *matCellDef="let log">
            <mat-chip [class]="'severity-' + ((log.severity || 'INFO').toLowerCase())">
              {{ log.severity || 'INFO' }}
            </mat-chip>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>

      @if (auditLogs().length === 0 && !loading()) {
        <div class="no-data">No hay registros de auditoría</div>
      }

      <mat-paginator
        [length]="totalRecords()"
        [pageSize]="pageSize"
        [pageSizeOptions]="[10, 25, 50, 100]"
        (page)="onPageChange($event)">
      </mat-paginator>
    </div>
  `,
    styles: [`
    .audit-container {
      padding: 0;
    }

    h1 {
      margin: 0 0 24px 0;
      font-size: 28px;
      font-weight: 500;
    }

    .audit-table {
      width: 100%;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .audit-table th {
      font-weight: 600;
      background: #f5f5f5;
    }

    .action-create {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .action-update {
      background: #e3f2fd;
      color: #1565c0;
    }

    .action-delete {
      background: #ffebee;
      color: #c62828;
    }

    .action-login, .action-logout {
      background: #f5f5f5;
      color: #616161;
    }

    .action-post {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .action-get {
      background: #e3f2fd;
      color: #0d47a1;
    }

    .actor-user {
      background: #e8f5e9;
      color: #1b5e20;
    }

    .actor-system {
      background: #ede7f6;
      color: #4527a0;
    }

    .actor-anonymous {
      background: #eceff1;
      color: #37474f;
    }

    .severity-info {
      background: #e8f1ff;
      color: #0d47a1;
    }

    .severity-critical {
      background: #ffebee;
      color: #b71c1c;
    }

    .filters {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 24px;
      align-items: flex-end;
    }

    mat-form-field {
      flex: 1 1 220px;
      min-width: 220px;
    }

    button {
      height: 56px;
    }

    .no-data {
      text-align: center;
      padding: 48px 16px;
      color: #999;
      font-size: 16px;
    }
  `]
})
export class AuditLogComponent implements OnInit {
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private clientsById = new Map<string, string>();
  private projectsById = new Map<string, string>();
  private findingsById = new Map<string, string>();
  private usersById = new Map<string, string>();

  loading = signal(false);
  displayedColumns = ['createdAt', 'actor', 'actorType', 'result', 'description', 'severity'];
  auditLogs = signal<any[]>([]); // datos filtrados/paginados
  allLogs = signal<any[]>([]); // dataset base para filtros locales
  totalRecords = signal(0);

  userFilter = '';
  searchFilter = '';
  actionFilter = '';
  entityFilter = '';
  severityFilter = '';
  actorTypeFilter = '';
  fromDateTime = '';
  toDateTime = '';
  pageSize = 25;
  currentPage = 0;

  ngOnInit() {
    this.loadLogs();
  }

  loadLogs(resetPage = true): void {
    this.loading.set(true);
    if (resetPage) {
      this.currentPage = 0;
    }
    const params: any = {
      limit: 1000,
    };

    if (this.actionFilter) params.action = this.actionFilter;
    if (this.entityFilter) params.entityType = this.entityFilter;
    if (this.severityFilter) params.severity = this.severityFilter;
    if (this.userFilter) params.performedBy = this.userFilter;
    if (this.fromDateTime) params.startDate = new Date(this.fromDateTime).toISOString();
    if (this.toDateTime) params.endDate = new Date(this.toDateTime).toISOString();

    this.preloadEntityNames();

    this.http.get<any[]>(`${environment.apiUrl}/audit/logs`, { params })
      .subscribe({
        next: (logs) => {
          const normalized = logs.map((log) => this.normalizeLog(log));
          this.allLogs.set(normalized);
          this.applyLocalFilters();
          this.loading.set(false);
        },
        error: (err: any) => {
          console.error('Error cargando logs de auditoría:', err);
          this.snackBar.open('Error cargando logs de auditoría', 'Cerrar', { duration: 3000 });
          this.loading.set(false);
        }
      });
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.applyLocalFilters();
  }

  clearFilters(): void {
    this.userFilter = '';
    this.searchFilter = '';
    this.actionFilter = '';
    this.entityFilter = '';
    this.severityFilter = '';
    this.actorTypeFilter = '';
    this.fromDateTime = '';
    this.toDateTime = '';
    this.loadLogs(true);
  }

  private applyLocalFilters(): void {
    const text = this.searchFilter.trim().toLowerCase();
    const userText = this.userFilter.trim().toLowerCase();
    const actorType = this.actorTypeFilter;

    const filtered = this.allLogs().filter((log) => {
      if (actorType && log.actorType !== actorType) return false;
      if (userText && !String(log.actor).toLowerCase().includes(userText)) return false;

      if (!text) return true;
      const haystack = [
        log.actor,
        log.entityId,
        log.description,
        log.contextLine,
        log.statusText,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(text);
    });

    this.totalRecords.set(filtered.length);
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    this.auditLogs.set(filtered.slice(start, end));
  }

  private normalizeLog(log: any): any {
    const actor = this.resolveActor(log);
    const actorType = this.resolveActorType(log);
    const actionLabel = this.resolveActionLabel(log);
    const statusCode = typeof log.statusCode === 'number' ? log.statusCode : null;
    const statusText = statusCode ? `HTTP ${statusCode}` : '-';
    const durationText = typeof log.durationMs === 'number' ? `${log.durationMs} ms` : '-';

    return {
      ...log,
      actor,
      actorType,
      actionLabel,
      statusText,
      durationText,
      description: this.resolveDescription(log),
      contextLine: this.resolveContextLine(log),
    };
  }

  private resolveActor(log: any): string {
    const fromPopulate = log?.performedBy && typeof log.performedBy === 'object'
      ? [log.performedBy.firstName, log.performedBy.lastName].filter(Boolean).join(' ').trim() || log.performedBy.email
      : null;

    const label = fromPopulate || log?.performedByLabel;
    if (label && String(label).trim()) return String(label);
    if (log?.performedBy && typeof log.performedBy === 'string') return `Usuario (${log.performedBy})`;
    return 'Sistema/Anónimo';
  }

  private resolveActorType(log: any): 'USER' | 'SYSTEM' | 'ANONYMOUS' {
    if (log?.performedBy) return 'USER';
    const label = String(log?.performedByLabel || '').toLowerCase();
    if (!label || label === 'anonymous') return 'ANONYMOUS';
    if (label.includes('system') || label.includes('cron') || label.includes('scheduler')) return 'SYSTEM';
    return 'SYSTEM';
  }

  private resolveActionLabel(log: any): string {
    const method = String(log?.method || '').toUpperCase();
    if (method) return method;
    const action = String(log?.action || '').trim();
    if (!action) return 'N/A';
    return action.split(' ')[0] || action;
  }

  private resolveDescription(log: any): string {
    const method = String(log?.method || '').toUpperCase();
    const path = String(log?.path || '').trim();
    const statusCode = typeof log?.statusCode === 'number' ? log.statusCode : null;
    const failed = statusCode !== null && statusCode >= 400;
    const segments = path.split('/').filter(Boolean);
    const resource = segments[1] || 'recurso';
    const targetId = segments[2] || (log?.entityId && log.entityId !== 'N/A' ? log.entityId : null);
    const targetLabel = this.resolveTargetLabel(resource, targetId);

    if (path === '/api/auth/profile') {
      return failed
        ? 'Falló la consulta del perfil del usuario autenticado.'
        : 'Consultó su perfil de usuario.';
    }
    if (path === '/api/system-config/smtp') {
      return failed
        ? 'Falló la consulta de la configuración SMTP.'
        : 'Consultó la configuración SMTP del sistema.';
    }

    const verbMap: Record<string, string> = {
      GET: failed ? 'Intentó consultar' : 'Consultó',
      POST: failed ? 'Intentó crear' : 'Creó',
      PUT: failed ? 'Intentó actualizar' : 'Actualizó',
      PATCH: failed ? 'Intentó actualizar' : 'Actualizó',
      DELETE: failed ? 'Intentó eliminar' : 'Eliminó',
    };
    const verb = verbMap[method] || (failed ? 'Intentó ejecutar' : 'Ejecutó');
    const readableResource = this.readableResource(resource);
    const target = targetLabel
      ? ` "${targetLabel}"${targetId ? ` (${targetId})` : ''}`
      : (targetId ? ` (${targetId})` : '');

    return `${verb} ${readableResource}${target}.`;
  }

  private resolveContextLine(log: any): string {
    const method = String(log?.method || log?.actionLabel || '').toUpperCase();
    const path = String(log?.path || '').trim();
    return `${method} · HTTP · ${path || '-'}`;
  }

  private readableResource(resource: string): string {
    const map: Record<string, string> = {
      projects: 'proyectos',
      project: 'proyecto',
      findings: 'hallazgos',
      finding: 'hallazgo',
      clients: 'clientes',
      client: 'cliente',
      users: 'usuarios',
      auth: 'autenticación',
      audit: 'auditoría',
      areas: 'áreas',
      templates: 'plantillas',
      notifications: 'notificaciones',
      'system-config': 'configuración del sistema',
      export: 'exportación',
    };
    return map[resource] || resource;
  }

  private preloadEntityNames(): void {
    this.http.get<any[]>(`${environment.apiUrl}/clients`)
      .pipe(catchError(() => of([])))
      .subscribe((clients) => {
        clients.forEach((c: any) => this.clientsById.set(String(c._id), c.name || c.code || String(c._id)));
        this.refreshNormalizedLogs();
      });

    this.http.get<any[]>(`${environment.apiUrl}/projects`)
      .pipe(catchError(() => of([])))
      .subscribe((projects) => {
        projects.forEach((p: any) => this.projectsById.set(String(p._id), p.name || p.code || String(p._id)));
        this.refreshNormalizedLogs();
      });

    this.http.get<any[]>(`${environment.apiUrl}/findings?includeClosed=true`)
      .pipe(catchError(() => of([])))
      .subscribe((findings) => {
        findings.forEach((f: any) =>
          this.findingsById.set(String(f._id), f.title || f.internal_code || String(f._id)),
        );
        this.refreshNormalizedLogs();
      });

    this.http.get<any[]>(`${environment.apiUrl}/auth/users`)
      .pipe(catchError(() => of([])))
      .subscribe((users) => {
        users.forEach((u: any) => {
          const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
          this.usersById.set(String(u._id), fullName || u.email || String(u._id));
        });
        this.refreshNormalizedLogs();
      });
  }

  private resolveTargetLabel(resource: string, targetId: string | null): string | null {
    if (!targetId) return null;
    if (resource === 'clients' || resource === 'client') return this.clientsById.get(targetId) || null;
    if (resource === 'projects' || resource === 'project') return this.projectsById.get(targetId) || null;
    if (resource === 'findings' || resource === 'finding') return this.findingsById.get(targetId) || null;
    if (resource === 'users' || resource === 'user') return this.usersById.get(targetId) || null;
    return null;
  }

  private refreshNormalizedLogs(): void {
    const current = this.allLogs();
    if (!current.length) return;
    const reNormalized = current.map((log) => this.normalizeLog(log));
    this.allLogs.set(reNormalized);
    this.applyLocalFilters();
  }

  actorTypeLabel(type: string): string {
    if (type === 'USER') return 'Usuario';
    if (type === 'SYSTEM') return 'Sistema';
    return 'Anónimo';
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.applyLocalFilters();
  }
}

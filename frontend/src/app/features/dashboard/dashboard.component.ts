import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { FindingService } from '../../core/services/finding.service';
import { ProjectService } from '../../core/services/project.service';

/**
 * Componente de Dashboard
 * Vista principal con resumen de hallazgos y proyectos activos
 * Desktop-First: Optimizado para pantallas ≥1366px
 */
@Component({
    selector: 'app-dashboard',
    imports: [
        CommonModule,
        RouterLink,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatTableModule
    ],
    template: `
    <div class="dashboard-container">
      <h1>📊 Dashboard</h1>

      <!-- User Context Banner -->
      <mat-card class="context-card">
        <mat-card-content>
          <div class="context-info">
            <div class="context-item">
              <mat-icon>person</mat-icon>
              <div>
                <div class="label">Usuario</div>
                <div class="value">{{ authService.currentUser()?.firstName }} {{ authService.currentUser()?.lastName }}</div>
                <div class="sub-value">{{ authService.currentUser()?.role }}</div>
              </div>
            </div>
            
            <div class="context-item">
              <mat-icon>business</mat-icon>
              <div>
                <div class="label">Cliente / Tenant</div>
                <div class="value">
                  @if (authService.isAdmin()) {
                    🏢 Acceso Global (Todos los Clientes)
                  } @else {
                    {{ clientName() || 'Cargando...' }}
                  }
                </div>
              </div>
            </div>

            <div class="context-item">
              <mat-icon>category</mat-icon>
              <div>
                <div class="label">Áreas Asignadas</div>
                <div class="value">
                  @if (authService.isAdmin()) {
                    🌐 Todas las Áreas
                  } @else if (areaNames().length > 0) {
                    {{ areaNames().join(', ') }}
                  } @else {
                    ⚠️ Sin áreas asignadas
                  }
                </div>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <div class="quick-nav">
        <button mat-raised-button color="primary" routerLink="/projects">
          <mat-icon>folder</mat-icon> Proyectos
        </button>
        <button mat-raised-button color="accent" routerLink="/findings">
          <mat-icon>bug_report</mat-icon> Hallazgos
        </button>
        <button mat-raised-button color="warn" routerLink="/clients">
          <mat-icon>business</mat-icon> Clientes
        </button>
        <button mat-raised-button routerLink="/findings/new">
          <mat-icon>add</mat-icon> Nuevo Hallazgo
        </button>
      </div>

      <div class="stats-grid">
        <mat-card>
          <mat-card-content>
            <div class="stat">
              <h2>{{ stats().totalFindings }}</h2>
              <p>Hallazgos Activos</p>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-content>
            <div class="stat critical">
              <h2>{{ stats().criticalFindings }}</h2>
              <p>Críticos</p>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-content>
            <div class="stat">
              <h2>{{ stats().activeProjects }}</h2>
              <p>Proyectos Activos</p>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-content>
            <div class="stat">
              <h2>{{ stats().pendingRetest }}</h2>
              <p>Pendiente Retest</p>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="content-grid">
        <mat-card class="findings-card">
          <mat-card-header>
            <mat-card-title>🔍 Hallazgos Recientes</mat-card-title>
            <button mat-raised-button color="primary" routerLink="/findings">
              Ver Todos
            </button>
          </mat-card-header>
          <mat-card-content>
            @if (findingService.loading()) {
              <p>Cargando...</p>
            } @else if (findingService.findings().length === 0) {
              <p>No hay hallazgos activos</p>
            } @else {
              <table mat-table [dataSource]="findingService.findings().slice(0, 5)" class="dense-table">
                <ng-container matColumnDef="code">
                  <th mat-header-cell *matHeaderCellDef>Código</th>
                  <td mat-cell *matCellDef="let finding">{{ finding.code }}</td>
                </ng-container>

                <ng-container matColumnDef="title">
                  <th mat-header-cell *matHeaderCellDef>Título</th>
                  <td mat-cell *matCellDef="let finding">{{ finding.title }}</td>
                </ng-container>

                <ng-container matColumnDef="severity">
                  <th mat-header-cell *matHeaderCellDef>Severidad</th>
                  <td mat-cell *matCellDef="let finding">
                    <span [class]="'badge severity-' + finding.severity.toLowerCase()">
                      {{ finding.severity }}
                    </span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Estado</th>
                  <td mat-cell *matCellDef="let finding">{{ finding.status }}</td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;" 
                    [routerLink]="['/findings', row._id]" class="clickable-row"></tr>
              </table>
            }
          </mat-card-content>
        </mat-card>

        <mat-card class="projects-card">
          <mat-card-header>
            <mat-card-title>📁 Proyectos Activos</mat-card-title>
            <button mat-raised-button color="accent" routerLink="/projects">
              Ver Todos
            </button>
          </mat-card-header>
          <mat-card-content>
            @if (projectService.loading()) {
              <p>Cargando...</p>
            } @else if (projectService.projects().length === 0) {
              <p>No hay proyectos activos</p>
            } @else {
              <div class="project-list">
                @for (project of projectService.projects().slice(0, 5); track project._id) {
                  <div class="project-item" [routerLink]="['/projects', project._id]">
                    <div class="project-name">{{ project.name }}</div>
                    <div class="project-meta">{{ project.serviceArchitecture }}</div>
                  </div>
                }
              </div>
            }
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
    styles: [`
    .dashboard-container {
      padding: 0;
    }

    h1 {
      margin: 0 0 24px 0;
      font-size: 28px;
      font-weight: 500;
    }

    .context-card {
      margin-bottom: 24px;
      background: #e3f2fd;
      border: 1px solid #bbdefb;
    }

    .context-info {
      display: flex;
      gap: 32px;
      flex-wrap: wrap;
    }

    .context-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .context-item mat-icon {
      color: #1976d2;
      width: 32px;
      height: 32px;
      font-size: 32px;
    }

    .context-item .label {
      font-size: 12px;
      color: #546e7a;
      font-weight: 500;
    }

    .context-item .value {
      font-size: 16px;
      font-weight: 600;
      color: #263238;
    }

    .context-item .sub-value {
      font-size: 12px;
      color: #78909c;
    }

    .quick-nav {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .quick-nav button {
      flex: 1;
      height: 56px;
      font-size: 16px;
    }

    .quick-nav button mat-icon {
      margin-right: 8px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat {
      text-align: center;
    }

    .stat h2 {
      font-size: 36px;
      margin: 0;
      color: #2196f3;
    }

    .stat.critical h2 {
      color: #f44336;
    }

    .stat p {
      margin: 8px 0 0 0;
      color: #666;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 16px;
    }

    mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .dense-table {
      width: 100%;
      font-size: 14px;
    }

    .dense-table th,
    .dense-table td {
      padding: 8px 12px;
    }

    .clickable-row {
      cursor: pointer;
    }

    .clickable-row:hover {
      background: #f5f5f5;
    }

    .badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }

    .severity-critical {
      background: #ffebee;
      color: #c62828;
    }

    .severity-high {
      background: #fff3e0;
      color: #e65100;
    }

    .severity-medium {
      background: #fff9c4;
      color: #f57f17;
    }

    .severity-low {
      background: #e3f2fd;
      color: #1565c0;
    }

    .project-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .project-item {
      padding: 12px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .project-item:hover {
      background: #f5f5f5;
      border-color: #2196f3;
    }

    .project-name {
      font-weight: 600;
      margin-bottom: 4px;
    }

    .project-meta {
      font-size: 12px;
      color: #666;
    }

    @media (max-width: 1366px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .content-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  // Servicios para cargar datos de resumen
  authService = inject(AuthService);
  findingService = inject(FindingService);
  projectService = inject(ProjectService);
  private http = inject(HttpClient);

  clientName = signal<string>('');
  areaNames = signal<string[]>([]);

  // Columnas mostradas en la tabla de hallazgos recientes
  displayedColumns = ['code', 'title', 'severity', 'status'];
  
  // Contadores derivados para tarjetas de estado
  stats = signal({
    totalFindings: 0,
    criticalFindings: 0,
    activeProjects: 0,
    pendingRetest: 0
  });

  ngOnInit(): void {
    // Cargar contexto del usuario
    const user = this.authService.currentUser();
    if (user && !this.authService.isAdmin()) {
      if (user.clientId) {
        this.http.get<any>(`http://localhost:3000/api/clients/${user.clientId}`).subscribe({
          next: (client) => this.clientName.set(client.name),
          error: () => this.clientName.set('Error cargando cliente')
        });

        // Cargar áreas
        this.http.get<any[]>(`http://localhost:3000/api/areas?clientId=${user.clientId}`).subscribe({
          next: (areas) => {
            // Filtrar solo las áreas asignadas al usuario
            const myAreas = areas.filter(a => user.areaIds?.includes(a._id));
            this.areaNames.set(myAreas.map(a => a.name));
          },
          error: () => console.error('Error cargando áreas')
        });
      }
    }

    // Cargar datos y calcular KPIs simples para el dashboard
    this.findingService.loadFindings({ includeClosed: false }).subscribe(() => {
      const findings = this.findingService.findings();
      this.stats.update(s => ({
        ...s,
        totalFindings: findings.length,
        criticalFindings: findings.filter(f => f.severity === 'CRITICAL').length,
        pendingRetest: findings.filter(f => f.status === 'PENDING_RETEST').length
      }));
    });

    this.projectService.loadProjects({ status: 'ACTIVE' }).subscribe(() => {
      this.stats.update(s => ({
        ...s,
        activeProjects: this.projectService.projects().length
      }));
    });
  }
}

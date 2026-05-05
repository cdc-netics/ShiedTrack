import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { FindingService } from '../../core/services/finding.service';
import { ProjectService } from '../../core/services/project.service';
import { environment } from '../../../environments/environment';

/**
 * Componente de Dashboard
 * Vista principal con resumen de hallazgos y proyectos activos
 * Desktop-First: Optimizado para pantallas ≥1366px
 */
@Component({
  standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'app-dashboard',
    imports: [
        CommonModule,
        RouterLink,
        MatButtonModule,
        MatIconModule,
        MatTableModule
    ],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss',
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
        this.http.get<any>(`${environment.apiUrl}/clients/${user.clientId}`).subscribe({
          next: (client) => this.clientName.set(client.name),
          error: () => this.clientName.set('Error cargando cliente')
        });

        // Cargar áreas
        this.http.get<any[]>(`${environment.apiUrl}/areas?clientId=${user.clientId}`).subscribe({
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

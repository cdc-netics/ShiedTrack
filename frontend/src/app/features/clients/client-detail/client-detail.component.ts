import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { environment } from '../../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-client-detail',
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatChipsModule],
  template: `
    <div class="list-page list-page--narrow ui-stack">
      <header class="ui-screen-toolbar">
        <div class="ui-cluster">
          <button mat-icon-button routerLink="/clients" aria-label="Volver a clientes">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h1 class="ui-screen-title">Detalle de cliente</h1>
        </div>
      </header>

      @if (loading()) {
        <p>Cargando cliente&hellip;</p>
      } @else if (!client()) {
        <p>No se encontr&oacute; el cliente.</p>
      } @else {
        <section class="ui-data-panel">
          <div class="client-header">
            <div>
              <h2 class="client-title">{{ client()?.name }}</h2>
              @if (client()?.displayName && client()?.displayName !== client()?.name) {
                <p class="client-subtitle">{{ client()?.displayName }}</p>
              }
            </div>
            <div class="ui-cluster">
              <mat-chip [class]="client()?.isActive ? 'status-active' : 'status-inactive'">
                {{ client()?.isActive ? 'Activo' : 'Inactivo' }}
              </mat-chip>
              <small>Creado: {{ formatDate(client()?.createdAt) }}</small>
            </div>
          </div>

          <div class="client-info-grid">
            @if (client()?.description) {
              <div class="info-item info-item--full">
                <mat-icon class="info-icon">description</mat-icon>
                <div>
                  <span class="info-label">Descripci&oacute;n</span>
                  <span class="info-value">{{ client()?.description }}</span>
                </div>
              </div>
            }
            @if (client()?.code) {
              <div class="info-item">
                <mat-icon class="info-icon">tag</mat-icon>
                <div>
                  <span class="info-label">C&oacute;digo</span>
                  <span class="info-value">{{ client()?.code }}</span>
                </div>
              </div>
            }
            @if (client()?.contactEmail) {
              <div class="info-item">
                <mat-icon class="info-icon">email</mat-icon>
                <div>
                  <span class="info-label">Email de contacto</span>
                  <a class="info-value info-link" href="mailto:{{ client()?.contactEmail }}">{{ client()?.contactEmail }}</a>
                </div>
              </div>
            }
            @if (client()?.contactPhone) {
              <div class="info-item">
                <mat-icon class="info-icon">phone</mat-icon>
                <div>
                  <span class="info-label">Tel&eacute;fono</span>
                  <a class="info-value info-link" href="tel:{{ client()?.contactPhone }}">{{ client()?.contactPhone }}</a>
                </div>
              </div>
            }
            @if (!client()?.description && !client()?.code && !client()?.contactEmail && !client()?.contactPhone) {
              <p class="no-info">Sin informaci&oacute;n de contacto registrada.</p>
            }
          </div>
        </section>

        <section class="ui-data-panel">
          <div class="ui-cluster ui-cluster--between">
            <h2 class="ui-region-title">Severidades del cliente</h2>
            <button mat-stroked-button [routerLink]="['/findings']" [queryParams]="{ clientId: clientId() }">
              Ver todos los hallazgos
            </button>
          </div>
          <div class="severity-grid">
            <button type="button" class="severity-pill severity-pill--critical" (click)="openFindingsBySeverity('CRITICAL')">
              <strong>{{ severityStats().critical }}</strong>
              <span>Cr&iacute;ticos</span>
            </button>
            <button type="button" class="severity-pill severity-pill--high" (click)="openFindingsBySeverity('HIGH')">
              <strong>{{ severityStats().high }}</strong>
              <span>Altos</span>
            </button>
            <button type="button" class="severity-pill severity-pill--medium" (click)="openFindingsBySeverity('MEDIUM')">
              <strong>{{ severityStats().medium }}</strong>
              <span>Medios</span>
            </button>
            <button type="button" class="severity-pill severity-pill--low" (click)="openFindingsBySeverity('LOW')">
              <strong>{{ severityStats().low }}</strong>
              <span>Bajos</span>
            </button>
          </div>
        </section>

        <section class="ui-data-panel">
          <div class="ui-cluster ui-cluster--between">
            <h2 class="ui-region-title">Proyectos del cliente</h2>
            <button mat-stroked-button [routerLink]="['/findings']" [queryParams]="{ clientId: clientId() }">
              Ver hallazgos del cliente
            </button>
          </div>
          @if (projects().length === 0) {
            <p>No hay proyectos para este cliente.</p>
          } @else {
            <ul class="ui-list-link">
              @for (project of projects(); track project._id) {
                <li>
                  <a class="ui-list-link__item" [routerLink]="['/projects', project._id]">
                    <span class="ui-list-link__primary">{{ project.name }}</span>
                    <span class="ui-list-link__secondary">{{ project.code || 'Sin c&oacute;digo' }} &middot; {{ project.projectStatus }}</span>
                  </a>
                </li>
              }
            </ul>
          }
        </section>
      }
    </div>
  `,
  styles: [`
    .status-active { background: #4caf50; color: #fff; }
    .status-inactive { background: #9e9e9e; color: #fff; }

    .client-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 20px;
    }
    .client-title { margin: 0; font-size: 1.4rem; font-weight: 600; }
    .client-subtitle { margin: 4px 0 0; color: #757575; font-size: 0.9rem; }

    .client-info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 16px;
    }
    .info-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }
    .info-item--full { grid-column: 1 / -1; }
    .info-icon { color: #757575; font-size: 20px; width: 20px; height: 20px; margin-top: 2px; flex-shrink: 0; }
    .info-label {
      display: block;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #9e9e9e;
      margin-bottom: 2px;
    }
    .info-value { display: block; font-size: 14px; color: #212121; font-weight: 500; }
    .info-link { color: #1976d2; text-decoration: none; }
    .info-link:hover { text-decoration: underline; }
    .no-info { color: #9e9e9e; font-size: 14px; margin: 0; }

    .severity-grid {
      display: grid;
      gap: 10px;
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    .severity-pill {
      border: 0;
      border-radius: 10px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
    }
    .severity-pill strong { font-size: 22px; line-height: 1; }
    .severity-pill--critical { background: #ffebee; color: #b71c1c; }
    .severity-pill--high { background: #fff3e0; color: #e65100; }
    .severity-pill--medium { background: #fff8e1; color: #ff8f00; }
    .severity-pill--low { background: #e8f5e9; color: #1b5e20; }
  `]
})
export class ClientDetailComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loading = signal(false);
  clientId = signal('');
  client = signal<any | null>(null);
  projects = signal<any[]>([]);
  severityStats = signal({ critical: 0, high: 0, medium: 0, low: 0 });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || '';
    this.clientId.set(id);
    if (!id) return;
    this.load(id);
  }

  private load(id: string): void {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/clients/${id}`).subscribe({
      next: (client) => {
        this.client.set(client);
        this.http.get<any[]>(`${environment.apiUrl}/projects?clientId=${id}`).subscribe({
          next: (projects) => {
            this.projects.set(projects || []);
            const projectIds = (projects || []).map((p: any) => p?._id).filter(Boolean);
            if (projectIds.length === 0) {
              this.severityStats.set({ critical: 0, high: 0, medium: 0, low: 0 });
              this.loading.set(false);
              return;
            }

            this.http.get<any[]>(`${environment.apiUrl}/findings?includeClosed=true`).subscribe({
              next: (findings) => {
                const ownFindings = (findings || []).filter((f) => {
                  const pid = typeof f?.projectId === 'string' ? f.projectId : f?.projectId?._id;
                  return projectIds.includes(pid);
                });
                this.severityStats.set({
                  critical: ownFindings.filter((f) => f?.severity === 'CRITICAL').length,
                  high: ownFindings.filter((f) => f?.severity === 'HIGH').length,
                  medium: ownFindings.filter((f) => f?.severity === 'MEDIUM').length,
                  low: ownFindings.filter((f) => f?.severity === 'LOW').length,
                });
                this.loading.set(false);
              },
              error: () => {
                this.severityStats.set({ critical: 0, high: 0, medium: 0, low: 0 });
                this.loading.set(false);
              },
            });
          },
          error: () => {
            this.projects.set([]);
            this.severityStats.set({ critical: 0, high: 0, medium: 0, low: 0 });
            this.loading.set(false);
          },
        });
      },
      error: () => {
        this.client.set(null);
        this.loading.set(false);
      }
    });
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-ES');
  }

  openFindingsBySeverity(severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'): void {
    void this.router.navigate(['/findings'], {
      queryParams: {
        clientId: this.clientId(),
        severity,
      },
    });
  }
}

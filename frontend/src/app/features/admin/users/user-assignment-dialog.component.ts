import { Component, Inject, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

export interface AssignmentData {
  userId: string;
  userName: string;
  currentAssignments?: {
    clients?: string[];
    projects?: string[];
    areas?: string[];
  };
}

/**
 * Diálogo centralizado para asignar usuarios a clientes, proyectos y áreas
 * Permite multi-selección y gestión granular de permisos
 */
@Component({
  selector: 'app-user-assignment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    MatTabsModule,
    MatListModule,
    MatChipsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressBarModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>assignment</mat-icon>
      Asignar Permisos - {{ data.userName }}
    </h2>

    <mat-dialog-content>
      @if (loading()) {
        <mat-progress-bar mode="indeterminate"></mat-progress-bar>
      }

      <mat-tab-group>
        <!-- Tab 1: Clientes -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>business</mat-icon>
            <span>Clientes ({{ selectedClients().length }})</span>
          </ng-template>

          <div class="tab-content">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Buscar cliente</mat-label>
              <input matInput [(ngModel)]="clientSearch" placeholder="Nombre del cliente...">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <mat-list>
              @for (client of filteredClients(); track client._id) {
                <mat-list-item>
                  <mat-checkbox 
                    [checked]="isClientSelected(client._id)"
                    (change)="toggleClient(client._id)">
                    {{ client.name }}
                    <mat-chip class="info-chip">{{ client.displayName || client.name }}</mat-chip>
                  </mat-checkbox>
                </mat-list-item>
              }
              @empty {
                <mat-list-item>No hay clientes disponibles</mat-list-item>
              }
            </mat-list>
          </div>
        </mat-tab>

        <!-- Tab 2: Proyectos -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>folder</mat-icon>
            <span>Proyectos ({{ selectedProjects().length }})</span>
          </ng-template>

          <div class="tab-content">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Filtrar por cliente</mat-label>
              <mat-select [(ngModel)]="projectClientFilter">
                <mat-option value="">Todos los clientes</mat-option>
                @for (client of clients(); track client._id) {
                  <mat-option [value]="client._id">{{ client.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Buscar proyecto</mat-label>
              <input matInput [(ngModel)]="projectSearch" placeholder="Nombre del proyecto...">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <mat-list>
              @for (project of filteredProjects(); track project._id) {
                <mat-list-item>
                  <mat-checkbox 
                    [checked]="isProjectSelected(project._id)"
                    (change)="toggleProject(project._id)">
                    {{ project.name }}
                    <mat-chip class="info-chip">{{ getClientName(project.clientId) }}</mat-chip>
                  </mat-checkbox>
                </mat-list-item>
              }
              @empty {
                <mat-list-item>No hay proyectos disponibles</mat-list-item>
              }
            </mat-list>
          </div>
        </mat-tab>

        <!-- Tab 3: Áreas -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>category</mat-icon>
            <span>Áreas ({{ selectedAreas().length }})</span>
          </ng-template>

          <div class="tab-content">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Buscar área</mat-label>
              <input matInput [(ngModel)]="areaSearch" placeholder="Nombre del área...">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <mat-list>
              @for (area of filteredAreas(); track area._id) {
                <mat-list-item>
                  <mat-checkbox 
                    [checked]="isAreaSelected(area._id)"
                    (change)="toggleArea(area._id)">
                    {{ area.name }}
                    <mat-chip class="info-chip">{{ area.description }}</mat-chip>
                  </mat-checkbox>
                </mat-list-item>
              }
              @empty {
                <mat-list-item>No hay áreas disponibles</mat-list-item>
              }
            </mat-list>
          </div>
        </mat-tab>
      </mat-tab-group>

      <!-- Resumen de cambios -->
      <div class="summary">
        <h3>Resumen de Asignaciones</h3>
        @if (selectedClients().length > 0) {
          <div class="summary-item">
            <strong>Clientes:</strong>
            @for (id of selectedClients(); track id) {
              <mat-chip>{{ getClientName(id) }}</mat-chip>
            }
          </div>
        }
        @if (selectedProjects().length > 0) {
          <div class="summary-item">
            <strong>Proyectos:</strong>
            @for (id of selectedProjects(); track id) {
              <mat-chip>{{ getProjectName(id) }}</mat-chip>
            }
          </div>
        }
        @if (selectedAreas().length > 0) {
          <div class="summary-item">
            <strong>Áreas:</strong>
            @for (id of selectedAreas(); track id) {
              <mat-chip>{{ getAreaName(id) }}</mat-chip>
            }
          </div>
        }
        @if (selectedClients().length === 0 && selectedProjects().length === 0 && selectedAreas().length === 0) {
          <p class="no-selection">Sin asignaciones seleccionadas</p>
        }
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancelar</button>
      <button mat-raised-button color="primary" (click)="saveAssignments()" [disabled]="loading()">
        <mat-icon>save</mat-icon>
        Guardar Cambios
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .tab-content {
      padding: 16px;
      max-height: 400px;
      overflow-y: auto;
    }

    .search-field {
      width: 100%;
      margin-bottom: 16px;
    }

    mat-list-item {
      padding: 8px 0;
    }

    .info-chip {
      margin-left: 8px;
      font-size: 11px;
    }

    .summary {
      margin-top: 24px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 4px;
    }

    .summary h3 {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: rgba(0,0,0,0.7);
    }

    .summary-item {
      margin-bottom: 12px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }

    .summary-item strong {
      min-width: 80px;
    }

    .no-selection {
      color: rgba(0,0,0,0.5);
      font-style: italic;
      margin: 0;
    }

    mat-dialog-actions {
      margin-top: 24px;
    }
  `]
})
export class UserAssignmentDialogComponent implements OnInit {
  dialogRef = inject(MatDialogRef<UserAssignmentDialogComponent>);
  @Inject(MAT_DIALOG_DATA) data: AssignmentData = { userId: '', userName: '' };
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);

  loading = signal(false);
  
  clients = signal<any[]>([]);
  projects = signal<any[]>([]);
  areas = signal<any[]>([]);

  selectedClients = signal<string[]>([]);
  selectedProjects = signal<string[]>([]);
  selectedAreas = signal<string[]>([]);

  clientSearch = '';
  projectSearch = '';
  areaSearch = '';
  projectClientFilter = '';

  ngOnInit(): void {
    this.loadData();
    // Inicializar selecciones previas
    if (this.data.currentAssignments) {
      this.selectedClients.set(this.data.currentAssignments.clients || []);
      this.selectedProjects.set(this.data.currentAssignments.projects || []);
      this.selectedAreas.set(this.data.currentAssignments.areas || []);
    }
  }

  loadData(): void {
    this.loading.set(true);
    Promise.all([
      this.http.get<any[]>(`${environment.apiUrl}/clients`).toPromise(),
      this.http.get<any[]>(`${environment.apiUrl}/projects`).toPromise(),
      this.http.get<any[]>(`${environment.apiUrl}/areas`).toPromise()
    ]).then(([clients, projects, areas]) => {
      this.clients.set(clients || []);
      this.projects.set(projects || []);
      this.areas.set(areas || []);
      this.loading.set(false);
    }).catch(err => {
      console.error('Error cargando datos:', err);
      this.snackBar.open('Error cargando datos', 'Cerrar', { duration: 3000 });
      this.loading.set(false);
    });
  }

  filteredClients() {
    return this.clients().filter(c =>
      c.name.toLowerCase().includes(this.clientSearch.toLowerCase())
    );
  }

  filteredProjects() {
    return this.projects().filter(p => {
      const matchClient = !this.projectClientFilter || p.clientId === this.projectClientFilter;
      const matchSearch = p.name.toLowerCase().includes(this.projectSearch.toLowerCase());
      return matchClient && matchSearch;
    });
  }

  filteredAreas() {
    return this.areas().filter(a =>
      a.name.toLowerCase().includes(this.areaSearch.toLowerCase())
    );
  }

  isClientSelected(clientId: string): boolean {
    return this.selectedClients().includes(clientId);
  }

  isProjectSelected(projectId: string): boolean {
    return this.selectedProjects().includes(projectId);
  }

  isAreaSelected(areaId: string): boolean {
    return this.selectedAreas().includes(areaId);
  }

  toggleClient(clientId: string): void {
    const current = this.selectedClients();
    const updated = current.includes(clientId)
      ? current.filter(id => id !== clientId)
      : [...current, clientId];
    this.selectedClients.set(updated);
  }

  toggleProject(projectId: string): void {
    const current = this.selectedProjects();
    const updated = current.includes(projectId)
      ? current.filter(id => id !== projectId)
      : [...current, projectId];
    this.selectedProjects.set(updated);
  }

  toggleArea(areaId: string): void {
    const current = this.selectedAreas();
    const updated = current.includes(areaId)
      ? current.filter(id => id !== areaId)
      : [...current, areaId];
    this.selectedAreas.set(updated);
  }

  getClientName(clientId: string): string {
    return this.clients().find(c => c._id === clientId)?.name || 'N/A';
  }

  getProjectName(projectId: string): string {
    return this.projects().find(p => p._id === projectId)?.name || 'N/A';
  }

  getAreaName(areaId: string): string {
    return this.areas().find(a => a._id === areaId)?.name || 'N/A';
  }

  saveAssignments(): void {
    this.loading.set(true);
    const payload = {
      clientIds: this.selectedClients(),
      projectIds: this.selectedProjects(),
      areaIds: this.selectedAreas()
    };

    this.http.post(`${environment.apiUrl}/auth/users/${this.data.userId}/assignments`, payload)
      .subscribe({
        next: () => {
          this.snackBar.open('Asignaciones actualizadas', 'Cerrar', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error('Error guardando asignaciones:', err);
          this.snackBar.open('Error al guardar asignaciones', 'Cerrar', { duration: 3000 });
          this.loading.set(false);
        }
      });
  }
}

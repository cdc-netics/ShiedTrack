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
import { AuthService } from '../../../core/services/auth.service';
import { AreaDialogComponent } from './area-dialog.component';

interface Area {
  _id: string;
  name: string;
  code: string;
  clientId: any;
  description?: string;
  isActive: boolean;
  createdAt: string;
  admins?: any[];
}

@Component({
  selector: 'app-area-list',
  standalone: true,
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
    <div class="area-container">
      <div class="header">
        <h1>🏢 Gestión de Áreas</h1>
        <button mat-raised-button color="primary" (click)="openAreaDialog()">
          <mat-icon>add</mat-icon>
          Nueva Área
        </button>
      </div>

      <div class="filters">
        <mat-form-field appearance="outline">
          <mat-label>Buscar</mat-label>
          <input matInput [(ngModel)]="searchTerm" 
                 (ngModelChange)="applyFilters()"
                 placeholder="Nombre, código...">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        @if (isOwner()) {
          <mat-form-field appearance="outline">
            <mat-label>Cliente</mat-label>
            <mat-select [(ngModel)]="selectedClient" (ngModelChange)="loadAreas()">
              <mat-option value="">Todos</mat-option>
              @for (client of clients(); track client._id) {
                <mat-option [value]="client._id">{{ client.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }

        <mat-form-field appearance="outline">
          <mat-label>Estado</mat-label>
          <mat-select [(ngModel)]="statusFilter" (ngModelChange)="applyFilters()">
            <mat-option value="">Todos</mat-option>
            <mat-option value="active">Activas</mat-option>
            <mat-option value="inactive">Inactivas</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <table mat-table [dataSource]="filteredAreas()" class="areas-table">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Nombre</th>
          <td mat-cell *matCellDef="let area">
            <strong>{{ area.name }}</strong>
            @if (area.description) {
              <br><small class="description">{{ area.description }}</small>
            }
          </td>
        </ng-container>

        <ng-container matColumnDef="code">
          <th mat-header-cell *matHeaderCellDef>Código</th>
          <td mat-cell *matCellDef="let area">
            <mat-chip color="primary">{{ area.code }}</mat-chip>
          </td>
        </ng-container>

        @if (isOwner()) {
          <ng-container matColumnDef="client">
            <th mat-header-cell *matHeaderCellDef>Cliente</th>
            <td mat-cell *matCellDef="let area">
              {{ area.clientId?.name || 'N/A' }}
            </td>
          </ng-container>
        }

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Estado</th>
          <td mat-cell *matCellDef="let area">
            @if (area.isActive) {
              <mat-chip color="accent">Activa</mat-chip>
            } @else {
              <mat-chip>Inactiva</mat-chip>
            }
          </td>
        </ng-container>

        <ng-container matColumnDef="createdAt">
          <th mat-header-cell *matHeaderCellDef>Fecha Creación</th>
          <td mat-cell *matCellDef="let area">
            {{ area.createdAt | date:'dd/MM/yyyy' }}
          </td>
        </ng-container>

        <ng-container matColumnDef="admins">
          <th mat-header-cell *matHeaderCellDef>Administradores</th>
          <td mat-cell *matCellDef="let area">
            <div class="admins-cell">
              @if (area.admins && area.admins.length > 0) {
                @for (admin of area.admins; track admin._id) {
                  <mat-chip>{{ admin.firstName }} {{ admin.lastName }}</mat-chip>
                }
              } @else {
                <span class="no-admins">Sin administradores</span>
              }
              <div class="action-buttons">
                <button mat-icon-button (click)="openAreaDialog(area)" matTooltip="Editar área">
                  <mat-icon>edit</mat-icon>
                </button>
                @if (isOwner()) {
                  <button mat-icon-button (click)="deleteArea(area)" matTooltip="Eliminar área" color="warn">
                    <mat-icon>delete</mat-icon>
                  </button>
                }
              </div>
            </div>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>

      @if (loading()) {
        <p class="loading">Cargando áreas...</p>
      }
      @if (!loading() && filteredAreas().length === 0) {
        <div class="no-data">
          <mat-icon>folder_off</mat-icon>
          <p>No hay áreas para mostrar</p>
          <button mat-raised-button color="primary" (click)="openAreaDialog()">
            <mat-icon>add</mat-icon>
            Crear Primera Área
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .area-container {
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

    .areas-table {
      width: 100%;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .description {
      color: #666;
      font-size: 12px;
    }

    .loading, .no-data {
      text-align: center;
      padding: 48px;
      color: #666;
    }

    .no-data {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .no-data mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #ccc;
    }

    .admins-cell {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .admins-cell mat-chip {
      font-size: 12px;
    }

    .no-admins {
      color: #999;
      font-style: italic;
      font-size: 13px;
    }

    .action-buttons {
      margin-left: auto;
      display: flex;
      gap: 4px;
    }

    @media (max-width: 768px) {
      .filters {
        flex-direction: column;
      }

      .filters mat-form-field {
        max-width: 100%;
      }
    }
  `]
})
export class AreaListComponent implements OnInit {
  // Dependencias para red, dialogos y permisos
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);
  
  // Estado local y filtros de la vista
  areas = signal<Area[]>([]);
  clients = signal<any[]>([]);
  loading = signal(false);
  searchTerm = '';
  statusFilter = '';
  selectedClient = '';
  
  filteredAreas = signal<Area[]>([]);

  get displayedColumns(): string[] {
    // El listado cambia si el usuario es OWNER (muestra cliente)
    const cols = ['name', 'code'];
    if (this.isOwner()) cols.push('client');
    cols.push('status', 'createdAt', 'admins');
    return cols;
  }

  isOwner(): boolean {
    // Helper para permisos basicos
    return this.authService.currentUser()?.role === 'OWNER';
  }

  ngOnInit(): void {
    // Carga inicial depende del rol (OWNER puede elegir cliente)
    if (this.isOwner()) {
      this.loadClients();
    } else {
      this.selectedClient = this.authService.currentUser()?.clientId || '';
      this.loadAreas();
    }
  }

  loadClients(): void {
    // Carga catalogo de clientes para filtro OWNER
    this.http.get<any[]>('http://localhost:3000/api/clients').subscribe({
      next: (data) => {
        this.clients.set(data);
        if (data.length > 0) {
          this.selectedClient = data[0]._id;
          this.loadAreas();
        }
      },
      error: (err) => {
        console.error('Error al cargar clientes:', err);
        this.snackBar.open('Error al cargar clientes', 'Cerrar', { duration: 3000 });
      }
    });
  }

  loadAreas(): void {
    // Recupera areas del cliente seleccionado con inactivas
    if (!this.selectedClient) return;
    
    this.loading.set(true);
    this.http.get<Area[]>(`http://localhost:3000/api/areas?clientId=${this.selectedClient}&includeInactive=true`).subscribe({
      next: (data) => {
        this.areas.set(data);
        this.filteredAreas.set(data);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar áreas:', err);
        this.snackBar.open('Error al cargar áreas', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  applyFilters(): void {
    // Aplica filtros por texto y estado sobre el cache local
    let filtered = this.areas();

    // Filtro por búsqueda
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(term) || 
        a.code.toLowerCase().includes(term) ||
        a.description?.toLowerCase().includes(term)
      );
    }

    // Filtro por estado
    if (this.statusFilter === 'active') {
      filtered = filtered.filter(a => a.isActive);
    } else if (this.statusFilter === 'inactive') {
      filtered = filtered.filter(a => !a.isActive);
    }

    this.filteredAreas.set(filtered);
  }

  openAreaDialog(area?: Area): void {
    // Abre dialogo de creacion/edicion
    const dialogRef = this.dialog.open(AreaDialogComponent, {
      width: '600px',
      data: { area, clientId: this.selectedClient }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadAreas();
      }
    });
  }

  toggleAreaStatus(area: Area): void {
    // Activa o desactiva un area con confirmacion
    const action = area.isActive ? 'desactivar' : 'activar';
    const confirmed = confirm(`¿Está seguro de ${action} el área "${area.name}"?`);
    if (!confirmed) return;

    this.http.put(`http://localhost:3000/api/areas/${area._id}`, { isActive: !area.isActive }).subscribe({
      next: () => {
        this.snackBar.open(`Área ${area.isActive ? 'desactivada' : 'activada'}`, 'Cerrar', { duration: 3000 });
        this.loadAreas();
      },
      error: (err) => {
        console.error('Error al cambiar estado:', err);
        this.snackBar.open('Error al cambiar estado del área', 'Cerrar', { duration: 3000 });
      }
    });
  }

  deleteArea(area: Area): void {
    // Eliminacion fuerte con doble confirmacion manual
    const confirmed = confirm(
      `¿Está seguro de eliminar permanentemente el área "${area.name}"?\n\n` +
      `Esta acción NO se puede deshacer y eliminará:\n` +
      `- El área y su configuración\n` +
      `- Las asignaciones de usuarios a esta área\n` +
      `- Los proyectos asociados (si los hay)\n\n` +
      `Escriba el nombre del área para confirmar.`
    );
    
    if (!confirmed) return;

    const confirmation = prompt(`Para confirmar, escriba: ${area.name}`);
    if (confirmation !== area.name) {
      this.snackBar.open('Nombre incorrecto. Eliminación cancelada.', 'Cerrar', { duration: 3000 });
      return;
    }

    this.http.delete(`http://localhost:3000/api/areas/${area._id}/hard`).subscribe({
      next: () => {
        this.snackBar.open('Área eliminada permanentemente', 'Cerrar', { duration: 3000 });
        this.loadAreas();
      },
      error: (err) => {
        console.error('Error al eliminar área:', err);
        this.snackBar.open('Error al eliminar área', 'Cerrar', { duration: 3000 });
      }
    });
  }
}

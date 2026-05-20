import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu'; // Added
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { ClientDialogComponent } from '../client-dialog/client-dialog.component';
import { environment } from '../../../../environments/environment'; // Standardize env usage

/**
 * Componente de Lista de Clientes
 * Gestión de clientes a los que se les presta servicios
 */
@Component({
  standalone: true,
    selector: 'app-client-list',
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
        MatTooltipModule,
        MatProgressSpinnerModule,
        MatDialogModule,
        MatSnackBarModule,
        MatMenuModule // Added
    ],
    template: `
    <div class="list-page list-page--narrow ui-stack">
      <header class="ui-screen-toolbar">
        <h1 class="ui-screen-title">Clientes</h1>
      </header>

      <section class="ui-cluster ui-cluster--between" aria-label="Filtros y acciones">
        <button mat-raised-button color="primary" type="button" (click)="openClientDialog()">
          <mat-icon aria-hidden="true">add</mat-icon>
          Nuevo cliente
        </button>
        <div class="ui-cluster">
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Buscar</mat-label>
            <input matInput [ngModel]="searchTerm()" 
                   (ngModelChange)="searchTerm.set($event); applyFilters()"
                   placeholder="Buscar por nombre…"
                   aria-label="Filtrar clientes por nombre">
            <mat-icon matSuffix aria-hidden="true">search</mat-icon>
          </mat-form-field>
          <button mat-icon-button type="button" (click)="loadClients()" matTooltip="Actualizar lista" aria-label="Actualizar lista">
            <mat-icon aria-hidden="true">refresh</mat-icon>
          </button>
        </div>
      </section>

      <section class="ui-data-panel" aria-labelledby="clients-table-heading">
        <h2 id="clients-table-heading" class="sr-only">Listado de clientes</h2>
        @if (loading()) {
          <div class="ui-loading-block">
            <mat-spinner aria-label="Cargando clientes"></mat-spinner>
            <p>Cargando clientes…</p>
          </div>
        } @else if (filteredClients().length === 0) {
          <div class="ui-empty-state">
            <mat-icon aria-hidden="true">business_center</mat-icon>
            <p class="ui-empty-state__title">No hay clientes</p>
            <p>Crea tu primer cliente o tenant para comenzar.</p>
            <button mat-raised-button color="primary" type="button" (click)="openClientDialog()">
              <mat-icon aria-hidden="true">add</mat-icon>
              Crear cliente
            </button>
          </div>
        } @else {
          <div class="ui-table-scroll">
          <table mat-table [dataSource]="filteredClients()" class="clients-table">
            <!-- Columna Nombre -->
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Nombre</th>
              <td mat-cell *matCellDef="let client">
                <div class="client-name">
                  <span class="name">{{ client.name }}</span>
                  @if (client.description) {
                    <span class="description">{{ client.description }}</span>
                  }
                </div>
              </td>
            </ng-container>

            <!-- Columna Proyectos -->
            <ng-container matColumnDef="projects">
              <th mat-header-cell *matHeaderCellDef>Proyectos</th>
              <td mat-cell *matCellDef="let client">
                <span class="badge">{{ client.projectsCount || 0 }}</span>
              </td>
            </ng-container>

            <!-- Columna Estado -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let client">
                <mat-chip [class]="client.isActive ? 'status-active' : 'status-inactive'">
                  {{ client.isActive ? 'Activo' : 'Inactivo' }}
                </mat-chip>
              </td>
            </ng-container>

            <!-- Columna Fecha Creación -->
            <ng-container matColumnDef="created">
              <th mat-header-cell *matHeaderCellDef>Creado</th>
              <td mat-cell *matCellDef="let client">
                <small>{{ formatDate(client.createdAt) }}</small>
              </td>
            </ng-container>

            <!-- Columna Acciones -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Acciones</th>
              <td mat-cell *matCellDef="let client">
                <button mat-icon-button (click)="openClientDialog(client); $event.stopPropagation()" 
                        matTooltip="Editar cliente">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button [routerLink]="['/clients', client._id]" (click)="$event.stopPropagation()"
                        matTooltip="Ver detalles">
                  <mat-icon>visibility</mat-icon>
                </button>
                <button mat-icon-button [matMenuTriggerFor]="exportMenu" matTooltip="Exportar datos" (click)="$event.stopPropagation()">
                  <mat-icon>cloud_download</mat-icon>
                </button>
                <mat-menu #exportMenu="matMenu">
                  <button mat-menu-item (click)="exportClientZip(client._id)">
                    <mat-icon>folder_zip</mat-icon>
                    <span>Portfolio Completo (ZIP)</span>
                  </button>
                  <button mat-menu-item (click)="exportClientCSV(client._id)">
                    <mat-icon>grid_on</mat-icon>
                    <span>Reporte General (CSV)</span>
                  </button>
                </mat-menu>
                <button mat-icon-button (click)="deleteClient(client); $event.stopPropagation()" 
                        matTooltip="Eliminar" color="warn">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="clickable-row" (click)="openClientDetails(row)"></tr>
          </table>
          </div>
        }
      </section>
    </div>
  `,
    styles: [`
    .filter-field {
      width: min(100%, 280px);
    }

    .clients-table {
      width: 100%;
    }

    .clickable-row {
      cursor: pointer;
    }

    .client-name {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .client-name .name {
      font-weight: 500;
      color: #212121;
    }

    .client-name .description {
      font-size: 12px;
      color: #757575;
    }

    .contact-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
    }

    .contact-item mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #757575;
    }

    .badge {
      background: #2196f3;
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 13px;
    }

    .status-active {
      background: #4caf50;
      color: white;
      font-weight: 600;
    }

    .status-inactive {
      background: #9e9e9e;
      color: white;
      font-weight: 600;
    }

    .ui-empty-state__title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1f2937;
    }
  `]
})
export class ClientListComponent implements OnInit {
  // Servicios de red y UI
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private readonly API_URL = `${environment.apiUrl}/clients`;
  
  // Columnas visibles en la tabla
  displayedColumns = ['name', 'projects', 'status', 'created', 'actions'];
  
  // Estado local y filtros del listado
  clients = signal<any[]>([]);
  searchTerm = signal('');
  filteredClients = signal<any[]>([]);
  loading = signal(false);

  ngOnInit() {
    // Carga inicial para poblar el listado
    this.loadClients();
  }

  loadClients() {
    // Consulta principal al backend con manejo de estado de carga
    this.loading.set(true);
    this.http.get<any[]>(this.API_URL).subscribe({
      next: (clients) => {
        this.clients.set(clients);
        this.loading.set(false);
        this.applyFilters();
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Error al cargar clientes', 'Cerrar', { duration: 3000 });
      }
    });
  }

  openClientDialog(client?: any): void {
    // Abre dialogo de alta/edicion y recarga al cerrar si hay cambios
    const dialogRef = this.dialog.open(ClientDialogComponent, {
      width: '600px',
      data: client
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadClients();
      }
    });
  }

  deleteClient(client: any): void {
    // Eliminacion con confirmacion explicita del usuario
    const confirmed = confirm(`¿Está seguro de eliminar el cliente "${client.name}"?`);
    if (!confirmed) return;

    this.http.delete(`${this.API_URL}/${client._id}`).subscribe({
      next: () => {
        this.snackBar.open('Cliente eliminado', 'Cerrar', { duration: 3000 });
        this.loadClients();
      },
      error: (err) => {
        console.error('Error al eliminar cliente:', err);
        this.snackBar.open('Error al eliminar cliente', 'Cerrar', { duration: 3000 });
      }
    });
  }

  applyFilters() {
    // Filtra por texto en nombre o descripcion
    let clients = this.clients();
    
    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      clients = clients.filter(c => 
        c.name.toLowerCase().includes(term) ||
        c.description?.toLowerCase().includes(term)
      );
    }
    
    this.filteredClients.set(clients);
  }

  formatDate(date: any): string {
    // Normaliza fechas nulas o indefinidas
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-ES');
  }

  exportClientZip(clientId: string) {
    console.log('📥 Exportando portfolio ZIP de cliente:', clientId);
    const url = `${environment.apiUrl}/export/client/${clientId}/portfolio`;
    
    // Usar HttpClient para incluir el token JWT automáticamente
    this.http.get(url, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        console.log('✅ Portfolio recibido, tamaño:', blob.size, 'bytes');
        if (blob && blob.size > 0) {
          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `cliente_${clientId}_portfolio_${Date.now()}.zip`;
          link.click();
          window.URL.revokeObjectURL(downloadUrl);
          this.snackBar.open('Portfolio exportado correctamente', 'Cerrar', { duration: 3000 });
        } else {
          this.snackBar.open('El portfolio está vacío', 'Cerrar', { duration: 3000 });
        }
      },
      error: (err) => {
        console.error('❌ Error exportando portfolio:', err);
        this.snackBar.open(
          err.error?.message || 'Error al exportar portfolio',
          'Cerrar',
          { duration: 5000 }
        );
      }
    });
  }

  exportClientCSV(clientId: string) {
    console.log('📥 Exportando CSV de cliente:', clientId);
    const url = `${environment.apiUrl}/export/client/${clientId}/csv`;
    
    // Usar HttpClient para incluir el token JWT automáticamente
    this.http.get(url, { responseType: 'text' }).subscribe({
      next: (csv) => {
        console.log('✅ CSV recibido');
        const blob = new Blob([csv], { type: 'text/csv' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `cliente_${clientId}_hallazgos_${Date.now()}.csv`;
        link.click();
        window.URL.revokeObjectURL(downloadUrl);
        this.snackBar.open('CSV exportado correctamente', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        console.error('❌ Error exportando CSV:', err);
        this.snackBar.open(
          err.error?.message || 'Error al exportar CSV',
          'Cerrar',
          { duration: 5000 }
        );
      }
    });
  }

  openClientDetails(client: any): void {
    if (!client?._id) return;
    void this.router.navigate(['/clients', client._id]);
  }
}

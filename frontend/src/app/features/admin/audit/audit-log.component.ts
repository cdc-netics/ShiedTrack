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

@Component({
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
          <mat-label>Usuario</mat-label>
          <input matInput [(ngModel)]="userFilter" placeholder="Buscar por usuario...">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Acción</mat-label>
          <mat-select [(ngModel)]="actionFilter">
            <mat-option value="">Todas</mat-option>
            <mat-option value="CREATE">Crear</mat-option>
            <mat-option value="UPDATE">Actualizar</mat-option>
            <mat-option value="DELETE">Eliminar</mat-option>
            <mat-option value="LOGIN">Login</mat-option>
            <mat-option value="LOGOUT">Logout</mat-option>
            <mat-option value="EXPORT">Exportar</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Entidad</mat-label>
          <mat-select [(ngModel)]="entityFilter">
            <mat-option value="">Todas</mat-option>
            <mat-option value="Finding">Hallazgo</mat-option>
            <mat-option value="Project">Proyecto</mat-option>
            <mat-option value="User">Usuario</mat-option>
            <mat-option value="Client">Cliente</mat-option>
            <mat-option value="Area">Área</mat-option>
          </mat-select>
        </mat-form-field>

        <button mat-raised-button color="primary" (click)="loadLogs()">
          <mat-icon>refresh</mat-icon>
          Filtrar
        </button>
      </div>

      <table mat-table [dataSource]="auditLogs()" class="audit-table">
        <ng-container matColumnDef="createdAt">
          <th mat-header-cell *matHeaderCellDef>Fecha/Hora</th>
          <td mat-cell *matCellDef="let log">{{ log.createdAt | date:'medium' }}</td>
        </ng-container>

        <ng-container matColumnDef="userId">
          <th mat-header-cell *matHeaderCellDef>Usuario</th>
          <td mat-cell *matCellDef="let log">{{ log.userId }}</td>
        </ng-container>

        <ng-container matColumnDef="action">
          <th mat-header-cell *matHeaderCellDef>Acción</th>
          <td mat-cell *matCellDef="let log">
            <mat-chip [class]="'action-' + log.action.toLowerCase()">
              {{ log.action }}
            </mat-chip>
          </td>
        </ng-container>

        <ng-container matColumnDef="entityType">
          <th mat-header-cell *matHeaderCellDef>Entidad</th>
          <td mat-cell *matCellDef="let log">{{ log.entityType }}</td>
        </ng-container>

        <ng-container matColumnDef="entityId">
          <th mat-header-cell *matHeaderCellDef>ID</th>
          <td mat-cell *matCellDef="let log">{{ log.entityId }}</td>
        </ng-container>

        <ng-container matColumnDef="description">
          <th mat-header-cell *matHeaderCellDef>Descripción</th>
          <td mat-cell *matCellDef="let log">{{ log.description || '-' }}</td>
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

    .filters {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
    }

    .filters mat-form-field {
      flex: 1;
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

    .filters {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      align-items: flex-end;
    }

    mat-form-field {
      flex: 1;
      min-width: 200px;
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

  // UI State
  loading = signal(false);
  displayedColumns = ['createdAt', 'userId', 'action', 'entityType', 'entityId', 'description'];
  auditLogs = signal<any[]>([]);
  totalRecords = signal(0);
  
  // Filters
  userFilter = '';
  actionFilter = '';
  entityFilter = '';
  pageSize = 25;
  currentPage = 0;

  ngOnInit() {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading.set(true);
    const params: any = {
      limit: 100,
    };

    if (this.actionFilter) params.action = this.actionFilter;
    if (this.entityFilter) params.entityType = this.entityFilter;

    this.http.get<any[]>(`${environment.apiUrl}/audit/logs`, { params })
      .subscribe({
        next: (logs) => {
          // Filtrar por usuario en el cliente si es necesario
          let filtered = logs;
          if (this.userFilter) {
            filtered = logs.filter(log => 
              log.userId?.toLowerCase().includes(this.userFilter.toLowerCase())
            );
          }
          
          this.auditLogs.set(filtered);
          this.totalRecords.set(filtered.length);
          this.loading.set(false);
        },
        error: (err: any) => {
          console.error('Error cargando logs de auditoría:', err);
          this.snackBar.open('Error cargando logs de auditoría', 'Cerrar', { duration: 3000 });
          this.loading.set(false);
        }
      });
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
  }
}

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    FormsModule
  ],
  template: `
    <div class="audit-container">
      <h1>📜 Registro de Auditoría</h1>

      <div class="filters">
        <mat-form-field appearance="outline">
          <mat-label>Usuario</mat-label>
          <input matInput placeholder="Buscar por usuario...">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Acción</mat-label>
          <mat-select>
            <mat-option value="">Todas</mat-option>
            <mat-option value="CREATE">Crear</mat-option>
            <mat-option value="UPDATE">Actualizar</mat-option>
            <mat-option value="DELETE">Eliminar</mat-option>
            <mat-option value="LOGIN">Login</mat-option>
            <mat-option value="LOGOUT">Logout</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Entidad</mat-label>
          <mat-select>
            <mat-option value="">Todas</mat-option>
            <mat-option value="Finding">Hallazgo</mat-option>
            <mat-option value="Project">Proyecto</mat-option>
            <mat-option value="User">Usuario</mat-option>
            <mat-option value="Client">Cliente</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <table mat-table [dataSource]="auditLogs()" class="audit-table">
        <ng-container matColumnDef="timestamp">
          <th mat-header-cell *matHeaderCellDef>Fecha/Hora</th>
          <td mat-cell *matCellDef="let log">{{ log.timestamp }}</td>
        </ng-container>

        <ng-container matColumnDef="user">
          <th mat-header-cell *matHeaderCellDef>Usuario</th>
          <td mat-cell *matCellDef="let log">{{ log.user }}</td>
        </ng-container>

        <ng-container matColumnDef="action">
          <th mat-header-cell *matHeaderCellDef>Acción</th>
          <td mat-cell *matCellDef="let log">
            <mat-chip [class]="'action-' + log.action.toLowerCase()">
              {{ log.action }}
            </mat-chip>
          </td>
        </ng-container>

        <ng-container matColumnDef="entity">
          <th mat-header-cell *matHeaderCellDef>Entidad</th>
          <td mat-cell *matCellDef="let log">{{ log.entity }}</td>
        </ng-container>

        <ng-container matColumnDef="entityId">
          <th mat-header-cell *matHeaderCellDef>ID</th>
          <td mat-cell *matCellDef="let log">{{ log.entityId }}</td>
        </ng-container>

        <ng-container matColumnDef="description">
          <th mat-header-cell *matHeaderCellDef>Descripción</th>
          <td mat-cell *matCellDef="let log">{{ log.description }}</td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
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
  `]
})
export class AuditLogComponent {
  // Columnas fijas del registro
  displayedColumns = ['timestamp', 'user', 'action', 'entity', 'entityId', 'description'];
  
  // Datos mock para UI mientras se integra backend
  auditLogs = signal([
    {
      timestamp: '2025-12-22 10:45:23',
      user: 'Admin User',
      action: 'CREATE',
      entity: 'Finding',
      entityId: 'FND-001',
      description: 'Creó hallazgo SQL Injection en proyecto Web App'
    },
    {
      timestamp: '2025-12-22 10:30:15',
      user: 'Admin User',
      action: 'LOGIN',
      entity: 'User',
      entityId: 'admin@shieldtrack.com',
      description: 'Inicio de sesión exitoso'
    },
    {
      timestamp: '2025-12-22 09:15:42',
      user: 'Auditor 1',
      action: 'UPDATE',
      entity: 'Finding',
      entityId: 'FND-002',
      description: 'Actualizó estado a CLOSED'
    }
  ]);
}

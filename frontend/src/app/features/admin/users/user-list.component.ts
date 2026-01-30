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
import { User } from '../../../shared/models';
import { UserDialogComponent } from './user-dialog.component';
import { AssignAreasDialogComponent } from './assign-areas-dialog.component';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-user-list',
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
    <div class="user-container">
      <div class="header">
        <h1>👥 Gestión de Usuarios</h1>
        <button mat-raised-button color="primary" (click)="openUserDialog()">
          <mat-icon>add</mat-icon>
          Nuevo Usuario
        </button>
      </div>

      <div class="filters">
        <mat-form-field appearance="outline">
          <mat-label>Buscar</mat-label>
          <input matInput [ngModel]="searchTerm()" 
                 (ngModelChange)="searchTerm.set($event)"
                 placeholder="Nombre, email...">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Rol</mat-label>
          <mat-select [ngModel]="roleFilter()" (ngModelChange)="roleFilter.set($event)">
            <mat-option value="">Todos</mat-option>
            <mat-option value="OWNER">Owner</mat-option>

            <mat-option value="TENANT_ADMIN">Admin Tenant</mat-option>
            <mat-option value="ANALYST">Analista</mat-option>
            <mat-option value="VIEWER">Visor</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <table mat-table [dataSource]="filteredUsers()" class="users-table">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Nombre</th>
          <td mat-cell *matCellDef="let user">
            {{ user.firstName }} {{ user.lastName }}
          </td>
        </ng-container>

        <ng-container matColumnDef="email">
          <th mat-header-cell *matHeaderCellDef>Email</th>
          <td mat-cell *matCellDef="let user">{{ user.email }}</td>
        </ng-container>

        <ng-container matColumnDef="role">
          <th mat-header-cell *matHeaderCellDef>Rol</th>
          <td mat-cell *matCellDef="let user">
            <mat-chip [class]="'role-' + user.role.toLowerCase()">
              {{ getRoleName(user.role) }}
            </mat-chip>
          </td>
        </ng-container>

        <ng-container matColumnDef="mfa">
          <th mat-header-cell *matHeaderCellDef>MFA</th>
          <td mat-cell *matCellDef="let user">
            @if (user.mfaEnabled) {
              <mat-icon class="success">check_circle</mat-icon>
            } @else {
              <mat-icon class="disabled">cancel</mat-icon>
            }
          </td>
        </ng-container>

        <ng-container matColumnDef="active">
          <th mat-header-cell *matHeaderCellDef>Estado</th>
          <td mat-cell *matCellDef="let user">
            @if (user.isActive) {
              <mat-chip color="accent">Activo</mat-chip>
            } @else {
              <mat-chip>Inactivo</mat-chip>
            }
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Acciones</th>
          <td mat-cell *matCellDef="let user">
            <button mat-icon-button (click)="openUserDialog(user)" matTooltip="Editar">
              <mat-icon>edit</mat-icon>
            </button>
            @if (isOwner()) {
              <button mat-icon-button color="primary" (click)="openAssignAreasDialog(user)" matTooltip="Asignar Áreas">
                <mat-icon>security</mat-icon>
              </button>
            }
            <button mat-icon-button color="warn" (click)="deleteUser(user)" matTooltip="Eliminar">
              <mat-icon>delete</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>

      @if (loading()) {
        <p class="loading">Cargando usuarios...</p>
      }
      @if (!loading() && filteredUsers().length === 0) {
        <p class="no-data">No hay usuarios para mostrar</p>
      }
    </div>
  `,
  styles: [`
    .user-container {
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

    .users-table {
      width: 100%;
      background: white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .users-table th {
      font-weight: 600;
      background: #f5f5f5;
    }

    .role-owner {
      background: #e3f2fd;
      color: #1565c0;
    }

    .role-tenant_admin {
      background: #e1f5fe;
      color: #0277bd;
    }

    .role-analyst {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .role-viewer {
      background: #f5f5f5;
      color: #616161;
    }

    .success {
      color: #4caf50;
    }

    .disabled {
      color: #9e9e9e;
    }

    .loading, .no-data {
      text-align: center;
      padding: 48px;
      color: #666;
    }
  `]
})
export class UserListComponent implements OnInit {
  // Dependencias para red, dialogos y permisos
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);
  
  // Estado local y filtros del listado
  users = signal<User[]>([]);
  loading = signal(false);
  searchTerm = signal('');
  roleFilter = signal('');
  
  displayedColumns = ['name', 'email', 'role', 'mfa', 'active', 'actions'];

  filteredUsers = signal<User[]>([]);
  private API_URL = `${environment.apiUrl}/auth`;

  isOwner(): boolean {
    // Helper de permisos para acciones avanzadas
    return this.authService.currentUser()?.role === 'OWNER';
  }

  ngOnInit(): void {
    // Carga inicial de usuarios
    this.loadUsers();
  }

  loadUsers(): void {
    // Consulta usuarios y actualiza el cache local
    this.loading.set(true);
    this.http.get<User[]>(`${this.API_URL}/users`).subscribe({
      next: (data) => {
        this.users.set(data);
        this.filteredUsers.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar usuarios:', err);
        this.snackBar.open('Error al cargar usuarios', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  openUserDialog(user?: User): void {
    // Abre dialogo de alta/edicion
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '600px',
      data: user
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  openAssignAreasDialog(user: User): void {
    // Asigna areas a un usuario (solo OWNER)
    const dialogRef = this.dialog.open(AssignAreasDialogComponent, {
      width: '600px',
      data: { user }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Áreas actualizadas correctamente', 'Cerrar', { duration: 3000 });
        this.loadUsers();
      }
    });
  }

  deleteUser(user: User): void {
    // Eliminacion con confirmacion
    const confirmed = confirm(`¿Está seguro de eliminar el usuario "${user.email}"?`);
    if (!confirmed) return;

    this.http.delete(`${this.API_URL}/users/${user._id}`).subscribe({
      next: () => {
        this.snackBar.open('Usuario eliminado', 'Cerrar', { duration: 3000 });
        this.loadUsers();
      },
      error: (err) => {
        console.error('Error al eliminar usuario:', err);
        this.snackBar.open('Error al eliminar usuario', 'Cerrar', { duration: 3000 });
      }
    });
  }

  getRoleName(role: string): string {
    // Mapea roles a etiquetas mas amigables
    const roleMap: Record<string, string> = {
      'OWNER': 'Owner',

      'TENANT_ADMIN': 'Admin Tenant',
      'ANALYST': 'Analista',
      'VIEWER': 'Visor'
    };
    return roleMap[role] || role;
  }
}

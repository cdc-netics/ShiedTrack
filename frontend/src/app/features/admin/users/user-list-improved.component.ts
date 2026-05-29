import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { HttpClient } from '@angular/common/http';
import { User } from '../../../shared/models';
import { environment } from '../../../../environments/environment';
import { UserAssignmentDialogComponent } from './user-assignment-dialog.component';
import { UserDialogComponent } from './user-dialog.component';

/**
 * Lista mejorada de usuarios con acciones rápidas
 * - Quick-block/unblock
 * - Quick-assign a clientes/proyectos/áreas
 * - Cambio rápido de rol
 */
@Component({
  standalone: true,
  selector: 'app-user-list-improved',
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatTooltipModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  template: `
    <mat-card class="users-container">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>people</mat-icon>
          Gestión Rápida de Usuarios
        </mat-card-title>
      </mat-card-header>

      <mat-card-content>
        <!-- Filtros -->
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
              <mat-option value="ADMIN_AREA">Admin Area</mat-option>
              <mat-option value="PENTESTER">Pentester</mat-option>
              <mat-option value="QA">QA</mat-option>
              <mat-option value="NORMAL_USER">Usuario Normal</mat-option>
              <mat-option value="AUDITOR">Auditor</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Estado</mat-label>
            <mat-select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event)">
              <mat-option value="">Todos</mat-option>
              <mat-option value="active">Activos</mat-option>
              <mat-option value="blocked">Bloqueados</mat-option>
            </mat-select>
          </mat-form-field>

          <button mat-icon-button (click)="loadUsers()" matTooltip="Actualizar">
            <mat-icon>refresh</mat-icon>
          </button>

          <button mat-raised-button color="primary" [matMenuTriggerFor]="createUserMenu">
            <mat-icon>person_add</mat-icon>
            Crear usuario
          </button>
          <mat-menu #createUserMenu="matMenu">
            <button mat-menu-item (click)="createUser('OWNER')">
              <mat-icon>stars</mat-icon>
              <span>Owner</span>
            </button>
            <button mat-menu-item (click)="createUser('ADMIN_AREA')">
              <mat-icon>admin_panel_settings</mat-icon>
              <span>Admin Area</span>
            </button>
            <button mat-menu-item (click)="createUser('PENTESTER')">
              <mat-icon>bug_report</mat-icon>
              <span>Pentester</span>
            </button>
            <button mat-menu-item (click)="createUser('QA')">
              <mat-icon>fact_check</mat-icon>
              <span>QA</span>
            </button>
            <button mat-menu-item (click)="createUser('NORMAL_USER')">
              <mat-icon>person</mat-icon>
              <span>Usuario Normal</span>
            </button>
            <button mat-menu-item (click)="createUser('AUDITOR')">
              <mat-icon>visibility</mat-icon>
              <span>Auditor</span>
            </button>
          </mat-menu>
        </div>

        <!-- Tabla de usuarios -->
        <table mat-table [dataSource]="filteredUsers()" class="users-table">

          <!-- Nombre -->
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nombre</th>
            <td mat-cell *matCellDef="let user">
              <div class="user-name">
                <strong>{{ user.firstName }} {{ user.lastName }}</strong>
                <small>{{ user.email }}</small>
              </div>
            </td>
          </ng-container>

          <!-- Rol -->
          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef>Rol</th>
            <td mat-cell *matCellDef="let user">
              <mat-chip [class]="'role-' + (user.role || '').toLowerCase()">
                <mat-icon>{{ getRoleIcon(user.role) }}</mat-icon>
                {{ getRoleName(user.role) }}
              </mat-chip>
            </td>
          </ng-container>

          <!-- MFA -->
          <ng-container matColumnDef="mfa">
            <th mat-header-cell *matHeaderCellDef>MFA</th>
            <td mat-cell *matCellDef="let user">
              @if (user.mfaEnabled) {
                <mat-icon color="primary" matTooltip="MFA Habilitado">verified_user</mat-icon>
              } @else {
                <mat-icon matTooltip="Sin MFA">security</mat-icon>
              }
            </td>
          </ng-container>

          <!-- Estado -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let user">
              @if (isBlocked(user)) {
                <mat-chip class="status-blocked">
                  <mat-icon>block</mat-icon>
                  Bloqueado
                </mat-chip>
              } @else {
                <mat-chip class="status-active">
                  <mat-icon>check_circle</mat-icon>
                  Activo
                </mat-chip>
              }
            </td>
          </ng-container>

          <!-- Acciones Rápidas -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Acciones</th>
            <td mat-cell *matCellDef="let user">
              <div class="actions">
                <!-- Botón Asignar -->
                <button mat-icon-button (click)="openAssignmentDialog(user)"
                        matTooltip="Asignar a clientes/proyectos/áreas"
                        color="primary">
                  <mat-icon>assignment</mat-icon>
                </button>

                <!-- Botón Quick-Block -->
                @if (!isBlocked(user)) {
                  <button mat-icon-button (click)="quickBlock(user)"
                          matTooltip="Bloquear usuario"
                          color="warn">
                    <mat-icon>block</mat-icon>
                  </button>
                } @else {
                  <button mat-icon-button (click)="quickUnblock(user)"
                          matTooltip="Desbloquear usuario"
                          color="primary">
                    <mat-icon>check_circle</mat-icon>
                  </button>
                }

                <button mat-icon-button (click)="deleteUser(user)"
                        matTooltip="Eliminar usuario"
                        color="warn">
                  <mat-icon>delete</mat-icon>
                </button>

                <!-- Menú más opciones -->
                <button mat-icon-button [matMenuTriggerFor]="userMenu">
                  <mat-icon>more_vert</mat-icon>
                </button>
                <mat-menu #userMenu="matMenu">
                  <button mat-menu-item (click)="editUser(user)">
                    <mat-icon>edit</mat-icon>
                    <span>Editar</span>
                  </button>
                  <button mat-menu-item [matMenuTriggerFor]="roleMenu" [matMenuTriggerData]="{ user: user }">
                    <mat-icon>admin_panel_settings</mat-icon>
                    <span>Cambiar Rol</span>
                  </button>
                  <button mat-menu-item (click)="resetPassword(user)">
                    <mat-icon>vpn_key</mat-icon>
                    <span>Reset Contraseña</span>
                  </button>
                  <mat-divider></mat-divider>
                  <button mat-menu-item (click)="viewAssignments(user)">
                    <mat-icon>visibility</mat-icon>
                    <span>Ver Asignaciones</span>
                  </button>
                </mat-menu>
                <mat-menu #roleMenu="matMenu">
                  <ng-template matMenuContent let-user="user">
                    @for (role of availableRoles; track role.value) {
                      <button mat-menu-item
                              (click)="updateUserRole(user, role.value)"
                              [disabled]="user.role === role.value">
                        <mat-icon>{{ role.icon }}</mat-icon>
                        <span>{{ role.label }}</span>
                      </button>
                    }
                  </ng-template>
                </mat-menu>
              </div>
            </td>
          </ng-container>

          <!-- Header y filas -->
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;" [class.deleted]="isBlocked(row)"></tr>
        </table>

        @if (filteredUsers().length === 0) {
          <div class="empty-state">
            <mat-icon>person_search</mat-icon>
            <h3>No se encontraron usuarios</h3>
          </div>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .users-container { margin: 20px; }

    .filters {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .filters mat-form-field {
      flex: 1;
      min-width: 200px;
    }

    .users-table { width: 100%; }

    .user-name {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .user-name small {
      color: rgba(0,0,0,0.6);
      font-size: 12px;
    }

    .actions { display: flex; gap: 4px; }

    .role-owner { background: #d32f2f; color: white; }
    .role-platform_admin { background: #ff6f00; color: white; }
    .role-client_admin { background: #1976d2; color: white; }
    .role-area_admin { background: #388e3c; color: white; }
    .role-analyst { background: #7b1fa2; color: white; }
    .role-viewer { background: #616161; color: white; }
    .role-admin_area { background: #1976d2; color: white; }
    .role-pentester { background: #7b1fa2; color: white; }
    .role-qa { background: #00897b; color: white; }
    .role-normal_user { background: #455a64; color: white; }
    .role-auditor { background: #616161; color: white; }

    .status-active { background: #e8f5e9; color: #2e7d32; }
    .status-blocked { background: #ffebee; color: #c62828; }

    tr.deleted {
      opacity: 0.6;
      background: #fafafa;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: rgba(0,0,0,0.5);
    }

    .empty-state mat-icon {
      font-size: 80px;
      width: 80px;
      height: 80px;
      opacity: 0.3;
      margin-bottom: 16px;
    }
  `]
})
export class UserListImprovedComponent implements OnInit {
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  availableRoles = [
    { value: 'OWNER', label: 'Owner', icon: 'stars' },
    { value: 'ADMIN_AREA', label: 'Admin Area', icon: 'admin_panel_settings' },
    { value: 'PENTESTER', label: 'Pentester', icon: 'bug_report' },
    { value: 'QA', label: 'QA', icon: 'fact_check' },
    { value: 'NORMAL_USER', label: 'Usuario Normal', icon: 'person' },
    { value: 'AUDITOR', label: 'Auditor', icon: 'visibility' }
  ];

  roleChangeOptions = this.availableRoles;

  users = signal<User[]>([]);
  searchTerm = signal('');
  roleFilter = signal('');
  statusFilter = signal('');

  displayedColumns = ['name', 'role', 'mfa', 'status', 'actions'];

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.http.get<User[]>(`${environment.apiUrl}/auth/users`).subscribe({
      next: (data) => this.users.set(data),
      error: (err) => {
        console.error('Error cargando usuarios:', err);
        this.snackBar.open('Error cargando usuarios', 'Cerrar', { duration: 3000 });
      }
    });
  }

  filteredUsers(): User[] {
    let filtered = this.users();

    if (this.searchTerm()) {
      const term = this.searchTerm().toLowerCase();
      filtered = filtered.filter(u =>
        u.firstName?.toLowerCase().includes(term) ||
        u.lastName?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term)
      );
    }

    if (this.roleFilter()) {
      filtered = filtered.filter(u => u.role === this.roleFilter());
    }

    if (this.statusFilter() === 'active') {
      filtered = filtered.filter(u => !this.isBlocked(u));
    } else if (this.statusFilter() === 'blocked') {
      filtered = filtered.filter(u => this.isBlocked(u));
    }

    return filtered;
  }

  quickBlock(user: User): void {
    const userId = this.getUserId(user);
    if (!userId) return;

    if (confirm(`¿Bloquear usuario ${user.email}?`)) {
      this.http.delete(`${environment.apiUrl}/auth/users/${userId}/soft`).subscribe({
        next: () => {
          this.snackBar.open('Usuario bloqueado', 'Cerrar', { duration: 2000 });
          this.loadUsers();
        },
        error: (err) => {
          console.error('Error:', err);
          this.snackBar.open('Error al bloquear usuario', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  isBlocked(user: User): boolean {
    return user.isDeleted === true || user.isActive === false;
  }

  quickUnblock(user: User): void {
    const userId = this.getUserId(user);
    if (!userId) return;

    this.http.post(`${environment.apiUrl}/auth/users/${userId}/reactivate`, {}).subscribe({
      next: () => {
        this.snackBar.open('Usuario desbloqueado', 'Cerrar', { duration: 2000 });
        this.loadUsers();
      },
      error: (err) => {
        console.error('Error:', err);
        this.snackBar.open('Error al desbloquear usuario', 'Cerrar', { duration: 3000 });
      }
    });
  }


  deleteUser(user: User): void {
    this.quickBlock(user);
  }

  /**
   * Actualiza el rol de un usuario mediante una solicitud PATCH al backend.
   * Modifica el campo de rol del usuario y recarga la lista al recibir confirmación.
   */
  updateUserRole(user: User, role: string): void {
    const userId = this.getUserId(user);
    if (!userId) return;

    this.http.patch(`${environment.apiUrl}/auth/users/${userId}`, { role }).subscribe({
      next: () => {
        this.snackBar.open('Rol actualizado', 'Cerrar', { duration: 2500 });
        this.loadUsers();
      },
      error: (err) => {
        console.error('Error actualizando rol:', err);
        this.snackBar.open('Error al actualizar rol', 'Cerrar', { duration: 3000 });
      }
    });
  }
  /**
   * ✅ Obtiene el ID del usuario de forma segura.
   * En algunos modelos viene como `_id`, en otros como `id`.
   */
  private getUserId(user: any): string | null {
    const id = user?._id || user?.id || null;
    if (!id) {
      this.snackBar.open('No se pudo obtener el ID del usuario', 'Cerrar', { duration: 3500 });
      console.error('User sin id/_id:', user);
      return null;
    }
    return String(id);
  }

  openAssignmentDialog(user: User): void {
    const userId = this.getUserId(user);
    if (!userId) return;

    const userName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email || 'Usuario';

    this.dialog.open(UserAssignmentDialogComponent, {
      width: '800px',
      data: {
        userId,
        userName
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  editUser(user: User): void {
    this.dialog.open(UserDialogComponent, {
      width: '640px',
      data: user,
    }).afterClosed().subscribe((result) => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  createUser(role = 'VIEWER'): void {
    this.dialog.open(UserDialogComponent, {
      width: '640px',
      data: { role }
    }).afterClosed().subscribe((result) => {
      if (result) {
        this.loadUsers();
      }
    });
  }

  changeRole(user: User, role?: string): void {
    if (role) {
      this.updateUserRole(user, role);
      return;
    }

    console.log('Cambiar rol:', user);
    // TODO: Implementar dialog para cambiar rol
  }

  resetPassword(user: User): void {
    const userId = this.getUserId(user);
    if (!userId) return;

    if (confirm(`¿Resetear contraseña de ${user.email}?`)) {
      this.http.post<{
        message?: string;
        temporaryPassword?: string;
        emailSent?: boolean;
      }>(`${environment.apiUrl}/auth/users/${userId}/reset-password`, {}).subscribe({
        next: (response) => {
          const message = response.emailSent
            ? 'Contraseña reseteada y enviada por email'
            : `Contraseña temporal: ${response.temporaryPassword}`;
          this.snackBar.open(message, 'Cerrar', { duration: 8000 });
        },
        error: (err) => {
          console.error('Error:', err);
          const message = err?.error?.message || 'Error al resetear contraseña';
          this.snackBar.open(message, 'Cerrar', { duration: 3500 });
        }
      });
    }
  }

  viewAssignments(user: User): void {
    this.openAssignmentDialog(user);
  }

  getRoleName(role: string): string {
    const names: any = {
      'OWNER': 'Owner',
      'PLATFORM_ADMIN': 'Platform Admin',
      'CLIENT_ADMIN': 'Client Admin',
      'AREA_ADMIN': 'Area Admin',
      'ANALYST': 'Analyst',
      'VIEWER': 'Viewer',
      'ADMIN_AREA': 'Admin Area',
      'PENTESTER': 'Pentester',
      'QA': 'QA',
      'NORMAL_USER': 'Usuario Normal',
      'AUDITOR': 'Auditor'
    };
    return names[role] || role;
  }

  getRoleIcon(role: string): string {
    const icons: any = {
      'OWNER': 'stars',
      'PLATFORM_ADMIN': 'admin_panel_settings',
      'CLIENT_ADMIN': 'business_center',
      'AREA_ADMIN': 'folder',
      'ANALYST': 'analytics',
      'VIEWER': 'visibility',
      'ADMIN_AREA': 'business_center',
      'PENTESTER': 'bug_report',
      'QA': 'fact_check',
      'NORMAL_USER': 'person',
      'AUDITOR': 'visibility'
    };
    return icons[role] || 'person';
  }
}

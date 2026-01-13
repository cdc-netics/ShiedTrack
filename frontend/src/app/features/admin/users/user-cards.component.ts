import { Component, OnInit, signal, inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { User } from '../../../shared/models';
import { environment } from '../../../../environments/environment';
import { AnimationService } from '../../../core/services/animation.service';

/**
 * Vista de tarjetas para gestión de usuarios
 * Diseño moderno con cards, avatares y estadísticas visuales
 */
@Component({
  selector: 'app-user-cards',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatBadgeModule,
    FormsModule
  ],
  template: `
    <div class="user-cards-container">
      <!-- Header con estadísticas -->
      <div class="stats-header">
        <mat-card class="stat-card stat-total">
          <mat-icon>people</mat-icon>
          <div class="stat-content">
            <div class="stat-value">{{ users().length }}</div>
            <div class="stat-label">Total Usuarios</div>
          </div>
        </mat-card>

        <mat-card class="stat-card stat-active">
          <mat-icon>verified_user</mat-icon>
          <div class="stat-content">
            <div class="stat-value">{{ getActiveCount() }}</div>
            <div class="stat-label">Activos</div>
          </div>
        </mat-card>

        <mat-card class="stat-card stat-mfa">
          <mat-icon>lock</mat-icon>
          <div class="stat-content">
            <div class="stat-value">{{ getMfaCount() }}</div>
            <div class="stat-label">Con MFA</div>
          </div>
        </mat-card>

        <mat-card class="stat-card stat-roles">
          <mat-icon>admin_panel_settings</mat-icon>
          <div class="stat-content">
            <div class="stat-value">{{ getAdminCount() }}</div>
            <div class="stat-label">Administradores</div>
          </div>
        </mat-card>
      </div>

      <!-- Filtros y búsqueda -->
      <mat-card class="filter-card">
        <div class="filter-content">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Buscar usuario</mat-label>
            <input matInput [ngModel]="searchTerm()" 
                   (ngModelChange)="searchTerm.set($event)"
                   placeholder="Nombre, email, rol...">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Filtrar por rol</mat-label>
            <mat-select [ngModel]="roleFilter()" (ngModelChange)="roleFilter.set($event)">
              <mat-option value="">Todos los roles</mat-option>
              <mat-option value="OWNER">Owner</mat-option>
              <mat-option value="PLATFORM_ADMIN">Platform Admin</mat-option>
              <mat-option value="CLIENT_ADMIN">Client Admin</mat-option>
              <mat-option value="AREA_ADMIN">Area Admin</mat-option>
              <mat-option value="ANALYST">Analyst</mat-option>
              <mat-option value="VIEWER">Viewer</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Estado MFA</mat-label>
            <mat-select [ngModel]="mfaFilter()" (ngModelChange)="mfaFilter.set($event)">
              <mat-option value="">Todos</mat-option>
              <mat-option value="enabled">Habilitado</mat-option>
              <mat-option value="disabled">Deshabilitado</mat-option>
            </mat-select>
          </mat-form-field>

          <button mat-raised-button color="primary" (click)="loadUsers()">
            <mat-icon>refresh</mat-icon>
            Actualizar
          </button>
        </div>
      </mat-card>

      <!-- Grid de tarjetas de usuarios -->
      <div class="user-grid">
        @for (user of filteredUsers(); track user._id) {
          <mat-card class="user-card" [class.inactive]="user.isDeleted">
            <mat-card-header>
              <div class="user-avatar" [style.background-color]="getAvatarColor(user.email)">
                {{ getInitials(user.firstName, user.lastName) }}
              </div>
              <div class="user-info">
                <mat-card-title>{{ user.firstName }} {{ user.lastName }}</mat-card-title>
                <mat-card-subtitle>{{ user.email }}</mat-card-subtitle>
              </div>
              @if (user.mfaEnabled) {
                <mat-icon class="mfa-badge" matTooltip="MFA Habilitado" color="primary">verified_user</mat-icon>
              }
            </mat-card-header>

            <mat-card-content>
              <div class="user-details">
                <mat-chip [class]="'role-chip role-' + user.role.toLowerCase()">
                  <mat-icon>{{ getRoleIcon(user.role) }}</mat-icon>
                  {{ getRoleName(user.role) }}
                </mat-chip>

                @if (user.clientId) {
                  <div class="detail-item">
                    <mat-icon>business</mat-icon>
                    <span>Cliente asignado</span>
                  </div>
                }

                @if (user.isDeleted) {
                  <mat-chip class="status-chip status-deleted">
                    <mat-icon>block</mat-icon>
                    Desactivado
                  </mat-chip>
                } @else {
                  <mat-chip class="status-chip status-active">
                    <mat-icon>check_circle</mat-icon>
                    Activo
                  </mat-chip>
                }
              </div>
            </mat-card-content>

            <mat-card-actions>
              <button mat-button (click)="editUser(user)">
                <mat-icon>edit</mat-icon>
                Editar
              </button>
              <button mat-button (click)="assignAreas(user)">
                <mat-icon>assignment</mat-icon>
                Áreas
              </button>
              @if (!user.isDeleted) {
                <button mat-button color="warn" (click)="deactivateUser(user)">
                  <mat-icon>block</mat-icon>
                  Desactivar
                </button>
              } @else {
                <button mat-button color="primary" (click)="reactivateUser(user)">
                  <mat-icon>restore</mat-icon>
                  Reactivar
                </button>
              }
            </mat-card-actions>
          </mat-card>
        } @empty {
          <div class="empty-state">
            <mat-icon>person_search</mat-icon>
            <h3>No se encontraron usuarios</h3>
            <p>Intenta ajustar los filtros de búsqueda</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .user-cards-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Estadísticas header */
    .stats-header {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      cursor: pointer;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0,0,0,0.2);
    }

    .stat-card mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }

    .stat-content {
      flex: 1;
    }

    .stat-value {
      font-size: 32px;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 14px;
      color: rgba(0,0,0,0.6);
    }

    .stat-total {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .stat-total .stat-label {
      color: rgba(255,255,255,0.9);
    }

    .stat-active {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
    }

    .stat-active .stat-label {
      color: rgba(255,255,255,0.9);
    }

    .stat-mfa {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: white;
    }

    .stat-mfa .stat-label {
      color: rgba(255,255,255,0.9);
    }

    .stat-roles {
      background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
      color: white;
    }

    .stat-roles .stat-label {
      color: rgba(255,255,255,0.9);
    }

    /* Filtros */
    .filter-card {
      margin-bottom: 24px;
      padding: 16px;
    }

    .filter-content {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      align-items: center;
    }

    .search-field {
      flex: 1;
      min-width: 250px;
    }

    /* Grid de usuarios */
    .user-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 20px;
    }

    .user-card {
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      position: relative;
    }

    .user-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    }

    .user-card.inactive {
      opacity: 0.6;
    }

    .user-card mat-card-header {
      position: relative;
    }

    .user-avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: 700;
      color: white;
      margin-right: 16px;
      flex-shrink: 0;
    }

    .user-info {
      flex: 1;
    }

    .mfa-badge {
      position: absolute;
      top: 8px;
      right: 8px;
    }

    .user-details {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 16px;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: rgba(0,0,0,0.6);
    }

    .detail-item mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .role-chip {
      font-weight: 500;
    }

    .role-owner {
      background: #d32f2f;
      color: white;
    }

    .role-platform_admin {
      background: #ff6f00;
      color: white;
    }

    .role-client_admin {
      background: #1976d2;
      color: white;
    }

    .role-area_admin {
      background: #388e3c;
      color: white;
    }

    .role-analyst {
      background: #7b1fa2;
      color: white;
    }

    .role-viewer {
      background: #616161;
      color: white;
    }

    .status-chip {
      font-size: 12px;
    }

    .status-active {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .status-deleted {
      background: #ffebee;
      color: #c62828;
    }

    mat-card-actions {
      display: flex;
      justify-content: space-between;
      padding: 8px 16px;
    }

    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 60px 20px;
      color: rgba(0,0,0,0.5);
    }

    .empty-state mat-icon {
      font-size: 80px;
      width: 80px;
      height: 80px;
      margin-bottom: 16px;
      opacity: 0.3;
    }

    @media (max-width: 768px) {
      .user-grid {
        grid-template-columns: 1fr;
      }
      
      .stats-header {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class UserCardsComponent implements OnInit, AfterViewInit {
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private animationService = inject(AnimationService);

  users = signal<User[]>([]);
  searchTerm = signal('');
  roleFilter = signal('');
  mfaFilter = signal('');

  ngOnInit(): void {
    this.loadUsers();
  }

  ngAfterViewInit(): void {
    // Animar estadísticas al cargar
    setTimeout(() => {
      this.animationService.staggerFadeIn('.stat-card', 100);
    }, 100);
  }

  loadUsers(): void {
    this.http.get<User[]>(`${environment.apiUrl}/auth/users`).subscribe({
      next: (data) => {
        this.users.set(data);
        // Animar tarjetas al cargar
        setTimeout(() => {
          this.animationService.staggerFadeIn('.user-card', 50);
        }, 100);
      },
      error: (err) => {
        console.error('Error cargando usuarios:', err);
        this.snackBar.open('Error al cargar usuarios', 'Cerrar', { duration: 3000 });
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
        u.email?.toLowerCase().includes(term) ||
        u.role?.toLowerCase().includes(term)
      );
    }

    if (this.roleFilter()) {
      filtered = filtered.filter(u => u.role === this.roleFilter());
    }

    if (this.mfaFilter() === 'enabled') {
      filtered = filtered.filter(u => u.mfaEnabled);
    } else if (this.mfaFilter() === 'disabled') {
      filtered = filtered.filter(u => !u.mfaEnabled);
    }

    return filtered;
  }

  getInitials(firstName: string, lastName: string): string {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last;
  }

  getAvatarColor(email: string): string {
    const colors = [
      '#1976d2', '#d32f2f', '#388e3c', '#7b1fa2',
      '#ff6f00', '#0288d1', '#c2185b', '#303f9f'
    ];
    const index = email.charCodeAt(0) % colors.length;
    return colors[index];
  }

  getRoleName(role: string): string {
    const names: any = {
      'OWNER': 'Owner',
      'PLATFORM_ADMIN': 'Platform Admin',
      'CLIENT_ADMIN': 'Client Admin',
      'AREA_ADMIN': 'Area Admin',
      'ANALYST': 'Analyst',
      'VIEWER': 'Viewer'
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
      'VIEWER': 'visibility'
    };
    return icons[role] || 'person';
  }

  getActiveCount(): number {
    return this.users().filter(u => !u.isDeleted).length;
  }

  getMfaCount(): number {
    return this.users().filter(u => u.mfaEnabled).length;
  }

  getAdminCount(): number {
    return this.users().filter(u =>
      ['OWNER', 'PLATFORM_ADMIN', 'CLIENT_ADMIN', 'AREA_ADMIN'].includes(u.role)
    ).length;
  }

  editUser(user: User): void {
    console.log('Editar usuario:', user);
    // TODO: Abrir diálogo de edición
  }

  assignAreas(user: User): void {
    console.log('Asignar áreas a:', user);
    // TODO: Abrir diálogo de asignación de áreas
  }

  deactivateUser(user: User): void {
    if (confirm(`¿Desactivar usuario ${user.email}?`)) {
      this.http.delete(`${environment.apiUrl}/auth/users/${user._id}/soft`).subscribe({
        next: () => {
          this.snackBar.open('Usuario desactivado', 'Cerrar', { duration: 3000 });
          this.loadUsers();
        },
        error: (err) => {
          console.error('Error:', err);
          this.snackBar.open('Error al desactivar usuario', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  reactivateUser(user: User): void {
    this.http.post(`${environment.apiUrl}/auth/users/${user._id}/reactivate`, {}).subscribe({
      next: () => {
        this.snackBar.open('Usuario reactivado', 'Cerrar', { duration: 3000 });
        this.loadUsers();
      },
      error: (err) => {
        console.error('Error:', err);
        this.snackBar.open('Error al reactivar usuario', 'Cerrar', { duration: 3000 });
      }
    });
  }
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-admin-home',
  imports: [CommonModule, RouterLink, MatCardModule, MatIconModule],
  template: `
    <div class="admin-home">
      <h1>Centro de administraci&oacute;n</h1>
      <p class="subtitle">Todo lo administrativo en un solo lugar, con accesos ordenados por tarea.</p>

      <div class="grid">
        @if (authService.isAdmin()) {
          <a class="card" mat-card routerLink="/admin/users">
            <mat-icon>people</mat-icon><h3>Usuarios</h3><p>Altas, roles y permisos.</p>
          </a>
          <a class="card" mat-card routerLink="/admin/areas">
            <mat-icon>business</mat-icon><h3>&Aacute;reas</h3><p>Estructura operativa y alcance por &aacute;rea.</p>
          </a>
          <a class="card" mat-card routerLink="/admin/templates">
            <mat-icon>description</mat-icon><h3>Plantillas</h3><p>Gestiona plantillas base de hallazgos.</p>
          </a>
          <a class="card" mat-card routerLink="/admin/audit">
            <mat-icon>history</mat-icon><h3>Auditor&iacute;a</h3><p>Trazabilidad completa de acciones y errores.</p>
          </a>
          <a class="card" mat-card routerLink="/admin/config">
            <mat-icon>settings</mat-icon><h3>Configuraci&oacute;n</h3><p>Opciones generales del sistema.</p>
          </a>
          <a class="card" mat-card routerLink="/admin/branding">
            <mat-icon>palette</mat-icon><h3>Marca</h3><p>Logo, favicon y colores institucionales.</p>
          </a>
          <a class="card" mat-card routerLink="/admin/backup">
            <mat-icon>backup</mat-icon><h3>Backup</h3><p>Respaldo y restauraci&oacute;n.</p>
          </a>
        }
        @if (canAccessNotifications()) {
          <a class="card" mat-card routerLink="/admin/notifications">
            <mat-icon>alternate_email</mat-icon><h3>Notificaciones</h3><p>Reglas y plantillas de correo.</p>
          </a>
        }
      </div>
    </div>
  `,
  styles: [`
    .admin-home { padding: 0; }
    h1 { margin: 0 0 8px; }
    .subtitle { margin: 0 0 20px; color: #607d8b; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
    .card {
      text-decoration: none;
      color: inherit;
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 16px;
      border: 1px solid #eceff1;
      border-radius: 12px;
      transition: transform .12s ease, box-shadow .12s ease;
    }
    .card:hover { transform: translateY(-2px); box-shadow: 0 4px 14px rgba(0,0,0,.08); }
    .card mat-icon { color: #3f51b5; }
    .card h3 { margin: 0; font-size: 16px; }
    .card p { margin: 0; font-size: 13px; color: #546e7a; }
  `],
})
export class AdminHomeComponent {
  public authService = inject(AuthService);

  canAccessNotifications(): boolean {
    const role = this.authService.currentUser()?.role;
    return role === 'OWNER' || role === 'PLATFORM_ADMIN' || role === 'CLIENT_ADMIN';
  }
}

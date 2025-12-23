import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../services/auth.service';

/**
 * Layout principal con sidebar y navegación
 */
@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatDividerModule
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav #drawer class="sidenav" fixedInViewport
          [attr.role]="'navigation'"
          mode="side"
          opened>
        <mat-toolbar color="primary">ShieldTrack</mat-toolbar>
        <mat-nav-list>
          <a mat-list-item routerLink="/dashboard" routerLinkActive="active">
            <mat-icon>dashboard</mat-icon>
            <span>Dashboard</span>
          </a>
          <a mat-list-item routerLink="/projects" routerLinkActive="active">
            <mat-icon>folder</mat-icon>
            <span>Proyectos</span>
          </a>
          <a mat-list-item routerLink="/findings" routerLinkActive="active">
            <mat-icon>bug_report</mat-icon>
            <span>Hallazgos</span>
          </a>
          <a mat-list-item routerLink="/clients" routerLinkActive="active">
            <mat-icon>business</mat-icon>
            <span>Clientes</span>
          </a>
          
          <mat-divider></mat-divider>
          
          @if (authService.isAdmin()) {
            <div class="menu-section">
              <div class="section-title">Administración</div>
              <a mat-list-item routerLink="/admin/users" routerLinkActive="active">
                <mat-icon>people</mat-icon>
                <span>Usuarios</span>
              </a>
              <a mat-list-item routerLink="/admin/areas" routerLinkActive="active">
                <mat-icon>business</mat-icon>
                <span>Áreas</span>
              </a>
              <a mat-list-item routerLink="/admin/templates" routerLinkActive="active">
                <mat-icon>description</mat-icon>
                <span>Templates</span>
              </a>
              <a mat-list-item routerLink="/admin/audit" routerLinkActive="active">
                <mat-icon>history</mat-icon>
                <span>Auditoría</span>
              </a>
              <a mat-list-item routerLink="/admin/config" routerLinkActive="active">
                <mat-icon>settings</mat-icon>
                <span>Configuración</span>
              </a>
            </div>
          }
        </mat-nav-list>
      </mat-sidenav>
      <mat-sidenav-content>
        <mat-toolbar color="primary">
          <span class="toolbar-spacer"></span>
          <span class="user-name">{{ authService.currentUser()?.firstName }} {{ authService.currentUser()?.lastName }}</span>
          <button mat-icon-button [matMenuTriggerFor]="userMenu">
            <mat-icon>account_circle</mat-icon>
          </button>
          <mat-menu #userMenu="matMenu">
            <button mat-menu-item routerLink="/profile">
              <mat-icon>person</mat-icon>
              <span>Perfil</span>
            </button>
            <button mat-menu-item (click)="authService.logout()">
              <mat-icon>logout</mat-icon>
              <span>Cerrar Sesión</span>
            </button>
          </mat-menu>
        </mat-toolbar>
        <div class="content">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .sidenav-container {
      height: 100vh;
    }

    .sidenav {
      width: 250px;
    }

    .sidenav .mat-toolbar {
      background: inherit;
    }

    .mat-toolbar.mat-primary {
      position: sticky;
      top: 0;
      z-index: 1;
    }

    mat-nav-list {
      padding-top: 0;
    }

    mat-nav-list a {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 16px;
    }

    mat-nav-list a mat-icon {
      color: rgba(0, 0, 0, 0.54);
    }

    mat-nav-list a.active {
      background-color: rgba(63, 81, 181, 0.1);
    }

    mat-nav-list a.active mat-icon {
      color: #3f51b5;
    }

    .menu-section {
      margin-top: 16px;
    }

    .section-title {
      padding: 8px 16px;
      font-size: 12px;
      font-weight: 500;
      color: rgba(0, 0, 0, 0.54);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .toolbar-spacer {
      flex: 1 1 auto;
    }

    .user-name {
      margin-right: 16px;
      font-size: 14px;
    }

    .content {
      padding: 24px;
      height: calc(100vh - 64px);
      overflow: auto;
    }

    mat-divider {
      margin: 8px 0;
    }
  `]
})
export class MainLayoutComponent {
  constructor(public authService: AuthService) {}
}

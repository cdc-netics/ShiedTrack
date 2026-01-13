import { Component, OnInit, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

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
    MatDividerModule,
    MatChipsModule,
    MatTooltipModule
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav #drawer class="sidenav" fixedInViewport
          [attr.role]="'navigation'"
          mode="side"
          opened>
        <mat-toolbar class="dynamic-primary">
          <img class="brand-logo" [src]="theme.currentLogo" alt="Logo" />
          <span class="brand-name">ShieldTrack</span>
        </mat-toolbar>
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
        <mat-toolbar class="dynamic-primary">
          @if (currentTenant) {
            <mat-chip-set class="tenant-chip">
              <mat-chip [matTooltip]="'Cliente actual: ' + currentTenant.name">
                <mat-icon matChipAvatar>business</mat-icon>
                {{ currentTenant.displayName || currentTenant.name }}
              </mat-chip>
            </mat-chip-set>
          }
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
      gap: 8px;
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

    .brand-logo {
      width: 28px;
      height: 28px;
      object-fit: contain;
    }

    .brand-name {
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .dynamic-primary {
      background-color: var(--primary-color, #3f51b5) !important;
      color: #fff;
    }

    .tenant-chip {
      margin-right: 16px;
    }

    .tenant-chip mat-chip {
      background-color: rgba(255, 255, 255, 0.2) !important;
      color: #fff;
      font-weight: 500;
      font-size: 13px;
    }

    .tenant-chip mat-chip mat-icon {
      color: #fff;
    }
  `]
})
export class MainLayoutComponent implements OnInit, AfterViewInit {
  private http = inject(HttpClient);
  currentTenant: any = null;

  constructor(public authService: AuthService, public theme: ThemeService) {}

  ngOnInit(): void {
    const clientSettings = (this.authService.currentUser() as any)?.clientSettings;
    this.theme.applyTheme({
      primaryColor: clientSettings?.primaryColor,
      logoUrl: clientSettings?.logoUrl,
    });

    // Cargar información del tenant actual
    this.loadCurrentTenant();
  }

  async loadCurrentTenant(): Promise<void> {
    const user = this.authService.currentUser();
    const clientId = (user as any)?.clientId;
    
    if (clientId) {
      try {
        this.currentTenant = await firstValueFrom(
          this.http.get(`/api/clients/${clientId}`)
        );
      } catch (err) {
        console.error('Error al cargar tenant actual:', err);
      }
    }
  }

  async ngAfterViewInit(): Promise<void> {
    try {
      const anime = (await import('animejs')).default;
      anime({
        targets: '.content',
        opacity: [0, 1],
        translateY: [12, 0],
        duration: 450,
        easing: 'easeOutQuad',
      });
    } catch (err) {
      console.warn('Animación no cargada (anime.js):', err);
    }
  }
}

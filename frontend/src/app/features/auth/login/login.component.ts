import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

import { MatSelectModule } from '@angular/material/select';

// ============================================================================
// 🚧 CREDENCIALES DE DESARROLLO - REMOVER EN PRODUCCIÓN
// ============================================================================
const DEV_USERS = [
  { label: 'Owner (Dev)', email: 'admin@shieldtrack.com', role: 'OWNER' },
  { label: 'System Owner', email: 'owner@shieldtrack.com', role: 'OWNER' },
  { label: 'Platform Admin', email: 'platformadmin@shieldtrack.com', role: 'PLATFORM_ADMIN' },
  { label: 'Client Admin', email: 'clientadmin@acmecorp.com', role: 'CLIENT_ADMIN' },
  { label: 'Area Admin', email: 'areaadmin@acmecorp.com', role: 'AREA_ADMIN' },
  { label: 'Analyst', email: 'analyst@shieldtrack.com', role: 'ANALYST' },
  { label: 'Viewer', email: 'viewer@shieldtrack.com', role: 'VIEWER' }
];

const DEFAULT_PASSWORD = 'Password123!';
const DEV_ADMIN_PASSWORD = 'Admin123!';
// ============================================================================

/**
 * Componente de Login
 * Standalone component con Material UI
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>🔒 ShieldTrack</mat-card-title>
          <mat-card-subtitle>Sistema de Gestión de Hallazgos de Ciberseguridad</mat-card-subtitle>
        </mat-card-header>
        
        <!-- 🚧 BANNER DE DESARROLLO - REMOVER EN PRODUCCIÓN -->
        @if (showDevCredentials) {
          <div class="dev-banner">
            <div class="dev-banner-header">🚧 MODO DESARROLLO</div>
            <div class="dev-credentials">
              <mat-form-field appearance="outline" class="full-width dev-select">
                <mat-label>Seleccionar Usuario de Prueba</mat-label>
                <mat-select [(ngModel)]="selectedDevUser" (selectionChange)="fillDevCredentials()">
                  @for (user of devUsers; track user.email) {
                    <mat-option [value]="user">
                      {{ user.label }} ({{ user.role }})
                    </mat-option>
                  }
                </mat-select>
              </mat-form-field>
              
              @if (selectedDevUser) {
                <div class="selected-user-info">
                  <span class="credential-line">
                    📧 Email: <code>{{ selectedDevUser.email }}</code>
                  </span>
                  <span class="credential-line">
                    🔑 Password: <code>{{ getPassword(selectedDevUser) }}</code>
                  </span>
                </div>
                <button mat-button class="auto-fill-btn" (click)="fillDevCredentials()">
                  ⚡ Auto-completar
                </button>
              }
            </div>
          </div>
        }
        <!-- FIN BANNER DESARROLLO -->
        
        <mat-card-content>
          <form (ngSubmit)="onLogin()" #loginForm="ngForm">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" [(ngModel)]="email" name="email" required>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Contraseña</mat-label>
              <input matInput type="password" [(ngModel)]="password" name="password" required>
            </mat-form-field>

            @if (error) {
              <div class="error-message">{{ error }}</div>
            }

            <button mat-raised-button color="primary" type="submit" 
                    [disabled]="loading || !loginForm.valid" class="full-width">
              @if (loading) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                Iniciar Sesión
              }
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .login-card {
      width: 100%;
      max-width: 400px;
      padding: 24px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    /* 🚧 ESTILOS DESARROLLO - REMOVER EN PRODUCCIÓN */
    .dev-banner {
      background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%);
      border: 2px dashed #e17055;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .dev-banner-header {
      font-weight: 700;
      font-size: 16px;
      color: #d63031;
      margin-bottom: 12px;
      text-align: center;
      letter-spacing: 1px;
    }

    .dev-credentials {
      background: white;
      padding: 12px;
      border-radius: 4px;
      font-size: 13px;
      line-height: 1.8;
    }

    .dev-select {
      margin-bottom: 8px;
      font-size: 12px;
    }
    
    .dev-select .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }

    .selected-user-info {
      margin-bottom: 8px;
      padding: 8px;
      background: #f8f9fa;
      border-radius: 4px;
    }

    .credential-line {
      display: block;
      margin: 4px 0;
    }
    .dev-credentials code {
      background: #f1f3f5;
      padding: 2px 8px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      color: #2d3436;
      font-weight: 600;
    }

    .auto-fill-btn {
      width: 100%;
      margin-top: 4px;
      background: #0984e3 !important;
      color: white !important;
      font-weight: 600;
    }
    /* FIN ESTILOS DESARROLLO */
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = false;
  error = '';

  // 🚧 PROPIEDADES DE DESARROLLO - REMOVER EN PRODUCCIÓN
  showDevCredentials = true;
  devUsers = DEV_USERS;
  selectedDevUser: any = DEV_USERS[0]; // Default to first user

  /**
   * 🚧 MÉTODO DE DESARROLLO - Auto-completa credenciales
   */
  fillDevCredentials(): void {
    if (this.selectedDevUser) {
      this.email = this.selectedDevUser.email;
      this.password = this.getPassword(this.selectedDevUser);
    }
  }

  getPassword(user: any): string {
    return user.email === 'admin@shieldtrack.com' ? DEV_ADMIN_PASSWORD : DEFAULT_PASSWORD;
  }
  // FIN CÓDIGO DESARROLLO

  onLogin(): void {
    // Dispara autenticacion y controla estado de carga/errores
    this.loading = true;
    this.error = '';

    this.authService.login(this.email, this.password)
      .subscribe({
        next: () => {
          this.loading = false;
          // La navegación la maneja el servicio
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.message || 'Error al iniciar sesión';
        }
      });
  }
}


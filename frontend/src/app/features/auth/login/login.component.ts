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

// ============================================================================
// 🚧 CREDENCIALES DE DESARROLLO - REMOVER EN PRODUCCIÓN
// ============================================================================
const DEV_CREDENTIALS = {
  email: 'admin@shieldtrack.com',
  password: 'Admin123!',
  show: true // ⬅️ Cambiar a false para ocultar el banner
};
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
    MatProgressSpinnerModule
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
              <strong>Credenciales OWNER:</strong><br>
              <span class="credential-line">
                📧 Email: <code>{{ devEmail }}</code>
              </span>
              <span class="credential-line">
                🔑 Password: <code>{{ devPassword }}</code>
              </span>
              <button mat-button class="auto-fill-btn" (click)="fillDevCredentials()">
                ⚡ Auto-completar
              </button>
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

    .credential-line {
      display: block;
      margin: 4px 0;
    }

  // 🚧 PROPIEDADES DE DESARROLLO - REMOVER EN PRODUCCIÓN
  showDevCredentials = DEV_CREDENTIALS.show;
  devEmail = DEV_CREDENTIALS.email;
  devPassword = DEV_CREDENTIALS.password;

  /**
   * 🚧 MÉTODO DE DESARROLLO - Auto-completa credenciales
   * Para remover: borrar este método y su llamada en el template
   */
  fillDevCredentials(): void {
    this.email = DEV_CREDENTIALS.email;
    this.password = DEV_CREDENTIALS.password;
  }
  // FIN CÓDIGO DESARROLLO

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
      margin-top: 8px;
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
  showDevCredentials = DEV_CREDENTIALS.show;
  devEmail = DEV_CREDENTIALS.email;
  devPassword = DEV_CREDENTIALS.password;

  /**
   * 🚧 MÉTODO DE DESARROLLO - Auto-completa credenciales
   * Para remover: borrar este método y su llamada en el template
   */
  fillDevCredentials(): void {
    this.email = DEV_CREDENTIALS.email;
    this.password = DEV_CREDENTIALS.password;
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


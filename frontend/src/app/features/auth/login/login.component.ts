import { Component, inject, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
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
import anime from 'animejs';

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
 * Componente de Login con animación profesional
 * Standalone component con Material UI y anime.js
 */
@Component({
  standalone: true,
    selector: 'app-login',
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
    <div class="login-page">
      <div class="particles" #particles aria-hidden="true">
        @for (particle of particleArray; track $index) {
          <span class="particle" [attr.data-index]="$index"></span>
        }
      </div>

      <div class="shield-logo" #shieldLogo>
        <svg viewBox="0 0 100 120" class="shield-svg" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
            </linearGradient>
          </defs>
          <path class="shield-path" d="M50,10 L85,25 L85,60 Q85,90 50,110 Q15,90 15,60 L15,25 Z" 
                fill="url(#shieldGradient)" stroke="#fff" stroke-width="2"/>
          <path class="shield-check" d="M35,55 L45,65 L65,40" fill="none" stroke="#fff" 
                stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <p class="app-title">ShieldTrack</p>
        <p class="app-subtitle">Cyber Security Management</p>
      </div>

      <main class="login-main" id="login-main">
      <mat-card class="login-card" #loginCard>
        <mat-card-header>
          <mat-card-title>
            <h1 class="login-card-heading">Iniciar sesión</h1>
          </mat-card-title>
          <mat-card-subtitle>Sistema de gestión de hallazgos</mat-card-subtitle>
        </mat-card-header>
        
        @if (showDevCredentials) {
          <aside class="dev-banner" aria-label="Modo desarrollo">
            <p class="dev-banner-header">Modo desarrollo</p>
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
          </aside>
        }
        
        <mat-card-content>
          <form (ngSubmit)="onLogin()" #loginForm="ngForm" autocomplete="on">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Correo electrónico</mat-label>
              <input matInput type="email" [(ngModel)]="email" name="email" required autocomplete="username">
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Contraseña</mat-label>
              <input matInput type="password" [(ngModel)]="password" name="password" required autocomplete="current-password">
            </mat-form-field>

            @if (error) {
              <div class="error-message" role="alert">{{ error }}</div>
            }

            <button mat-raised-button color="primary" type="submit" 
                    [disabled]="loading || !loginForm.valid" class="full-width login-submit">
              @if (loading) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                Iniciar Sesión
              }
            </button>
          </form>
        </mat-card-content>
      </mat-card>
      </main>
    </div>
  `,
    styles: [`
    .login-page {
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      overflow: hidden;
    }

    /* Partículas animadas */
    .particles {
      position: absolute;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }

    .particle {
      position: absolute;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      pointer-events: none;
    }

    /* Logo Shield animado */
    .shield-logo {
      text-align: center;
      margin-bottom: 32px;
      z-index: 1;
      opacity: 0;
    }

    .shield-svg {
      width: 100px;
      height: 120px;
      filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.3));
    }

    .shield-path {
      transform-origin: center;
    }

    .shield-check {
      stroke-dasharray: 100;
      stroke-dashoffset: 100;
    }

    .login-main {
      width: 100%;
      display: flex;
      justify-content: center;
      z-index: 1;
    }

    .login-card-heading {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .app-title {
      color: white;
      font-size: 48px;
      font-weight: 700;
      margin: 16px 0 8px;
      text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
      letter-spacing: 2px;
    }

    .app-subtitle {
      color: rgba(255, 255, 255, 0.9);
      font-size: 14px;
      font-weight: 300;
      text-transform: uppercase;
      letter-spacing: 3px;
      margin: 0;
    }

    /* Card de login */
    .login-card {
      width: 100%;
      max-width: 400px;
      padding: 24px;
      z-index: 1;
      opacity: 0;
      transform: translateY(30px);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
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
      text-align: center;
      color: #d63031;
      margin: 0 0 12px;
      font-size: 14px;
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

    .error-message {
      color: #b91c1c;
      background: #fef2f2;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 16px;
      text-align: center;
      font-size: 14px;
    }

    .login-submit {
      min-height: 48px;
    }
  `]
})
export class LoginComponent implements AfterViewInit {
  @ViewChild('particles', { read: ElementRef }) particlesRef!: ElementRef;
  @ViewChild('shieldLogo', { read: ElementRef }) shieldLogoRef!: ElementRef;
  @ViewChild('loginCard', { read: ElementRef }) loginCardRef!: ElementRef;

  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = false;
  error = '';

  particleArray = new Array(30); // 30 partículas

  // 🚧 PROPIEDADES DE DESARROLLO - REMOVER EN PRODUCCIÓN
  showDevCredentials = true;
  devUsers = DEV_USERS;
  selectedDevUser: any = DEV_USERS[0]; // Default to first user

  ngAfterViewInit(): void {
    // Ejecuta animaciones después de que la vista esté lista
    this.animateParticles();
    this.animateShieldLogo();
    this.animateLoginCard();
  }

  /**
   * Anima las partículas de fondo con anime.js
   */
  private animateParticles(): void {
    const particles = this.particlesRef.nativeElement.querySelectorAll('.particle');
    
    particles.forEach((particle: HTMLElement, index: number) => {
      // Posiciones aleatorias
      const size = Math.random() * 4 + 2;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;

      // Animación infinita con anime.js
      anime({
        targets: particle,
        translateX: () => anime.random(-50, 50),
        translateY: () => anime.random(-50, 50),
        scale: [
          { value: Math.random() * 0.5 + 0.5, duration: 1000 },
          { value: Math.random() * 1.5 + 0.5, duration: 1000 }
        ],
        opacity: [
          { value: Math.random() * 0.5 + 0.2, duration: 1000 },
          { value: Math.random() * 0.8 + 0.1, duration: 1000 }
        ],
        duration: anime.random(3000, 5000),
        delay: index * 100,
        easing: 'easeInOutSine',
        loop: true,
        direction: 'alternate'
      });
    });
  }

  /**
   * Anima el logo del escudo con efecto de entrada
   */
  private animateShieldLogo(): void {
    const logo = this.shieldLogoRef.nativeElement;
    const shieldPath = logo.querySelector('.shield-path');
    const shieldCheck = logo.querySelector('.shield-check');

    // Timeline de animación
    const timeline = anime.timeline({
      easing: 'easeOutExpo'
    });

    // 1. Fade in + scale del logo
    timeline.add({
      targets: logo,
      opacity: [0, 1],
      scale: [0.5, 1],
      duration: 800,
      delay: 200
    });

    // 2. Rotación del escudo
    timeline.add({
      targets: shieldPath,
      rotate: [0, 360],
      duration: 1000,
      easing: 'easeInOutQuad'
    }, '-=400');

    // 3. Dibujar el check
    timeline.add({
      targets: shieldCheck,
      strokeDashoffset: [100, 0],
      duration: 600,
      easing: 'easeInOutSine'
    }, '-=200');

    // 4. Pulse sutil continuo
    anime({
      targets: shieldPath,
      scale: [1, 1.05, 1],
      duration: 2000,
      easing: 'easeInOutSine',
      loop: true,
      delay: 1500
    });
  }

  /**
   * Anima la tarjeta de login con entrada suave
   */
  private animateLoginCard(): void {
    anime({
      targets: this.loginCardRef.nativeElement,
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 800,
      delay: 600,
      easing: 'easeOutExpo'
    });
  }

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
        error: (err: unknown) => {
          this.loading = false;
          const http = err as {
            status?: number;
            message?: string;
            error?: { message?: string } | string;
          };
          const body = http.error;
          const bodyMsg =
            typeof body === 'string'
              ? body
              : body && typeof body === 'object' && 'message' in body
                ? String((body as { message?: string }).message)
                : '';
          this.error =
            bodyMsg ||
            http.message ||
            (http.status === 0
              ? 'No hay respuesta del servidor. Compruebe que el backend está en marcha (p. ej. Docker o puerto 3000).'
              : `Error al iniciar sesión (${http.status ?? '?'})`);
        },
      });
  }
}


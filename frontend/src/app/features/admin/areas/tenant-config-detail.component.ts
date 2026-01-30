import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { environment } from '../../../../environments/environment';

interface TenantConfig {
  _id?: string;
  displayName: string;
  description?: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  faviconUrl?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

@Component({
  selector: 'app-tenant-config-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatSnackBarModule,
    MatDividerModule
  ],
  template: `
    <div class="config-detail-container">
      <!-- Header -->
      <div class="header">
        <button mat-icon-button routerLink="/admin/tenants">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>Configuración de Tenant: {{ tenantId }}</h1>
      </div>

      <mat-card class="config-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>settings</mat-icon>
            Configuración Completa del Tenant
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <mat-tab-group>
            <!-- Tab 1: Información Básica -->
            <mat-tab label="Información Básica">
              <div class="tab-content">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Nombre Mostrado</mat-label>
                  <input matInput [(ngModel)]="config().displayName" placeholder="ej: ACME Corp">
                  <mat-icon matSuffix>business</mat-icon>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Descripción</mat-label>
                  <textarea matInput [(ngModel)]="config().description" placeholder="Descripción del tenant"></textarea>
                  <mat-icon matSuffix>description</mat-icon>
                </mat-form-field>

                <div class="status-field">
                  <label>Estado</label>
                  <div class="status-toggle">
                    <input type="checkbox" [(ngModel)]="config().isActive" [id]="'active-' + tenantId">
                    <label [for]="'active-' + tenantId">{{ config().isActive ? '✅ Activo' : '❌ Inactivo' }}</label>
                  </div>
                </div>
              </div>
            </mat-tab>

            <!-- Tab 2: Branding -->
            <mat-tab label="Branding">
              <div class="tab-content">
                <h3>Colores</h3>
                <div class="color-section">
                  <mat-form-field appearance="outline">
                    <mat-label>Color Primario</mat-label>
                    <input matInput type="color" [(ngModel)]="config().primaryColor" placeholder="#3F51B5">
                  </mat-form-field>
                  @if (config().primaryColor) {
                    <div class="color-preview" [style.background-color]="config().primaryColor">
                      Vista Previa
                    </div>
                  }
                </div>

                <mat-divider></mat-divider>

                <div class="color-section">
                  <mat-form-field appearance="outline">
                    <mat-label>Color Secundario</mat-label>
                    <input matInput type="color" [(ngModel)]="config().secondaryColor" placeholder="#FF4081">
                  </mat-form-field>
                  @if (config().secondaryColor) {
                    <div class="color-preview" [style.background-color]="config().secondaryColor">
                      Vista Previa
                    </div>
                  }
                </div>

                <mat-divider style="margin: 24px 0;"></mat-divider>

                <h3>Logo</h3>
                <div class="logo-section">
                  @if (config().logoUrl) {
                    <div class="logo-preview">
                      <img [src]="config().logoUrl" alt="Logo">
                    </div>
                  } @else {
                    <div class="no-image">
                      <mat-icon>image</mat-icon>
                      <p>Sin logo</p>
                    </div>
                  }
                  <input type="file" accept="image/*" (change)="onLogoSelected(\$event)" #logoInput hidden>
                  <button mat-raised-button color="primary" (click)="logoInput.click()" style="margin-top: 12px;">
                    <mat-icon>upload</mat-icon>
                    Cambiar Logo
                  </button>
                </div>

                <mat-divider style="margin: 24px 0;"></mat-divider>

                <h3>Favicon</h3>
                <div class="favicon-section">
                  @if (config().faviconUrl) {
                    <div class="favicon-preview">
                      <img [src]="config().faviconUrl" alt="Favicon">
                    </div>
                  } @else {
                    <div class="no-image">
                      <mat-icon>favorite</mat-icon>
                      <p>Sin favicon</p>
                    </div>
                  }
                  <input type="file" accept="image/*" (change)="onFaviconSelected(\$event)" #faviconInput hidden>
                  <button mat-raised-button color="primary" (click)="faviconInput.click()" style="margin-top: 12px;">
                    <mat-icon>upload</mat-icon>
                    Cambiar Favicon
                  </button>
                </div>
              </div>
            </mat-tab>

            <!-- Tab 3: Configuración Avanzada -->
            <mat-tab label="Configuración Avanzada">
              <div class="tab-content">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>ID del Tenant</mat-label>
                  <input matInput [value]="config()._id" disabled>
                  <mat-icon matSuffix>vpn_key</mat-icon>
                </mat-form-field>

                @if (config().createdAt) {
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Creado en</mat-label>
                    <input matInput [value]="config().createdAt | date:'medium'" disabled>
                    <mat-icon matSuffix>calendar_today</mat-icon>
                  </mat-form-field>
                }

                @if (config().updatedAt) {
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Última actualización</mat-label>
                    <input matInput [value]="config().updatedAt | date:'medium'" disabled>
                    <mat-icon matSuffix>update</mat-icon>
                  </mat-form-field>
                }
              </div>
            </mat-tab>
          </mat-tab-group>

          <div class="actions">
            <button mat-button (click)="cancel()">
              <mat-icon>close</mat-icon>
              Cancelar
            </button>
            <button mat-raised-button color="primary" (click)="saveConfig()">
              <mat-icon>save</mat-icon>
              Guardar Cambios
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .config-detail-container {
      padding: 20px;
      max-width: 900px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }

    .header h1 {
      margin: 0;
      font-size: 24px;
      color: #333;
    }

    .config-card {
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    }

    mat-card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 20px;
    }

    .tab-content {
      padding: 20px 0;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .status-field {
      margin: 16px 0;
    }

    .status-toggle {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 8px;
    }

    .status-toggle input[type="checkbox"] {
      width: 20px;
      height: 20px;
      cursor: pointer;
    }

    .status-toggle label {
      cursor: pointer;
      font-weight: 500;
    }

    .color-section {
      margin-bottom: 20px;
    }

    .color-preview {
      width: 100%;
      height: 80px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 500;
      text-shadow: 0 1px 3px rgba(0,0,0,0.3);
      margin-top: 12px;
    }

    .logo-section,
    .favicon-section {
      padding: 16px;
      border: 2px dashed #ddd;
      border-radius: 8px;
      text-align: center;
    }

    .logo-preview {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 12px 0;
    }

    .logo-preview img {
      max-width: 200px;
      max-height: 100px;
      object-fit: contain;
    }

    .favicon-preview {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 12px 0;
    }

    .favicon-preview img {
      width: 64px;
      height: 64px;
      object-fit: contain;
    }

    .no-image {
      text-align: center;
      padding: 40px;
      color: #999;
    }

    .no-image mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      opacity: 0.3;
    }

    .actions {
      display: flex;
      gap: 12px;
      margin-top: 30px;
      justify-content: flex-end;
    }

    button {
      gap: 8px;
    }

    h3 {
      color: #333;
      margin-bottom: 16px;
      margin-top: 16px;
    }

    mat-divider {
      margin: 20px 0;
    }
  `]
})
export class TenantConfigDetailComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  tenantId = signal('');
  config = signal<TenantConfig>({
    displayName: '',
    description: '',
    primaryColor: '#3F51B5',
    secondaryColor: '#FF4081',
    isActive: true
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.tenantId.set(params['id']);
      this.loadTenantConfig();
    });
  }

  loadTenantConfig(): void {
    const id = this.tenantId();
    if (!id) return;

    this.http.get<TenantConfig>(`${environment.apiUrl}/api/areas/${id}`).subscribe({
      next: (data) => {
        this.config.set(data);
      },
      error: (err) => {
        console.error('Error al cargar configuración:', err);
        this.snackBar.open('Error al cargar la configuración', 'Cerrar', { duration: 3000 });
      }
    });
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.config.update(c => ({
          ...c,
          logoUrl: e.target?.result as string
        }));
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  onFaviconSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.config.update(c => ({
          ...c,
          faviconUrl: e.target?.result as string
        }));
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  saveConfig(): void {
    const id = this.tenantId();
    if (!id) return;

    console.log('Guardando configuración del tenant:', this.config());
    
    // En una implementación real, se enviaría al backend
    this.http.put(`${environment.apiUrl}/api/areas/${id}`, this.config()).subscribe({
      next: () => {
        this.snackBar.open('✅ Configuración guardada correctamente', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        console.error('Error al guardar:', err);
        this.snackBar.open('❌ Error al guardar la configuración', 'Cerrar', { duration: 3000 });
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/tenants']);
  }
}

import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface ClientConfig {
  _id?: string;
  name: string;
  displayName: string;
  favicon?: string;
  logo?: string;
  primaryColor?: string;
}

@Component({
  selector: 'app-tenant-branding-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatSnackBarModule
  ],
  template: `
    <div class="config-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>
            <mat-icon>business</mat-icon>
            Configuración de Tenant/Cliente
          </mat-card-title>
          <mat-card-subtitle>
            Nombre visible, favicon, colores y branding
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <mat-tab-group>
            <!-- Tab: Información Básica -->
            <mat-tab label="Información">
              <div class="tab-content">
                <form [formGroup]="configForm">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Nombre del Cliente/Tenant</mat-label>
                    <input matInput formControlName="name" placeholder="ej: ACME Corporation">
                    <mat-icon matSuffix>business</mat-icon>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Nombre Mostrado (Display Name)</mat-label>
                    <input matInput formControlName="displayName" placeholder="ej: ACME">
                    <mat-hint>Este nombre se mostrará en la interfaz</mat-hint>
                  </mat-form-field>

                  <div class="field-group">
                    <h4>Previsualización del Display Name</h4>
                    <div class="preview-tag">
                      {{ configForm.get('displayName')?.value || 'Nombre Mostrado' }}
                    </div>
                  </div>
                </form>
              </div>
            </mat-tab>

            <!-- Tab: Favicon y Logo -->
            <mat-tab label="Favicon y Logo">
              <div class="tab-content">
                <h3>Favicon</h3>
                <div class="upload-section">
                  @if (faviconPreview()) {
                    <img [src]="faviconPreview()" class="preview-image favicon" alt="Favicon">
                  } @else {
                    <div class="no-image">
                      <mat-icon>image</mat-icon>
                      <p>Sin favicon</p>
                    </div>
                  }
                  
                  <input type="file" accept="image/*" (change)="onFaviconSelected($event)" #faviconInput hidden>
                  <button mat-raised-button color="primary" (click)="faviconInput.click()">
                    <mat-icon>upload</mat-icon>
                    Subir Favicon
                  </button>
                </div>

                <h3 style="margin-top: 30px;">Logo</h3>
                <div class="upload-section">
                  @if (logoPreview()) {
                    <img [src]="logoPreview()" class="preview-image logo" alt="Logo">
                  } @else {
                    <div class="no-image">
                      <mat-icon>image</mat-icon>
                      <p>Sin logo</p>
                    </div>
                  }
                  
                  <input type="file" accept="image/*" (change)="onLogoSelected($event)" #logoInput hidden>
                  <button mat-raised-button color="primary" (click)="logoInput.click()">
                    <mat-icon>upload</mat-icon>
                    Subir Logo
                  </button>
                </div>
              </div>
            </mat-tab>

            <!-- Tab: Colores -->
            <mat-tab label="Colores">
              <div class="tab-content">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Color Primario</mat-label>
                  <input matInput type="color" formControlName="primaryColor">
                  <mat-icon matSuffix>palette</mat-icon>
                </mat-form-field>

                <div class="color-preview" [style.background]="configForm.get('primaryColor')?.value">
                  {{ configForm.get('primaryColor')?.value || '#1976D2' }}
                </div>
              </div>
            </mat-tab>
          </mat-tab-group>

          <div class="actions">
            <button mat-raised-button color="primary" (click)="saveConfig()">
              <mat-icon>save</mat-icon>
              Guardar Configuración
            </button>
            <button mat-stroked-button (click)="resetForm()">
              <mat-icon>refresh</mat-icon>
              Limpiar
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .config-container {
      padding: 20px;
      max-width: 900px;
      margin: 0 auto;
    }

    mat-card {
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

    .field-group {
      margin: 20px 0;
    }

    .preview-tag {
      background: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 12px;
      font-size: 18px;
      font-weight: 500;
    }

    .upload-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 20px;
      background: #f9f9f9;
      border-radius: 8px;
      border: 2px dashed #ddd;
    }

    .preview-image {
      max-width: 200px;
      max-height: 200px;
      border-radius: 4px;
      object-fit: contain;
    }

    .preview-image.favicon {
      width: 64px;
      height: 64px;
    }

    .preview-image.logo {
      width: 150px;
      height: auto;
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

    .color-preview {
      width: 100%;
      height: 100px;
      border-radius: 4px;
      margin-top: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 500;
      text-shadow: 0 1px 3px rgba(0,0,0,0.3);
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
      margin-bottom: 12px;
    }
  `]
})
export class TenantBrandingConfigComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  configForm!: FormGroup;
  faviconPreview = signal<string | null>(null);
  logoPreview = signal<string | null>(null);

  faviconFile: File | null = null;
  logoFile: File | null = null;

  ngOnInit(): void {
    this.initForm();
    this.loadCurrentConfig();
  }

  initForm(): void {
    this.configForm = this.fb.group({
      name: ['', Validators.required],
      displayName: ['', Validators.required],
      primaryColor: ['#1976D2']
    });
  }

  loadCurrentConfig(): void {
    // En producción, cargar la configuración actual del cliente
    // Por ahora, usar valores por defecto
    const currentTenant = localStorage.getItem('currentTenant');
    if (currentTenant) {
      try {
        const tenant = JSON.parse(currentTenant);
        this.configForm.patchValue({
          name: tenant.name,
          displayName: tenant.displayName || tenant.name,
          primaryColor: tenant.primaryColor || '#1976D2'
        });
        
        if (tenant.favicon) {
          this.faviconPreview.set(tenant.favicon);
        }
        if (tenant.logo) {
          this.logoPreview.set(tenant.logo);
        }
      } catch (e) {
        console.error('Error cargando configuración:', e);
      }
    }
  }

  onFaviconSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      this.faviconFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.faviconPreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      this.logoFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.logoPreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  saveConfig(): void {
    if (!this.configForm.valid) {
      this.snackBar.open('Completa todos los campos', 'Cerrar', { duration: 3000 });
      return;
    }

    const formData = new FormData();
    formData.append('name', this.configForm.get('name')?.value);
    formData.append('displayName', this.configForm.get('displayName')?.value);
    formData.append('primaryColor', this.configForm.get('primaryColor')?.value);
    
    if (this.faviconFile) {
      formData.append('favicon', this.faviconFile);
    }
    if (this.logoFile) {
      formData.append('logo', this.logoFile);
    }

    // Guardar en backend (asumiendo endpoint en /api/clients/me/branding)
    this.http.post(`${environment.apiUrl}/clients/me/branding`, formData).subscribe({
      next: (response: any) => {
        this.snackBar.open('Configuración guardada', 'Cerrar', { duration: 2000 });
        
        // Actualizar localStorage
        const updated = {
          ...JSON.parse(localStorage.getItem('currentTenant') || '{}'),
          ...this.configForm.value,
          favicon: this.faviconPreview(),
          logo: this.logoPreview()
        };
        localStorage.setItem('currentTenant', JSON.stringify(updated));
      },
      error: (err) => {
        console.error('Error guardando:', err);
        this.snackBar.open('Error al guardar configuración', 'Cerrar', { duration: 3000 });
      }
    });
  }

  resetForm(): void {
    this.configForm.reset();
    this.faviconPreview.set(null);
    this.logoPreview.set(null);
    this.faviconFile = null;
    this.logoFile = null;
  }
}

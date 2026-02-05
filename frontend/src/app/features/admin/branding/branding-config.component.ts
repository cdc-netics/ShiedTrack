import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BrandingService, SystemBranding } from '../../../core/services/branding.service';

/**
 * Componente de configuración de branding del sistema
 * Permite configurar favicon, logo, nombre y colores
 */
@Component({
    selector: 'app-branding-config',
    imports: [
        CommonModule,
        FormsModule,
        MatCardModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,
        MatIconModule,
        MatSnackBarModule
    ],
    template: `
    <div class="branding-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>
            <mat-icon>palette</mat-icon>
            Configuración de Branding
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <!-- Nombre de la aplicación -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nombre de la Aplicación</mat-label>
            <input matInput [(ngModel)]="branding.appName" placeholder="ShieldTrack">
          </mat-form-field>

          <!-- Upload Favicon -->
          <div class="upload-section">
            <h3>Favicon</h3>
            <div class="preview" *ngIf="branding.faviconUrl">
              <img [src]="branding.faviconUrl" alt="Favicon Preview" width="32" height="32">
            </div>
            <input 
              type="file" 
              #faviconInput 
              accept="image/x-icon,image/png,image/svg+xml" 
              (change)="onFaviconSelect($event)"
              style="display: none">
            <button mat-raised-button color="primary" (click)="faviconInput.click()">
              <mat-icon>cloud_upload</mat-icon>
              Subir Favicon
            </button>
            <p class="hint">Formatos: .ico, .png, .svg (Recomendado: 32x32px)</p>
          </div>

          <!-- Upload Logo -->
          <div class="upload-section">
            <h3>Logo</h3>
            <div class="preview" *ngIf="branding.logoUrl">
              <img [src]="branding.logoUrl" alt="Logo Preview" style="max-width: 200px; max-height: 100px;">
            </div>
            <input 
              type="file" 
              #logoInput 
              accept="image/png,image/svg+xml,image/jpeg" 
              (change)="onLogoSelect($event)"
              style="display: none">
            <button mat-raised-button color="primary" (click)="logoInput.click()">
              <mat-icon>image</mat-icon>
              Subir Logo
            </button>
            <p class="hint">Formatos: .png, .svg, .jpg (Recomendado: 200x60px)</p>
          </div>

          <!-- Colores -->
          <div class="color-section">
            <h3>Colores del Sistema</h3>
            <div class="color-picker">
              <label>Color Primario:</label>
              <input type="color" [(ngModel)]="branding.primaryColor" (change)="previewColors()">
              <span>{{ branding.primaryColor || '#1976d2' }}</span>
            </div>
            <div class="color-picker">
              <label>Color Secundario:</label>
              <input type="color" [(ngModel)]="branding.secondaryColor" (change)="previewColors()">
              <span>{{ branding.secondaryColor || '#424242' }}</span>
            </div>
          </div>
        </mat-card-content>

        <mat-card-actions align="end">
          <button mat-button (click)="reset()">
            <mat-icon>refresh</mat-icon>
            Restaurar Valores por Defecto
          </button>
          <button mat-raised-button color="primary" (click)="save()" [disabled]="saving">
            <mat-icon>save</mat-icon>
            {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
    styles: [`
    .branding-container {
      padding: 24px;
      max-width: 800px;
      margin: 0 auto;
    }

    mat-card-header mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .upload-section {
      margin: 24px 0;
      padding: 16px;
      border: 1px dashed #ccc;
      border-radius: 4px;
    }

    .upload-section h3 {
      margin-top: 0;
      color: #666;
      font-size: 14px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .preview {
      margin: 16px 0;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 4px;
      display: inline-block;
    }

    .hint {
      margin-top: 8px;
      font-size: 12px;
      color: #999;
    }

    .color-section {
      margin: 24px 0;
    }

    .color-section h3 {
      color: #666;
      font-size: 14px;
      font-weight: 500;
      text-transform: uppercase;
    }

    .color-picker {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 12px 0;
    }

    .color-picker label {
      min-width: 140px;
      font-size: 14px;
      color: #666;
    }

    .color-picker input[type="color"] {
      width: 60px;
      height: 40px;
      border: 1px solid #ccc;
      border-radius: 4px;
      cursor: pointer;
    }

    .color-picker span {
      font-family: monospace;
      font-size: 14px;
      color: #666;
    }

    mat-card-actions {
      padding: 16px;
    }
  `]
})
export class BrandingConfigComponent implements OnInit {
  branding: SystemBranding = {
    appName: 'ShieldTrack'
  };
  saving = false;

  constructor(
    private brandingService: BrandingService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.brandingService.branding$.subscribe(branding => {
      this.branding = { ...branding };
    });
  }

  onFaviconSelect(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.brandingService.uploadFavicon(file).subscribe({
        next: (response) => {
          this.branding.faviconUrl = response.faviconUrl;
          this.snackBar.open('Favicon subido exitosamente', 'Cerrar', { duration: 3000 });
        },
        error: (error) => {
          this.snackBar.open('Error al subir favicon: ' + error.message, 'Cerrar', { duration: 5000 });
        }
      });
    }
  }

  onLogoSelect(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.brandingService.uploadLogo(file).subscribe({
        next: (response) => {
          this.branding.logoUrl = response.logoUrl;
          this.snackBar.open('Logo subido exitosamente', 'Cerrar', { duration: 3000 });
        },
        error: (error) => {
          this.snackBar.open('Error al subir logo: ' + error.message, 'Cerrar', { duration: 5000 });
        }
      });
    }
  }

  previewColors(): void {
    // Vista previa temporal de colores
    if (this.branding.primaryColor) {
      document.documentElement.style.setProperty('--primary-color', this.branding.primaryColor);
    }
    if (this.branding.secondaryColor) {
      document.documentElement.style.setProperty('--secondary-color', this.branding.secondaryColor);
    }
  }

  save(): void {
    this.saving = true;
    this.brandingService.updateBranding(this.branding).subscribe({
      next: () => {
        this.snackBar.open('Configuración guardada exitosamente', 'Cerrar', { duration: 3000 });
        this.saving = false;
      },
      error: (error) => {
        this.snackBar.open('Error al guardar: ' + error.message, 'Cerrar', { duration: 5000 });
        this.saving = false;
      }
    });
  }

  reset(): void {
    if (confirm('¿Estás seguro de restaurar los valores por defecto?')) {
      this.branding = {
        appName: 'ShieldTrack',
        primaryColor: '#1976d2',
        secondaryColor: '#424242'
      };
      this.save();
    }
  }
}

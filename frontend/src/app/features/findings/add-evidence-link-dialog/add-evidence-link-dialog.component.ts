import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

export interface AddEvidenceLinkDialogData {
  findingTitle: string;
}

export interface AddEvidenceLinkDialogResult {
  url: string;
  description?: string;
}

/**
 * Diálogo para registrar una evidencia como enlace externo (SharePoint, Drive, etc.)
 * Pensado para archivos que exceden el límite de subida (ej. videos grandes)
 */
@Component({
  standalone: true,
  selector: 'app-add-evidence-link-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>link</mat-icon>
      Agregar Enlace de Evidencia
    </h2>
    <mat-dialog-content>
      <p class="dialog-subtitle">{{ data.findingTitle }}</p>

      <div class="info-box">
        <mat-icon>info</mat-icon>
        <div>Úsalo para archivos que no entran en el límite de subida (ej. videos largos): sube el archivo a SharePoint, Drive u otro repositorio y pega aquí el enlace.</div>
      </div>

      <form [formGroup]="linkForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>URL del enlace</mat-label>
          <input matInput formControlName="url" placeholder="https://miempresa.sharepoint.com/...">
          <mat-icon matPrefix>link</mat-icon>
          @if (linkForm.get('url')?.hasError('required') && linkForm.get('url')?.touched) {
            <mat-error>La URL es requerida</mat-error>
          }
          @if (linkForm.get('url')?.hasError('pattern') && linkForm.get('url')?.touched) {
            <mat-error>Debe ser una URL válida (http:// o https://)</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Descripción (opcional)</mat-label>
          <input matInput formControlName="description" placeholder="Ej: Grabación de la explotación completa (video, 350MB)">
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button color="primary" (click)="onAdd()" [disabled]="!linkForm.valid || saving()">
        <mat-icon>link</mat-icon>
        Agregar Enlace
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-subtitle {
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: 16px;
      font-weight: 500;
    }

    .info-box {
      background: #f5f9ff;
      border: 1px solid #bbdefb;
      border-left: 4px solid #1976d2;
      border-radius: 4px;
      padding: 12px;
      display: flex;
      gap: 12px;
      align-items: flex-start;
      margin-bottom: 20px;
      font-size: 13px;
      color: #0d47a1;
    }

    .info-box mat-icon {
      color: #1976d2;
      font-size: 20px;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .full-width {
      width: 100%;
    }
  `]
})
export class AddEvidenceLinkDialogComponent {
  linkForm: FormGroup;
  saving = signal(false);

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddEvidenceLinkDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddEvidenceLinkDialogData
  ) {
    this.linkForm = this.fb.group({
      url: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/i)]],
      description: ['']
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onAdd(): void {
    if (this.linkForm.invalid || this.saving()) {
      this.linkForm.markAllAsTouched();
      return;
    }

    const result: AddEvidenceLinkDialogResult = {
      url: this.linkForm.value.url.trim(),
      description: this.linkForm.value.description?.trim() || undefined
    };

    this.dialogRef.close(result);
  }
}

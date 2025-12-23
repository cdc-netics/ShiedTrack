import { Component, inject, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-template-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>{{ isEditMode ? 'Editar Plantilla' : 'Nueva Plantilla' }}</h2>
    
    <mat-dialog-content>
      <form [formGroup]="templateForm" class="template-form">
        <!-- Nombre -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nombre de la Vulnerabilidad</mat-label>
          <input matInput formControlName="name" required 
                 placeholder="ej: SQL Injection en formulario de login">
          @if (templateForm.get('name')?.hasError('required')) {
            <mat-error>El nombre es obligatorio</mat-error>
          }
        </mat-form-field>

        <!-- Severidad y CVSS en la misma fila -->
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Severidad</mat-label>
            <mat-select formControlName="severity" required>
              <mat-option value="CRITICAL">Crítica</mat-option>
              <mat-option value="HIGH">Alta</mat-option>
              <mat-option value="MEDIUM">Media</mat-option>
              <mat-option value="LOW">Baja</mat-option>
              <mat-option value="INFO">Informativa</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>CVSS Score</mat-label>
            <input matInput type="number" formControlName="cvssScore" 
                   min="0" max="10" step="0.1" placeholder="9.8">
            @if (templateForm.get('cvssScore')?.hasError('min')) {
              <mat-error>Mínimo 0.0</mat-error>
            }
            @if (templateForm.get('cvssScore')?.hasError('max')) {
              <mat-error>Máximo 10.0</mat-error>
            }
          </mat-form-field>
        </div>

        <!-- CWE ID -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>CWE ID</mat-label>
          <input matInput formControlName="cweId" placeholder="CWE-89">
          <mat-hint>ej: CWE-79, CWE-89, CWE-22</mat-hint>
        </mat-form-field>

        <!-- Descripción -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Descripción</mat-label>
          <textarea matInput formControlName="description" rows="4" required
                    placeholder="Descripción técnica de la vulnerabilidad..."></textarea>
          @if (templateForm.get('description')?.hasError('required')) {
            <mat-error>La descripción es obligatoria</mat-error>
          }
        </mat-form-field>

        <!-- Impacto -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Impacto</mat-label>
          <textarea matInput formControlName="impact" rows="3"
                    placeholder="Descripción del impacto potencial..."></textarea>
        </mat-form-field>

        <!-- Recomendación -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Recomendación</mat-label>
          <textarea matInput formControlName="recommendation" rows="4" required
                    placeholder="Pasos para remediar la vulnerabilidad..."></textarea>
          @if (templateForm.get('recommendation')?.hasError('required')) {
            <mat-error>La recomendación es obligatoria</mat-error>
          }
        </mat-form-field>

        <!-- Referencias -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Referencias</mat-label>
          <textarea matInput formControlName="references" rows="2"
                    placeholder="URLs de referencia separadas por nueva línea"></textarea>
          <mat-hint>Una URL por línea</mat-hint>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button color="primary" 
              (click)="onSave()" 
              [disabled]="templateForm.invalid || saving()">
        @if (saving()) {
          <mat-spinner diameter="20"></mat-spinner>
        } @else {
          Guardar
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .template-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 600px;
      max-width: 800px;
      padding: 16px 0;
    }

    .full-width {
      width: 100%;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    mat-dialog-actions button {
      margin-left: 8px;
    }

    mat-spinner {
      display: inline-block;
      margin: 0;
    }

    textarea {
      resize: vertical;
    }
  `]
})
export class TemplateDialogComponent {
  // Dependencias para formularios, red y dialogos
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<TemplateDialogComponent>);

  // Flags de estado del dialogo
  isEditMode = false;
  saving = signal(false);

  templateForm: FormGroup;
  private API_URL = `${environment.apiUrl}/templates`;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
    // Define modo edicion si viene _id
    this.isEditMode = !!data?._id;
    
    // Inicializa formulario con datos existentes o defaults
    this.templateForm = this.fb.group({
      name: [data?.name || '', Validators.required],
      severity: [data?.severity || 'MEDIUM', Validators.required],
      cvssScore: [data?.cvssScore || null, [Validators.min(0), Validators.max(10)]],
      cweId: [data?.cweId || ''],
      description: [data?.description || '', Validators.required],
      impact: [data?.impact || ''],
      recommendation: [data?.recommendation || '', Validators.required],
      references: [data?.references?.join('\n') || '']
    });
  }

  onSave(): void {
    // Valida y persiste la plantilla
    if (this.templateForm.invalid) {
      return;
    }

    this.saving.set(true);
    const formData = this.templateForm.value;

    // Convertir referencias de string a array
    const templateData = {
      ...formData,
      references: formData.references 
        ? formData.references.split('\n').filter((ref: string) => ref.trim())
        : []
    };

    const request = this.isEditMode
      ? this.http.put(`${this.API_URL}/${this.data._id}`, templateData)
      : this.http.post(this.API_URL, templateData);

    request.subscribe({
      next: () => {
        this.snackBar.open(
          this.isEditMode ? 'Plantilla actualizada' : 'Plantilla creada',
          'Cerrar',
          { duration: 3000 }
        );
        // Cierra indicando que hubo cambios
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Error al guardar plantilla:', err);
        this.snackBar.open(
          err.error?.message || 'Error al guardar plantilla',
          'Cerrar',
          { duration: 3000 }
        );
        this.saving.set(false);
      }
    });
  }

  onCancel(): void {
    // Cierre sin guardar
    this.dialogRef.close();
  }
}

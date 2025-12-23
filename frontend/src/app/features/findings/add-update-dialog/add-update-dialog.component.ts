import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

export interface AddUpdateDialogData {
  findingId: string;
  findingTitle: string;
}

export interface AddUpdateDialogResult {
  type: string;
  content: string;
  evidenceIds?: string[];
  files?: File[];
}

/**
 * Diálogo para agregar seguimiento/actualización a un hallazgo
 */
@Component({
  selector: 'app-add-update-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>add_comment</mat-icon>
      Agregar Seguimiento
    </h2>
    <mat-dialog-content>
      <p class="dialog-subtitle">{{ data.findingTitle }}</p>
      
      <form [formGroup]="updateForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Tipo de Seguimiento</mat-label>
          <mat-select formControlName="type" required>
            <mat-option value="FOLLOWUP">
              <mat-icon>track_changes</mat-icon>
              📋 Seguimiento - Progreso, coordinación cliente, avances
            </mat-option>
            <mat-option value="COMMENT">
              <mat-icon>comment</mat-icon>
              💬 Comentario - Notas generales, observaciones
            </mat-option>
          </mat-select>
          @if (updateForm.get('type')?.hasError('required') && updateForm.get('type')?.touched) {
            <mat-error>El tipo es requerido</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Descripción del Seguimiento</mat-label>
          <textarea 
            matInput 
            formControlName="content" 
            rows="8"
            placeholder="Ej: Cliente confirmó que comenzaron remediación. Fecha estimada: 15/01/2025. Se adjunta evidencia del plan de acción."
            required
          ></textarea>
          <mat-hint>Documenta el progreso, acciones tomadas, coordinación, etc.</mat-hint>
          @if (updateForm.get('content')?.hasError('required') && updateForm.get('content')?.touched) {
            <mat-error>La descripción es requerida</mat-error>
          }
        </mat-form-field>

        <!-- Selector de archivos -->
        <div class="file-upload-section">
          <button type="button" mat-stroked-button color="primary" (click)="selectFiles()">
            <mat-icon>attach_file</mat-icon>
            Adjuntar Evidencias
          </button>
          @if (selectedFiles().length > 0) {
            <div class="selected-files">
              <h4>📎 Archivos seleccionados:</h4>
              @for (file of selectedFiles(); track $index) {
                <mat-chip-row (removed)="removeFile($index)">
                  {{ file.name }} ({{ formatSize(file.size) }})
                  <button matChipRemove><mat-icon>cancel</mat-icon></button>
                </mat-chip-row>
              }
            </div>
          }
        </div>
      </form>

      <div class="info-box">
        <mat-icon>info</mat-icon>
        <div>
          <strong>💡 Ejemplos de seguimientos:</strong>
          <ul>
            <li>📞 "Cliente solicita prórroga hasta 30/01. Confirman inicio de remediación"</li>
            <li>✅ "Se verificó parcialmente. Aplicaron patch pero falta configuración adicional"</li>
            <li>⚠️ "Cliente reporta dificultades técnicas. Requiere asistencia adicional"</li>
            <li>📧 "Enviado recordatorio por email. A la espera de respuesta"</li>
          </ul>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button 
        mat-raised-button 
        color="primary" 
        (click)="onAdd()"
        [disabled]="!updateForm.valid || saving()"
      >
        <mat-icon>add</mat-icon>
        {{ saving() ? 'Guardando...' : 'Agregar Seguimiento' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-subtitle {
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: 20px;
      font-weight: 500;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 20px;
    }

    .full-width {
      width: 100%;
    }

    mat-option {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    mat-option mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .info-box {
      background: #e3f2fd;
      border: 1px solid #2196f3;
      border-radius: 4px;
      padding: 12px;
      display: flex;
      gap: 12px;
      align-items: flex-start;
      margin-top: 16px;
    }

    .info-box mat-icon {
      color: #2196f3;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .info-box div {
      flex: 1;
      font-size: 13px;
      line-height: 1.5;
    }

    .info-box ul {
      margin: 8px 0 0 0;
      padding-left: 20px;
    }

    .info-box li {
      margin-bottom: 4px;
    }

    mat-dialog-actions {
      padding: 16px 24px;
      margin: 0;
    }

    h2 {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    mat-dialog-content {
      min-width: 500px;
      max-width: 600px;
    }

    .file-upload-section {
      margin: 16px 0;
      padding: 16px;
      border: 2px dashed #ccc;
      border-radius: 8px;
      text-align: center;
    }

    .selected-files {
      margin-top: 16px;
      text-align: left;
    }

    .selected-files h4 {
      margin: 0 0 8px 0;
      font-size: 14px;
      color: #666;
    }

    .selected-files mat-chip-row {
      margin: 4px 0;
    }
  `]
})
export class AddUpdateDialogComponent {
  // Formulario de seguimiento y estado del dialogo
  updateForm: FormGroup;
  saving = signal(false);
  selectedFiles = signal<File[]>([]);

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddUpdateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddUpdateDialogData
  ) {
    // Inicializa formulario con valores por defecto
    this.updateForm = this.fb.group({
      type: ['FOLLOWUP', Validators.required],
      content: ['', Validators.required]
    });
  }

  selectFiles(): void {
    // Selector nativo de archivos para adjuntos
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,.pdf,.doc,.docx,.txt,.json,.xml';
    
    input.onchange = (e: any) => {
      const files = Array.from(e.target.files as FileList);
      this.selectedFiles.set([...this.selectedFiles(), ...files]);
    };
    
    input.click();
  }

  removeFile(index: number): void {
    // Quita un adjunto seleccionado
    this.selectedFiles.update(files => files.filter((_, i) => i !== index));
  }

  formatSize(bytes: number): string {
    // Formatea tamanos en bytes a unidades cortas
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  onCancel(): void {
    // Cierra sin cambios
    this.dialogRef.close();
  }

  onAdd(): void {
    // Retorna el payload al componente padre
    if (this.updateForm.valid) {
      this.saving.set(true);
      const result: AddUpdateDialogResult = {
        type: this.updateForm.value.type,
        content: this.updateForm.value.content,
        files: this.selectedFiles()
      };
      this.dialogRef.close(result);
    }
  }
}

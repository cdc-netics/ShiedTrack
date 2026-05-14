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
 * Dialogo para agregar seguimiento/actualizacion a un hallazgo.
 */
@Component({
  standalone: true,
  selector: 'app-add-update-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
    MatChipsModule
  ],
  template: `
    <h2 mat-dialog-title>
      Agregar Seguimiento
    </h2>

    <mat-dialog-content>
      <p class="dialog-subtitle">{{ data.findingTitle }}</p>

      <form [formGroup]="updateForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Tipo de Seguimiento</mat-label>
          <mat-select formControlName="type" required>
            <mat-option value="FOLLOWUP">
              <span class="option-row">
                <mat-icon>track_changes</mat-icon>
                Seguimiento - Progreso, coordinacion cliente, avances
              </span>
            </mat-option>
            <mat-option value="COMMENT">
              <span class="option-row">
                <mat-icon>comment</mat-icon>
                Comentario - Notas generales, observaciones
              </span>
            </mat-option>
          </mat-select>
          @if (updateForm.get('type')?.hasError('required') && updateForm.get('type')?.touched) {
            <mat-error>El tipo es requerido</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Descripcion del Seguimiento</mat-label>
          <textarea
            matInput
            formControlName="content"
            rows="8"
            placeholder="Ej: Cliente confirmo que comenzaron remediacion. Fecha estimada: 15/01/2025. Se adjunta evidencia del plan de accion."
            required
          ></textarea>
          <mat-hint>Documenta el progreso, acciones tomadas, coordinacion, etc.</mat-hint>
          @if (updateForm.get('content')?.hasError('required') && updateForm.get('content')?.touched) {
            <mat-error>La descripcion es requerida</mat-error>
          }
        </mat-form-field>

        <div class="file-upload-section">
          <button type="button" mat-stroked-button color="primary" (click)="selectFiles()">
            Adjuntar Evidencias
          </button>

          @if (selectedFiles().length > 0) {
            <div class="selected-files">
              <h4>
                <mat-icon>description</mat-icon>
                Archivos seleccionados:
              </h4>
              <mat-chip-set aria-label="Archivos seleccionados">
                @for (file of selectedFiles(); track file.name + file.size + $index) {
                  <mat-chip-row (removed)="removeFile($index)">
                    <span class="file-name">{{ file.name }}</span>
                    <span class="file-size">({{ formatSize(file.size) }})</span>
                    <button matChipRemove aria-label="Quitar archivo">
                      <mat-icon>cancel</mat-icon>
                    </button>
                  </mat-chip-row>
                }
              </mat-chip-set>
            </div>
          }
        </div>
      </form>

      <div class="info-box">
        <div>
          <strong>Ejemplos de seguimientos:</strong>
          <ul>
            <li>"Cliente solicita prorroga hasta 30/01. Confirman inicio de remediacion"</li>
            <li>"Se verifico parcialmente. Aplicaron patch pero falta configuracion adicional"</li>
            <li>"Cliente reporta dificultades tecnicas. Requiere asistencia adicional"</li>
            <li>"Enviado recordatorio por email. A la espera de respuesta"</li>
          </ul>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="onCancel()">Cancelar</button>
      <button class="save-button" type="button" (click)="onAdd()" [disabled]="!updateForm.valid || saving()">
        Guardar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2[mat-dialog-title] {
      margin: 0;
      padding: 24px 24px 12px;
      font-size: 1.25rem;
      line-height: 1.3;
      letter-spacing: 0;
    }

    mat-dialog-content {
      width: min(680px, calc(100vw - 48px));
      max-width: 100%;
      padding: 0 24px 8px;
    }

    .dialog-subtitle {
      color: rgba(0, 0, 0, 0.6);
      margin: 0 0 20px;
      font-weight: 500;
      line-height: 1.4;
      overflow-wrap: anywhere;
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

    .option-row {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .option-row mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      flex: 0 0 auto;
    }

    textarea {
      resize: vertical;
      min-height: 150px;
    }

    .file-upload-section {
      margin: 16px 0;
      padding: 16px;
      border: 2px dashed #ccc;
      border-radius: 8px;
      text-align: center;
      background: #fff;
    }

    .file-upload-section > button {
      min-width: 190px;
    }

    .save-button {
      background-color: #1976d2 !important;
      color: #fff !important;
      border: 0;
      border-radius: 4px;
      box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12);
      cursor: pointer;
      font-family: inherit;
      font-size: 14px;
      font-weight: 400;
      height: 36px;
      letter-spacing: 0;
      line-height: 36px;
      min-width: 104px;
      padding: 0 18px;
      text-align: center;
    }

    .save-button:disabled {
      background-color: #1976d2 !important;
      color: #fff !important;
      cursor: default;
      opacity: 0.72;
    }

    .selected-files {
      margin-top: 16px;
      text-align: left;
    }

    .selected-files h4 {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0 0 10px;
      font-size: 14px;
      color: #666;
      font-weight: 600;
    }

    .selected-files h4 mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    mat-chip-set {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .file-name {
      display: inline-block;
      max-width: 280px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      vertical-align: bottom;
    }

    .file-size {
      color: rgba(0, 0, 0, 0.58);
      margin-left: 4px;
      font-size: 0.82rem;
    }

    .info-box {
      background: #f5f9ff;
      border: 1px solid #bbdefb;
      border-left: 4px solid #1976d2;
      border-radius: 4px;
      box-sizing: border-box;
      padding: 16px 18px;
      margin: 18px 0 0;
      width: 100%;
    }

    .info-box div {
      font-size: 14px;
      line-height: 1.55;
    }

    .info-box strong {
      display: block;
      margin-bottom: 8px;
      color: #0d47a1;
      font-size: 15px;
    }

    .info-box ul {
      margin: 0;
      padding-left: 20px;
    }

    .info-box li {
      margin-bottom: 6px;
    }

    mat-dialog-actions {
      padding: 16px 24px 24px;
      margin: 0;
      gap: 8px;
    }

    @media (max-width: 640px) {
      h2[mat-dialog-title] {
        padding: 20px 16px 12px;
      }

      mat-dialog-content {
        width: calc(100vw - 32px);
        padding-left: 16px;
        padding-right: 16px;
      }

      mat-dialog-actions {
        padding-left: 16px;
        padding-right: 16px;
        flex-direction: column-reverse;
        align-items: stretch;
      }

      mat-dialog-actions button,
      .file-upload-section > button {
        width: 100%;
      }
    }
  `]
})
export class AddUpdateDialogComponent {
  updateForm: FormGroup;
  saving = signal(false);
  selectedFiles = signal<File[]>([]);

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddUpdateDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddUpdateDialogData
  ) {
    this.updateForm = this.fb.group({
      type: ['FOLLOWUP', Validators.required],
      content: ['', Validators.required]
    });
  }

  selectFiles(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,.pdf,.doc,.docx,.txt,.json,.xml';

    input.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const files = Array.from(target.files || []);
      this.selectedFiles.set([...this.selectedFiles(), ...files]);
    };

    input.click();
  }

  removeFile(index: number): void {
    this.selectedFiles.update(files => files.filter((_, i) => i !== index));
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);

    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onAdd(): void {
    if (this.updateForm.invalid || this.saving()) {
      this.updateForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const result: AddUpdateDialogResult = {
      type: this.updateForm.value.type,
      content: this.updateForm.value.content,
      files: this.selectedFiles()
    };

    this.dialogRef.close(result);
  }
}

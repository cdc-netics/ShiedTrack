import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

export interface CloseDialogData {
  findingId: string;
  findingTitle: string;
}

export interface CloseDialogResult {
  closeReason: string;
  comment?: string;
}

/**
 * Diálogo para cerrar un hallazgo
 * Permite seleccionar motivo de cierre y agregar comentario opcional
 */
@Component({
    selector: 'app-close-finding-dialog',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        MatIconModule
    ],
    template: `
    <h2 mat-dialog-title>
      <mat-icon>lock</mat-icon>
      Cerrar Hallazgo
    </h2>
    <mat-dialog-content>
      <p class="dialog-subtitle">{{ data.findingTitle }}</p>
      
      <form [formGroup]="closeForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Motivo de Cierre</mat-label>
          <mat-select formControlName="closeReason" required>
            <mat-option value="FIXED">
              <mat-icon>check_circle</mat-icon>
              Vulnerabilidad Corregida
            </mat-option>
            <mat-option value="RISK_ACCEPTED">
              <mat-icon>verified_user</mat-icon>
              Riesgo Aceptado por el Cliente
            </mat-option>
            <mat-option value="FALSE_POSITIVE">
              <mat-icon>error_outline</mat-icon>
              Falso Positivo
            </mat-option>
            <mat-option value="OUT_OF_SCOPE">
              <mat-icon>block</mat-icon>
              Fuera del Alcance
            </mat-option>
            <mat-option value="DUPLICATE">
              <mat-icon>content_copy</mat-icon>
              Duplicado
            </mat-option>
            <mat-option value="CONTRACT_ENDED">
              <mat-icon>event_busy</mat-icon>
              Contrato Finalizado
            </mat-option>
          </mat-select>
          @if (closeForm.get('closeReason')?.hasError('required') && closeForm.get('closeReason')?.touched) {
            <mat-error>El motivo de cierre es requerido</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Comentario (Opcional)</mat-label>
          <textarea 
            matInput 
            formControlName="comment" 
            rows="4"
            placeholder="Agregar detalles sobre el cierre del hallazgo..."
          ></textarea>
          <mat-hint>Documenta información relevante sobre el cierre</mat-hint>
        </mat-form-field>
      </form>

      <div class="warning-box">
        <mat-icon>warning</mat-icon>
        <div>
          <strong>Advertencia:</strong> Esta acción cerrará permanentemente el hallazgo.
          El hallazgo pasará a estado CLOSED y quedará registrado en el historial.
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button 
        mat-raised-button 
        color="warn" 
        (click)="onClose()"
        [disabled]="!closeForm.valid || closing()"
      >
        <mat-icon>lock</mat-icon>
        {{ closing() ? 'Cerrando...' : 'Cerrar Hallazgo' }}
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

    .warning-box {
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 4px;
      padding: 12px;
      display: flex;
      gap: 12px;
      align-items: flex-start;
      margin-top: 16px;
    }

    .warning-box mat-icon {
      color: #ff9800;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .warning-box div {
      flex: 1;
      font-size: 14px;
      line-height: 1.5;
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
  `]
})
export class CloseFindingDialogComponent {
  // Formulario y estado de cierre
  closeForm: FormGroup;
  closing = signal(false);

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<CloseFindingDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CloseDialogData
  ) {
    // Inicializa formulario con validaciones
    this.closeForm = this.fb.group({
      closeReason: ['', Validators.required],
      comment: ['']
    });
  }

  onCancel(): void {
    // Cierre sin cambios
    this.dialogRef.close();
  }

  onClose(): void {
    // Devuelve el motivo de cierre al componente padre
    if (this.closeForm.valid) {
      this.closing.set(true);
      const result: CloseDialogResult = {
        closeReason: this.closeForm.value.closeReason,
        comment: this.closeForm.value.comment || undefined
      };
      this.dialogRef.close(result);
    }
  }
}

import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'app-area-dialog',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatSnackBarModule
    ],
    template: `
    <h2 mat-dialog-title>{{ data.area ? 'Editar' : 'Crear' }} Área</h2>
    <mat-dialog-content>
      <form [formGroup]="areaForm">
        <!-- Cliente eliminado: el tenant se determina automáticamente por contexto -->

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nombre del Área</mat-label>
          <input matInput formControlName="name" placeholder="Ej: Ciberseguridad">
          <mat-hint>Nombre descriptivo del área (TI, RRHH, Legal, etc.)</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Prefijo para Hallazgos (Opcional)</mat-label>
          <input matInput formControlName="findingCodePrefix" placeholder="Ej: CIBER" oninput="this.value = this.value.toUpperCase()">
          <mat-hint>Sobrescribe configuración global. Ej: CIBER-001</mat-hint>
          <mat-error>Solo letras mayúsculas, números y guiones (2-10 caracteres)</mat-error>
        </mat-form-field>

        @if (data.area) {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Código</mat-label>
            <input matInput [value]="data.area.code" disabled>
            <mat-hint>El código se genera automáticamente</mat-hint>
          </mat-form-field>
        } @else {
          <p class="code-info">ℹ️ El código se generará automáticamente al crear el área</p>
        }

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Descripción (Opcional)</mat-label>
          <textarea matInput formControlName="description" rows="3" 
                    placeholder="Descripción de las responsabilidades del área"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button color="primary" (click)="onSave()" [disabled]="!areaForm.valid">
        Guardar
      </button>
    </mat-dialog-actions>
  `,
    styles: [`
    mat-dialog-content {
      min-width: 500px;
      padding: 24px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    mat-form-field {
      display: block;
    }

    .code-info {
      padding: 12px;
      background: #e3f2fd;
      border-radius: 4px;
      color: #1976d2;
      font-size: 14px;
      margin-bottom: 16px;
    }
  `]
})
export class AreaDialogComponent implements OnInit {
  // Formulario de alta/edicion del area
  areaForm: FormGroup;
  clients: any[] = []; // Lista de clientes para el selector

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { area?: any, clientId: string },
    private dialogRef: MatDialogRef<AreaDialogComponent>,
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {
    // Configura validaciones base
    this.areaForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      findingCodePrefix: ['', [Validators.pattern('^[A-Z0-9-]{2,10}$')]]
    });
  }

  ngOnInit(): void {
    // Si no viene clientId, cargar lista de clientes
    // El tenant se toma desde el contexto (JWT/header); no se requiere cargar clientes.

    // Si viene area, precarga valores para edicion
    if (this.data.area) {
      this.areaForm.patchValue({
        name: this.data.area.name,
        description: this.data.area.description || '',
        findingCodePrefix: this.data.area.findingCodePrefix || ''
      });
    }
  }
  // Cliente/tenant ya no se selecciona aquí; se usa el contexto.

  onSave(): void {
    // Persiste cambios en backend y cierra el dialogo
    if (!this.areaForm.valid) return;

    const areaData = {
      ...this.areaForm.value
    };

    const request = this.data.area
      ? this.http.put(`http://localhost:3000/api/areas/${this.data.area._id}`, areaData)
      : this.http.post('http://localhost:3000/api/areas', areaData);

    request.subscribe({
      next: () => {
        this.snackBar.open(
          this.data.area ? 'Área actualizada' : 'Área creada exitosamente',
          'Cerrar',
          { duration: 3000 }
        );
        // Devuelve true para refrescar el listado
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Error al guardar área:', err);
        this.snackBar.open(
          err.error?.message || 'Error al guardar área',
          'Cerrar',
          { duration: 3000 }
        );
      }
    });
  }

  onCancel(): void {
    // Cierre sin cambios
    this.dialogRef.close(false);
  }
}

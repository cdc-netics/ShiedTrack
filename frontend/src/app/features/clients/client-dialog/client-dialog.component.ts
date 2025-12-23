import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-client-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>{{ data ? 'edit' : 'add' }}</mat-icon>
      {{ data ? 'Editar Cliente' : 'Nuevo Cliente' }}
    </h2>
    
    <mat-dialog-content>
      <form [formGroup]="clientForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nombre del Cliente *</mat-label>
          <input matInput formControlName="name" required autofocus>
          <mat-error>El nombre es requerido</mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancelar</button>
      <button mat-raised-button color="primary" 
              (click)="save()" 
              [disabled]="!clientForm.valid || saving">
        @if (saving) {
          <mat-spinner diameter="20"></mat-spinner>
        } @else {
          <mat-icon>save</mat-icon>
        }
        Guardar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    mat-dialog-content {
      min-width: 500px;
      padding: 24px;
    }

    h2 {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    mat-spinner {
      display: inline-block;
      margin-right: 8px;
    }
  `]
})
export class ClientDialogComponent {
  // Dependencias para formularios, red y UI
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  dialogRef = inject(MatDialogRef<ClientDialogComponent>);
  data = inject(MAT_DIALOG_DATA, { optional: true });

  // Formulario simple de nombre; reutiliza datos si es edicion
  clientForm: FormGroup;
  saving = false;

  constructor() {
    // Inicializa el formulario con datos existentes cuando corresponde
    this.clientForm = this.fb.group({
      name: [this.data?.name || '', Validators.required]
    });
  }

  save(): void {
    // Persistencia con POST/PUT segun sea alta o edicion
    if (!this.clientForm.valid) return;

    this.saving = true;
    const clientData = this.clientForm.value;
    const url = this.data 
      ? `http://localhost:3000/api/clients/${this.data._id}`
      : 'http://localhost:3000/api/clients';
    
    const request = this.data
      ? this.http.put(url, clientData)
      : this.http.post(url, clientData);

    request.subscribe({
      next: (result) => {
        this.snackBar.open(
          this.data ? 'Cliente actualizado' : 'Cliente creado exitosamente',
          'Cerrar',
          { duration: 3000 }
        );
        // Cierra el dialogo entregando el resultado al caller
        this.dialogRef.close(result);
      },
      error: (err) => {
        this.saving = false;
        this.snackBar.open(
          'Error: ' + (err.error?.message || 'No se pudo guardar el cliente'),
          'Cerrar',
          { duration: 5000 }
        );
      }
    });
  }
}

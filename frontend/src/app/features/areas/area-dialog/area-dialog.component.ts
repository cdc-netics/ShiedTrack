import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-area-dialog',
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
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>{{ data?.area ? 'edit' : 'add' }}</mat-icon>
      {{ data?.area ? 'Editar Área' : 'Nueva Área' }}
    </h2>
    
    <mat-dialog-content>
      <form [formGroup]="areaForm">
        @if (!data?.clientId) {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Cliente *</mat-label>
            <mat-select formControlName="clientId" required>
              @for (client of clients; track client._id) {
                <mat-option [value]="client._id">{{ client.name }}</mat-option>
              }
            </mat-select>
            <mat-error>Selecciona un cliente</mat-error>
          </mat-form-field>
        }

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nombre del Área *</mat-label>
          <input matInput formControlName="name" required>
          <mat-error>El nombre es requerido</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Descripción</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancelar</button>
      <button mat-raised-button color="primary" 
              (click)="save()" 
              [disabled]="!areaForm.valid || saving">
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
      min-width: 450px;
      padding: 24px;
    }

    h2 {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  `]
})
export class AreaDialogComponent {
  // Dependencias para formulario, red y UI
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  dialogRef = inject(MatDialogRef<AreaDialogComponent>);
  data = inject(MAT_DIALOG_DATA, { optional: true });

  // Formulario y estado local
  areaForm: FormGroup;
  saving = false;
  clients: any[] = [];

  constructor() {
    // Inicializa con datos existentes cuando se edita
    this.areaForm = this.fb.group({
      clientId: [this.data?.clientId || this.data?.area?.clientId || '', Validators.required],
      name: [this.data?.area?.name || '', Validators.required],
      description: [this.data?.area?.description || '']
    });

    // Si no viene clientId fijo, cargar lista para selector
    if (!this.data?.clientId) {
      this.loadClients();
    }
  }

  loadClients(): void {
    // Carga catalogo de clientes para asignacion de area
    this.http.get<any[]>('http://localhost:3000/api/clients').subscribe({
      next: (data) => {
        this.clients = data;
      }
    });
  }

  save(): void {
    // Guarda cambios en modo crear o editar
    if (!this.areaForm.valid) return;

    this.saving = true;
    const areaData = this.areaForm.value;
    const url = this.data?.area
      ? `http://localhost:3000/api/areas/${this.data.area._id}`
      : 'http://localhost:3000/api/areas';
    
    const request = this.data?.area
      ? this.http.put(url, areaData)
      : this.http.post(url, areaData);

    request.subscribe({
      next: (result) => {
        this.snackBar.open(
          this.data?.area ? 'Área actualizada' : 'Área creada exitosamente',
          'Cerrar',
          { duration: 3000 }
        );
        this.dialogRef.close(result);
      },
      error: (err) => {
        this.saving = false;
        this.snackBar.open(
          'Error: ' + (err.error?.message || 'No se pudo guardar el área'),
          'Cerrar',
          { duration: 5000 }
        );
      }
    });
  }
}

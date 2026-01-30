import { Component, inject, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

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
    MatProgressSpinnerModule,
    MatTabsModule,
    MatCheckboxModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>{{ data ? 'edit' : 'add' }}</mat-icon>
      {{ data ? 'Editar Cliente' : 'Nuevo Cliente' }}
    </h2>
    
    <mat-dialog-content>
      <mat-tab-group>
        <!-- Tab 1: Información Básica -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>info</mat-icon>
            <span>Información Básica</span>
          </ng-template>
          
          <form [formGroup]="clientForm" class="tab-content">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nombre del Cliente *</mat-label>
              <input matInput formControlName="name" required autofocus>
              <mat-error>El nombre es requerido</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nombre Corto para Mostrar</mat-label>
              <input matInput formControlName="displayName" placeholder="ej: ACME">
              <mat-hint>Nombre corto que se mostrará en la UI</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Código</mat-label>
              <input matInput formControlName="code" placeholder="ej: CLI001">
              <mat-hint>Identificador único (opcional)</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Descripción</mat-label>
              <textarea matInput formControlName="description" rows="3"></textarea>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email de Contacto</mat-label>
              <input matInput type="email" formControlName="contactEmail">
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Teléfono</mat-label>
              <input matInput formControlName="contactPhone">
            </mat-form-field>
          </form>
        </mat-tab>

        <!-- Tab 2: Admin Inicial (solo para crear nuevo cliente) -->
        @if (!data) {
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>person_add</mat-icon>
              <span>Admin Inicial</span>
            </ng-template>
            
            <form [formGroup]="adminForm" class="tab-content">
              <div class="form-hint">
                <mat-icon>info</mat-icon>
                <span>Configura el administrador inicial del cliente (opcional)</span>
              </div>

              <mat-checkbox formControlName="createInitialAdmin" (change)="onAdminToggle()">
                Crear administrador inicial
              </mat-checkbox>

              @if (showAdminFields()) {
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Email del Admin *</mat-label>
                  <input matInput type="email" formControlName="initialAdminEmail" required>
                  @if (adminForm.get('initialAdminEmail')?.hasError('required')) {
                    <mat-error>Email requerido</mat-error>
                  }
                  @if (adminForm.get('initialAdminEmail')?.hasError('email')) {
                    <mat-error>Email inválido</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Nombre Completo *</mat-label>
                  <input matInput formControlName="initialAdminName" required>
                  <mat-error>Nombre requerido</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Contraseña Temporal *</mat-label>
                  <input matInput type="password" formControlName="initialAdminPassword" required>
                  <mat-hint>Mínimo 8 caracteres</mat-hint>
                  @if (adminForm.get('initialAdminPassword')?.hasError('required')) {
                    <mat-error>Contraseña requerida</mat-error>
                  }
                  @if (adminForm.get('initialAdminPassword')?.hasError('minlength')) {
                    <mat-error>Mínimo 8 caracteres</mat-error>
                  }
                </mat-form-field>
              }
            </form>
          </mat-tab>
        }
      </mat-tab-group>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancelar</button>
      <button mat-raised-button color="primary" 
              (click)="save()" 
              [disabled]="!isFormValid() || saving">
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

    .tab-content {
      padding: 24px;
    }

    mat-dialog-content {
      min-width: 500px;
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

    .form-hint {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 16px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 4px;
    }

    .form-hint mat-icon {
      flex-shrink: 0;
      margin-top: 2px;
    }

    mat-checkbox {
      display: block;
      margin-bottom: 16px;
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

  // Formularios
  clientForm: FormGroup;
  adminForm: FormGroup;
  saving = false;
  showAdminFields = signal(false);

  constructor() {
    // Inicializa el formulario del cliente
    this.clientForm = this.fb.group({
      name: [this.data?.name || '', Validators.required],
      displayName: [this.data?.displayName || ''],
      code: [this.data?.code || ''],
      description: [this.data?.description || ''],
      contactEmail: [this.data?.contactEmail || ''],
      contactPhone: [this.data?.contactPhone || '']
    });

    // Formulario para admin inicial
    this.adminForm = this.fb.group({
      createInitialAdmin: [false],
      initialAdminEmail: [''],
      initialAdminName: [''],
      initialAdminPassword: ['']
    });
  }

  onAdminToggle(): void {
    const createAdmin = this.adminForm.get('createInitialAdmin')?.value;
    this.showAdminFields.set(createAdmin);

    if (createAdmin) {
      this.adminForm.get('initialAdminEmail')?.setValidators([Validators.required, Validators.email]);
      this.adminForm.get('initialAdminName')?.setValidators(Validators.required);
      this.adminForm.get('initialAdminPassword')?.setValidators([Validators.required, Validators.minLength(8)]);
    } else {
      this.adminForm.get('initialAdminEmail')?.clearValidators();
      this.adminForm.get('initialAdminName')?.clearValidators();
      this.adminForm.get('initialAdminPassword')?.clearValidators();
    }

    this.adminForm.get('initialAdminEmail')?.updateValueAndValidity();
    this.adminForm.get('initialAdminName')?.updateValueAndValidity();
    this.adminForm.get('initialAdminPassword')?.updateValueAndValidity();
  }

  isFormValid(): boolean {
    return this.clientForm.valid && this.adminForm.valid;
  }

  save(): void {
    if (!this.isFormValid()) return;

    this.saving = true;
    const clientData = { ...this.clientForm.value };
    
    // Agregar datos del admin inicial si está habilitado
    if (this.adminForm.get('createInitialAdmin')?.value) {
      clientData.initialAdmin = {
        email: this.adminForm.get('initialAdminEmail')?.value,
        name: this.adminForm.get('initialAdminName')?.value,
        password: this.adminForm.get('initialAdminPassword')?.value
      };
    }

    const url = this.data 
      ? `${environment.apiUrl}/clients/${this.data._id}`
      : `${environment.apiUrl}/clients`;
    
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

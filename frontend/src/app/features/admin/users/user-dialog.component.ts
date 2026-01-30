import { Component, inject, Inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatChipsModule
  ],
  template: `
    <h2 mat-dialog-title>{{ isEditMode ? 'Editar Usuario' : 'Nuevo Usuario' }}</h2>
    
    <mat-dialog-content>
      <form [formGroup]="userForm" class="user-form">
        <!-- Nombre -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="firstName" required>
          @if (userForm.get('firstName')?.hasError('required')) {
            <mat-error>El nombre es obligatorio</mat-error>
          }
        </mat-form-field>

        <!-- Apellido -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Apellido</mat-label>
          <input matInput formControlName="lastName" required>
          @if (userForm.get('lastName')?.hasError('required')) {
            <mat-error>El apellido es obligatorio</mat-error>
          }
        </mat-form-field>

        <!-- Email -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email" required>
          @if (userForm.get('email')?.hasError('required')) {
            <mat-error>El email es obligatorio</mat-error>
          }
          @if (userForm.get('email')?.hasError('email')) {
            <mat-error>Email inválido</mat-error>
          }
        </mat-form-field>

        <!-- Password (solo para nuevos usuarios) -->
        @if (!isEditMode) {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Contraseña</mat-label>
            <input matInput type="password" formControlName="password" required>
            @if (userForm.get('password')?.hasError('required')) {
              <mat-error>La contraseña es obligatoria</mat-error>
            }
            @if (userForm.get('password')?.hasError('minlength')) {
              <mat-error>Mínimo 8 caracteres</mat-error>
            }
          </mat-form-field>
        }

        <!-- Cliente (solo para OWNER/PLATFORM_ADMIN) -->
        @if (showClientSelect()) {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Cliente</mat-label>
            <mat-select formControlName="clientId" [required]="isClientRequired()">
              <mat-option [value]="null">-- Sin Asignación (Global) --</mat-option>
              @for (client of clients(); track client._id) {
                <mat-option [value]="client._id">{{ client.name }}</mat-option>
              }
            </mat-select>
            @if (userForm.get('clientId')?.hasError('required')) {
              <mat-error>El cliente es obligatorio para este rol</mat-error>
            }
          </mat-form-field>
        }

        <!-- Rol -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Rol</mat-label>
          <mat-select formControlName="role" required>
            <mat-option value="OWNER">Owner</mat-option>
            <mat-option value="AREA_ADMIN">Area Admin</mat-option>
            <mat-option value="ANALYST">Analista</mat-option>
            <mat-option value="VIEWER">Viewer</mat-option>
          </mat-select>
          @if (userForm.get('role')?.hasError('required')) {
            <mat-error>El rol es obligatorio</mat-error>
          }
        </mat-form-field>

        <!-- Tenants (para AREA_ADMIN, ANALYST, VIEWER) -->
        @if (showAreaSelect()) {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Tenants asignados</mat-label>
            <mat-select formControlName="areaIds" multiple>
              @if (areas().length === 0) {
                <mat-option disabled>
                  No hay áreas disponibles
                </mat-option>
              }
              @for (area of areas(); track area._id) {
                <mat-option [value]="area._id">{{ area.name }} ({{ area.code }})</mat-option>
              }
            </mat-select>
            <mat-hint>Selecciona las áreas a las que tendrá acceso el usuario</mat-hint>
          </mat-form-field>
        }
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button color="primary" 
              (click)="onSave()" 
              [disabled]="userForm.invalid || saving()">
        @if (saving()) {
          <mat-spinner diameter="20"></mat-spinner>
        } @else {
          Guardar
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .user-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 500px;
      padding: 16px 0;
    }

    .full-width {
      width: 100%;
    }

    .toggle-field {
      padding: 8px 0;
    }

    mat-dialog-actions button {
      margin-left: 8px;
    }

    mat-spinner {
      display: inline-block;
      margin: 0;
    }
  `]
})
export class UserDialogComponent {
  // Dependencias para formularios, red y dialogo
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<UserDialogComponent>);
  private authService = inject(AuthService);

  // Flags de estado y datos auxiliares
  isEditMode = false;
  saving = signal(false);
  clients = signal<any[]>([]);
  areas = signal<any[]>([]);
  showClientSelect = signal(false);
  showAreaSelect = signal(false);

  userForm: FormGroup;
  private API_URL = `${environment.apiUrl}/auth`;
  private CLIENTS_URL = `/api/clients`;
  private AREAS_URL = `/api/areas`;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
    console.log('[UserDialog] Constructor - Datos recibidos:', this.data);
    // Define modo edicion si viene _id y arma el formulario
    this.isEditMode = !!data?._id;
    
    this.userForm = this.fb.group({
      firstName: [data?.firstName || '', Validators.required],
      lastName: [data?.lastName || '', Validators.required],
      email: [data?.email || '', [Validators.required, Validators.email]],
      password: ['', this.isEditMode ? [] : [Validators.required, Validators.minLength(8)]],
      role: [data?.role || 'VIEWER', Validators.required],
      clientId: [data?.clientId || null],
      areaIds: [data?.areaIds || []]
    });

    // Determine if we should show client select
    const currentUser = this.authService.currentUser();
    console.log('[UserDialog] Constructor - Usuario actual:', currentUser);
    const canManageClients = ['OWNER', 'PLATFORM_ADMIN'].includes(currentUser?.role as string);
    this.showClientSelect.set(canManageClients);
    console.log(`[UserDialog] Constructor - Puede gestionar clientes: ${canManageClients}`);

    if (canManageClients) {
      this.loadClients();
    } else if (currentUser?.clientId) {
      console.log(`[UserDialog] Constructor - Forzando clientId del usuario actual: ${currentUser.clientId}`);
      this.userForm.patchValue({ clientId: currentUser.clientId });
    }

    // Listen to clientId changes to reload areas
    this.userForm.get('clientId')?.valueChanges.subscribe(clientId => {
      console.log(`[UserDialog] clientId del formulario cambió a: ${clientId}`);
      if (clientId) {
        this.loadAreas(clientId);
      } else {
        console.log('[UserDialog] clientId es nulo, limpiando áreas.');
        this.areas.set([]);
      }
    });

    // Mostrar selector de tenants según el rol
    this.userForm.get('role')?.valueChanges.subscribe(role => {
      console.log(`[UserDialog] Rol del formulario cambió a: ${role}`);
      const needsAreas = ['AREA_ADMIN', 'ANALYST', 'VIEWER'].includes(role);
      
      this.showAreaSelect.set(needsAreas);
      
      // Si el rol necesita tenants, cargarlos automáticamente
      if (needsAreas) {
        const clientId = this.userForm.get('clientId')?.value || currentUser?.clientId;
        console.log(`[UserDialog] El rol necesita áreas. Intentando cargar áreas para clientId: ${clientId}`);
        if (clientId) {
          this.loadAreas(clientId);
        }
      } else {
        this.areas.set([]);
        this.userForm.patchValue({ areaIds: [] });
      }
    });

    // Inicializar la visibilidad del selector de áreas
    const currentRole = this.userForm.get('role')?.value;
    const needsAreasOnInit = ['AREA_ADMIN', 'ANALYST', 'VIEWER'].includes(currentRole);
    this.showAreaSelect.set(needsAreasOnInit);
    
    // Configurar validacion dinamica de Cliente
    this.userForm.get('role')?.valueChanges.subscribe(role => {
       const isGlobalRole = ['OWNER', 'PLATFORM_ADMIN'].includes(role);
       const clientControl = this.userForm.get('clientId');
       
       if (isGlobalRole) {
         clientControl?.clearValidators();
         clientControl?.updateValueAndValidity();
       } else {
         clientControl?.setValidators(Validators.required);
         clientControl?.updateValueAndValidity();
       }
    });

    // Cargar áreas si el rol las necesita
    if (needsAreasOnInit) {
      const initialClientId = this.userForm.get('clientId')?.value || currentUser?.clientId;
      console.log(`[UserDialog] Carga inicial de áreas. ClientId determinado: ${initialClientId}`);
      if (initialClientId) {
        this.loadAreas(initialClientId);
      }
    }
  }

  loadClients() {
    this.http.get<any[]>(this.CLIENTS_URL).subscribe({
      next: (clients) => {
        this.clients.set(clients);
      },
      error: (err) => {
        console.error('Error al cargar clientes:', err);
      }
    });
  }

  loadAreas(clientId?: string): void {
    console.log(`[UserDialog] loadAreas fue llamado con clientId: ${clientId}`);
    
    let url = `${this.AREAS_URL}?includeInactive=false`;
    if (clientId) {
      url += `&clientId=${clientId}`;
    }
    
    console.log('[UserDialog] Cargando áreas desde:', url);
      
    this.http.get<any[]>(url).subscribe({
      next: (areas) => {
        console.log('[UserDialog] Áreas cargadas:', areas);
        this.areas.set(areas);
      },
      error: (err) => {
        console.error('[UserDialog] Error al cargar áreas:', err);
        this.areas.set([]);
      }
    });
  }

  isClientRequired(): boolean {
    const role = this.userForm.get('role')?.value;
    return !['OWNER', 'PLATFORM_ADMIN'].includes(role);
  }

  onSave(): void {
    // Prepara payload segun modo (crear/editar) y lo persiste
    if (this.userForm.invalid) {
      return;
    }

    this.saving.set(true);
    
    // Preparar datos según el modo
    const userData: any = {
      firstName: this.userForm.value.firstName,
      lastName: this.userForm.value.lastName,
      role: this.userForm.value.role,
      clientId: this.userForm.value.clientId,
      areaIds: this.userForm.value.areaIds
    };

    // En modo creación, incluir email y password obligatorio
    if (!this.isEditMode) {
      userData.email = this.userForm.value.email;
      userData.password = this.userForm.value.password;
    }

    // En modo edición, incluir password solo si se cambió
    if (this.isEditMode && this.userForm.value.password) {
      userData.password = this.userForm.value.password;
    }

    const request = this.isEditMode
      ? this.http.patch(`${this.API_URL}/users/${this.data._id}`, userData)
      : this.http.post(`${this.API_URL}/register`, userData);

    request.subscribe({
      next: () => {
        this.snackBar.open(
          this.isEditMode ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente',
          'Cerrar',
          { duration: 3000 }
        );
        // Cierra con exito para refrescar listado
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Error al guardar usuario:', err);
        this.snackBar.open(
          err.error?.message || 'Error al guardar usuario',
          'Cerrar',
          { duration: 3000 }
        );
        this.saving.set(false);
      }
    });
  }

  onCancel(): void {
    // Cierre sin cambios
    this.dialogRef.close();
  }
}

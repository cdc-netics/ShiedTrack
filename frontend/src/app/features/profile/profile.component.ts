import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';

@Component({
  standalone: true,
  selector: 'app-profile',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="profile-page">
      <h1>Mi perfil</h1>
      <mat-card>
        <mat-card-content>
          <form [formGroup]="profileForm" class="grid" (ngSubmit)="save()">
            <mat-form-field appearance="outline">
              <mat-label>Nombre</mat-label>
              <input matInput formControlName="firstName" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Apellido</mat-label>
              <input matInput formControlName="lastName" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full">
              <mat-label>Icono/Avatar (URL)</mat-label>
              <input matInput formControlName="avatarUrl" placeholder="https://..." />
            </mat-form-field>

            <div class="full avatar-upload">
              <label class="upload-label">o subir imagen de avatar</label>
              <input type="file" accept="image/*" (change)="onAvatarFileSelected($event)" />
              <small>Formatos permitidos: imagenes. Maximo: 2MB.</small>
            </div>

            @if (profileForm.value.avatarUrl) {
              <div class="full avatar-preview-wrap">
                <img [src]="profileForm.value.avatarUrl || ''" alt="Vista previa del avatar" class="avatar-preview" />
              </div>
            }

            <h3 class="full">Cambio de contrasena</h3>

            <mat-form-field appearance="outline">
              <mat-label>Contrasena actual</mat-label>
              <input matInput type="password" formControlName="currentPassword" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Nueva contrasena</mat-label>
              <input matInput type="password" formControlName="newPassword" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full">
              <mat-label>Confirmar nueva contrasena</mat-label>
              <input matInput type="password" formControlName="confirmPassword" />
            </mat-form-field>

            <div class="actions full">
              <button mat-raised-button color="primary" type="submit">Guardar cambios</button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .profile-page { max-width: 900px; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
    .full { grid-column: 1 / -1; }
    .actions { display: flex; justify-content: flex-end; }
    .avatar-upload { display: flex; flex-direction: column; gap: 8px; }
    .upload-label { font-weight: 600; }
    .avatar-preview-wrap { display: flex; align-items: center; }
    .avatar-preview { width: 72px; height: 72px; border-radius: 50%; object-fit: cover; border: 1px solid #ddd; }
  `],
})
export class ProfileComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  profileForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    avatarUrl: [''],
    currentPassword: [''],
    newPassword: [''],
    confirmPassword: [''],
  });

  constructor() {
    const user = this.authService.currentUser();
    this.profileForm.patchValue({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      avatarUrl: user?.avatarUrl || '',
    });
  }

  save(): void {
    if (this.profileForm.invalid) return;
    const payload = { ...this.profileForm.value } as any;

    const wantsPasswordChange = !!payload.currentPassword || !!payload.newPassword || !!payload.confirmPassword;
    if (wantsPasswordChange) {
      if (!payload.currentPassword || !payload.newPassword) {
        this.snackBar.open('Para cambiar contrasena debes completar contrasena actual y nueva', 'Cerrar', { duration: 3500 });
        return;
      }
      if (payload.newPassword !== payload.confirmPassword) {
        this.snackBar.open('La confirmacion de contrasena no coincide', 'Cerrar', { duration: 3500 });
        return;
      }
    }

    if (!payload.currentPassword && !payload.newPassword) {
      delete payload.currentPassword;
      delete payload.newPassword;
    }
    delete payload.confirmPassword;

    this.authService.updateProfile(payload).subscribe({
      next: () => {
        this.snackBar.open('Perfil actualizado correctamente', 'Cerrar', { duration: 3000 });
        this.profileForm.patchValue({ currentPassword: '', newPassword: '', confirmPassword: '' });
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message || 'Error actualizando perfil', 'Cerrar', { duration: 3500 });
      },
    });
  }

  onAvatarFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.snackBar.open('El archivo debe ser una imagen (png, jpg, webp, etc.)', 'Cerrar', { duration: 3500 });
      input.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.snackBar.open('La imagen supera 2MB. Usa una imagen mas liviana.', 'Cerrar', { duration: 3500 });
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const value = typeof reader.result === 'string' ? reader.result : '';
      this.profileForm.patchValue({ avatarUrl: value });
    };
    reader.readAsDataURL(file);
  }
}

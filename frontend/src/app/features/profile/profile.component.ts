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

            <h3 class="full">Cambio de contraseña</h3>

            <mat-form-field appearance="outline">
              <mat-label>Contraseña actual</mat-label>
              <input matInput type="password" formControlName="currentPassword" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Nueva contraseña</mat-label>
              <input matInput type="password" formControlName="newPassword" />
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

    if (!payload.currentPassword && !payload.newPassword) {
      delete payload.currentPassword;
      delete payload.newPassword;
    }

    this.authService.updateProfile(payload).subscribe({
      next: () => {
        this.snackBar.open('Perfil actualizado correctamente', 'Cerrar', { duration: 3000 });
        this.profileForm.patchValue({ currentPassword: '', newPassword: '' });
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message || 'Error actualizando perfil', 'Cerrar', { duration: 3500 });
      },
    });
  }
}

import { Component, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface Area {
  _id: string;
  name: string;
  code: string;
}

interface UserAreaAssignment {
  _id: string;
  areaId: Area;
  isActive: boolean;
}

/**
 * Dialog para asignar áreas a un usuario
 * Solo OWNER puede usar este componente
 */
@Component({
  selector: 'app-assign-areas-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>security</mat-icon>
      Asignar Áreas a Usuario
    </h2>
    <mat-dialog-content>
      <div class="user-info">
        <p><strong>Usuario:</strong> {{ data.user.email }}</p>
        <p><strong>Nombre:</strong> {{ data.user.firstName }} {{ data.user.lastName }}</p>
        <p><strong>Rol:</strong> {{ data.user.role }}</p>
      </div>

      @if (loading()) {
        <div class="loading">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Cargando áreas...</p>
        </div>
      } @else {
        <mat-selection-list [(ngModel)]="selectedAreaIds">
          @for (area of availableAreas(); track area._id) {
            <mat-list-option [value]="area._id" [selected]="isAreaSelected(area._id)">
              <div class="area-item">
                <div class="area-info">
                  <strong>{{ area.name }}</strong>
                  <span class="area-code">{{ area.code }}</span>
                </div>
                @if (isAreaSelected(area._id)) {
                  <mat-icon class="assigned">check_circle</mat-icon>
                }
              </div>
            </mat-list-option>
          } @empty {
            <p class="no-areas">No hay áreas disponibles</p>
          }
        </mat-selection-list>

        <div class="help-text">
          <mat-icon>info</mat-icon>
          <p>Selecciona las áreas a las que el usuario tendrá acceso. Los usuarios sin áreas asignadas no podrán ver ningún dato.</p>
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button 
        mat-raised-button 
        color="primary" 
        (click)="onSave()" 
        [disabled]="loading() || saving()">
        @if (saving()) {
          <mat-spinner diameter="20"></mat-spinner>
        } @else {
          <mat-icon>save</mat-icon>
        }
        Guardar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: 500px;
      max-height: 600px;
    }

    .user-info {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .user-info p {
      margin: 4px 0;
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px;
      gap: 16px;
    }

    mat-selection-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .area-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      padding: 8px 0;
    }

    .area-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .area-code {
      font-size: 12px;
      color: #666;
    }

    .assigned {
      color: #4caf50;
    }

    .help-text {
      display: flex;
      gap: 8px;
      align-items: flex-start;
      padding: 16px;
      background: #e3f2fd;
      border-radius: 8px;
      margin-top: 16px;
    }

    .help-text mat-icon {
      color: #1976d2;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .help-text p {
      margin: 0;
      font-size: 13px;
      color: #555;
    }

    .no-areas {
      text-align: center;
      padding: 32px;
      color: #999;
    }

    mat-dialog-actions button mat-spinner {
      display: inline-block;
      margin-right: 8px;
    }
  `]
})
export class AssignAreasDialogComponent implements OnInit {
  // Dependencias inyectadas manualmente para facilitar testing
  private http: HttpClient;
  private snackBar: MatSnackBar;

  // Estado de carga y seleccion de areas
  loading = signal<boolean>(true);
  saving = signal<boolean>(false);
  availableAreas = signal<Area[]>([]);
  currentAssignments = signal<UserAreaAssignment[]>([]);
  selectedAreaIds: string[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { user: any },
    private dialogRef: MatDialogRef<AssignAreasDialogComponent>,
    http: HttpClient,
    snackBar: MatSnackBar
  ) {
    this.http = http;
    this.snackBar = snackBar;
  }

  ngOnInit(): void {
    // Carga inicial de areas y asignaciones
    this.loadData();
  }

  async loadData(): Promise<void> {
    // Trae catalogo de areas y asignaciones actuales del usuario
    this.loading.set(true);
    try {
      // Cargar todas las áreas disponibles
      const areas = await this.http.get<Area[]>('/api/areas').toPromise();
      this.availableAreas.set(areas || []);

      // Cargar áreas ya asignadas al usuario
      const assignments = await this.http.get<UserAreaAssignment[]>(
        `/api/auth/users/${this.data.user._id}/areas`
      ).toPromise();
      this.currentAssignments.set(assignments || []);

      // Pre-seleccionar las áreas ya asignadas
      this.selectedAreaIds = assignments
        ?.filter((a: any) => a.isActive)
        .map((a: any) => a.areaId._id) || [];

    } catch (error) {
      console.error('Error cargando datos:', error);
      this.snackBar.open('Error al cargar las áreas', 'Cerrar', { duration: 3000 });
    } finally {
      this.loading.set(false);
    }
  }

  isAreaSelected(areaId: string): boolean {
    // Helper para marcar seleccion en el template
    return this.selectedAreaIds.includes(areaId);
  }

  async onSave(): Promise<void> {
    // Guarda asignaciones en bloque reemplazando las anteriores
    this.saving.set(true);
    try {
      // Enviar todas las áreas seleccionadas (reemplaza las anteriores)
      await this.http.post(
        `/api/auth/users/${this.data.user._id}/areas/bulk`,
        { areaIds: this.selectedAreaIds }
      ).toPromise();

      this.snackBar.open('Áreas asignadas correctamente', 'Cerrar', { duration: 3000 });
      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error asignando áreas:', error);
      this.snackBar.open('Error al asignar áreas', 'Cerrar', { duration: 3000 });
    } finally {
      this.saving.set(false);
    }
  }

  onCancel(): void {
    // Cierre sin cambios
    this.dialogRef.close(false);
  }
}

import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';

interface Backup {
  filename: string;
  size: number;
  created: Date;
  sizeMB: string;
}

interface BackupStats {
  totalBackups: number;
  totalSize: number;
  totalSizeMB: string;
  oldestBackup: Date | null;
  latestBackup: Date | null;
  nextScheduledBackup: string;
}

@Component({
    selector: 'app-backup-manager',
    imports: [
        CommonModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatProgressBarModule,
        MatTooltipModule,
        MatDialogModule,
        MatSnackBarModule
    ],
    template: `
    <div class="backup-container">
      <h2>
        <mat-icon>backup</mat-icon>
        Gestión de Backups del Sistema
      </h2>

      <!-- Estadísticas -->
      @if (stats()) {
        <mat-card class="stats-card">
          <mat-card-content>
            <div class="stats-grid">
              <div class="stat-item">
                <mat-icon color="primary">storage</mat-icon>
                <div>
                  <div class="stat-value">{{ stats()!.totalBackups }}</div>
                  <div class="stat-label">Backups Totales</div>
                </div>
              </div>
              <div class="stat-item">
                <mat-icon color="accent">folder</mat-icon>
                <div>
                  <div class="stat-value">{{ stats()!.totalSizeMB }}</div>
                  <div class="stat-label">Espacio Utilizado</div>
                </div>
              </div>
              <div class="stat-item">
                <mat-icon color="warn">schedule</mat-icon>
                <div>
                  <div class="stat-value">{{ stats()!.nextScheduledBackup }}</div>
                  <div class="stat-label">Próximo Backup Automático</div>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      }

      <!-- Acciones -->
      <div class="actions">
        <button mat-raised-button color="primary" (click)="createBackup()" [disabled]="creating()">
          <mat-icon>add_circle</mat-icon>
          {{ creating() ? 'Creando Backup...' : 'Crear Backup Manual' }}
        </button>
        <button mat-raised-button (click)="loadBackups()">
          <mat-icon>refresh</mat-icon>
          Actualizar Lista
        </button>
      </div>

      <!-- Lista de Backups -->
      <mat-card>
        <mat-card-content>
          <h3>Backups Disponibles</h3>
          @if (loading()) {
            <mat-progress-bar mode="indeterminate"></mat-progress-bar>
          }
          
          @if (!loading() && backups().length === 0) {
            <p class="no-data">No hay backups disponibles</p>
          }

          @if (backups().length > 0) {
            <div class="backups-list">
              @for (backup of backups(); track backup.filename) {
                <mat-card class="backup-item">
                  <div class="backup-info">
                    <div>
                      <mat-icon>description</mat-icon>
                      <strong>{{ backup.filename }}</strong>
                    </div>
                    <div class="backup-meta">
                      <span>{{ backup.sizeMB }}</span>
                      <span>{{ formatDate(backup.created) }}</span>
                    </div>
                  </div>
                  <div class="backup-actions">
                    <button mat-icon-button color="primary" (click)="downloadBackup(backup.filename)" matTooltip="Descargar">
                      <mat-icon>download</mat-icon>
                    </button>
                    <button mat-icon-button color="accent" (click)="confirmRestore(backup.filename)" matTooltip="Restaurar">
                      <mat-icon>restore</mat-icon>
                    </button>
                    <button mat-icon-button color="warn" (click)="confirmDelete(backup.filename)" matTooltip="Eliminar">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </mat-card>
              }
            </div>
          }
        </mat-card-content>
      </mat-card>

      <!-- Información -->
      <mat-card class="info-card">
        <mat-card-content>
          <h3><mat-icon>info</mat-icon> Información Importante</h3>
          <ul>
            <li><strong>Backups Automáticos:</strong> El sistema crea backups automáticos todos los días a las 2:00 AM</li>
            <li><strong>Retención:</strong> Se mantienen los últimos 30 backups automáticamente</li>
            <li><strong>Restauración:</strong> CUIDADO - La restauración sobrescribirá TODA la base de datos actual</li>
            <li><strong>Descarga:</strong> Puedes descargar los backups para almacenamiento externo</li>
          </ul>
        </mat-card-content>
      </mat-card>
    </div>
  `,
    styles: [`
    .backup-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    h2 {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 20px;
    }

    .stats-card {
      margin-bottom: 20px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 15px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #1976d2;
    }

    .stat-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
    }

    .actions {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .backups-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .backup-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
    }

    .backup-info {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .backup-info > div:first-child {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .backup-meta {
      display: flex;
      gap: 20px;
      font-size: 12px;
      color: #666;
    }

    .backup-actions {
      display: flex;
      gap: 5px;
    }

    .no-data {
      text-align: center;
      padding: 40px;
      color: #999;
    }

    .info-card {
      margin-top: 20px;
      background: #e3f2fd;
    }

    .info-card h3 {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }

    .info-card ul {
      margin: 0;
      padding-left: 20px;
    }

    .info-card li {
      margin-bottom: 8px;
    }
  `]
})
export class BackupManagerComponent implements OnInit {
  backups = signal<Backup[]>([]);
  stats = signal<BackupStats | null>(null);
  loading = signal(false);
  creating = signal(false);

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadBackups();
    this.loadStats();
  }

  async loadBackups(): Promise<void> {
    this.loading.set(true);
    try {
      const backups = await firstValueFrom(this.http.get<Backup[]>('/api/backup/list'));
      this.backups.set(backups);
    } catch (error: any) {
      this.snackBar.open(error.error?.message || 'Error cargando backups', 'Cerrar', { duration: 3000 });
    } finally {
      this.loading.set(false);
    }
  }

  async loadStats(): Promise<void> {
    try {
      const stats = await firstValueFrom(this.http.get<BackupStats>('/api/backup/stats'));
      this.stats.set(stats);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  }

  async createBackup(): Promise<void> {
    this.creating.set(true);
    try {
      await firstValueFrom(this.http.post('/api/backup/create', {}));
      this.snackBar.open('✅ Backup creado exitosamente', 'Cerrar', { duration: 3000 });
      this.loadBackups();
      this.loadStats();
    } catch (error: any) {
      this.snackBar.open(error.error?.message || 'Error creando backup', 'Cerrar', { duration: 5000 });
    } finally {
      this.creating.set(false);
    }
  }

  downloadBackup(filename: string): void {
    const url = `/api/backup/download/${filename}`;
    window.open(url, '_blank');
    this.snackBar.open('Descarga iniciada', 'Cerrar', { duration: 2000 });
  }

  confirmRestore(filename: string): void {
    const confirmed = confirm(
      `⚠️ ADVERTENCIA: Esta acción sobrescribirá TODA la base de datos actual con el backup:\n\n${filename}\n\n¿Estás seguro de continuar?`
    );
    if (confirmed) {
      const doubleConfirm = confirm(
        '⚠️ ÚLTIMA CONFIRMACIÓN: Esta operación NO se puede deshacer. ¿Proceder con la restauración?'
      );
      if (doubleConfirm) {
        this.restoreBackup(filename);
      }
    }
  }

  async restoreBackup(filename: string): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`/api/backup/restore/${filename}`, {}));
      this.snackBar.open('✅ Backup restaurado exitosamente. Recargando aplicación...', 'Cerrar', { duration: 3000 });
      setTimeout(() => window.location.reload(), 3000);
    } catch (error: any) {
      this.snackBar.open(error.error?.message || 'Error restaurando backup', 'Cerrar', { duration: 5000 });
    }
  }

  confirmDelete(filename: string): void {
    const confirmed = confirm(`¿Eliminar el backup: ${filename}?`);
    if (confirmed) {
      this.deleteBackup(filename);
    }
  }

  async deleteBackup(filename: string): Promise<void> {
    try {
      await firstValueFrom(this.http.delete(`/api/backup/${filename}`));
      this.snackBar.open('Backup eliminado', 'Cerrar', { duration: 2000 });
      this.loadBackups();
      this.loadStats();
    } catch (error: any) {
      this.snackBar.open(error.error?.message || 'Error eliminando backup', 'Cerrar', { duration: 3000 });
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

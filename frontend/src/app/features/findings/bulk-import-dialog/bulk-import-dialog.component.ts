import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { environment } from '../../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-bulk-import-dialog',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatChipsModule,
    MatDividerModule,
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon style="vertical-align:middle;margin-right:8px;color:#1976d2">upload_file</mat-icon>
      Importar hallazgos desde CSV / Excel
    </h2>

    <mat-dialog-content style="min-width:520px;max-width:680px">

      <!-- Paso 1: subir archivo -->
      @if (!result()) {
        <p style="color:#555;margin-bottom:8px;font-size:13px">
          Sube tu archivo CSV (separado por <code>;</code>) o Excel (.xlsx).
          El cliente se resuelve desde la columna <strong>Cliente</strong> y se crea automáticamente si no existe.
        </p>
        <div style="margin-bottom:16px">
          <button mat-stroked-button type="button" style="font-size:12px" (click)="downloadTemplate()">
            <mat-icon style="font-size:16px;width:16px;height:16px;margin-right:4px">download</mat-icon>
            Descargar plantilla CSV
          </button>
        </div>

        <mat-form-field appearance="outline" style="width:100%;margin-bottom:4px">
          <mat-label>Nombre del proyecto / engagement</mat-label>
          <input matInput [(ngModel)]="projectName" [disabled]="importing()"
                 placeholder="Ej: Cibervigilancia Q3 2025">
          <mat-hint>Si se omite se usará "Importación CSV". Se crea si no existe.</mat-hint>
        </mat-form-field>

        <!-- Zona drag & drop -->
        <div class="drop-zone"
             [class.drop-zone--active]="dragOver()"
             [class.drop-zone--selected]="!!selectedFile()"
             (dragover)="onDragOver($event)"
             (dragleave)="dragOver.set(false)"
             (drop)="onDrop($event)"
             (click)="fileInput.click()">
          @if (selectedFile()) {
            <mat-icon style="font-size:40px;width:40px;height:40px;color:#1976d2">description</mat-icon>
            <p style="margin:8px 0 4px;font-weight:500">{{ selectedFile()!.name }}</p>
            <small style="color:#666">{{ (selectedFile()!.size / 1024).toFixed(1) }} KB</small>
          } @else {
            <mat-icon style="font-size:48px;width:48px;height:48px;color:#bbb">cloud_upload</mat-icon>
            <p style="margin:8px 0 4px;color:#666">Arrastra tu archivo aquí o haz clic para seleccionar</p>
            <small style="color:#999">CSV (separado por ;) o Excel .xlsx</small>
          }
          <input #fileInput type="file" accept=".csv,.xlsx,.xls" style="display:none"
                 (change)="onFileSelected($event)">
        </div>

        @if (importing()) {
          <mat-progress-bar mode="indeterminate" style="margin-top:12px"></mat-progress-bar>
          <p style="text-align:center;color:#666;font-size:13px;margin-top:8px">
            Importando hallazgos... esto puede tomar unos segundos.
          </p>
        }
      }

      <!-- Resultado -->
      @if (result()) {
        <div class="result-summary">
          <div class="result-stat result-stat--ok">
            <mat-icon>check_circle</mat-icon>
            <span class="result-stat__value">{{ result()!.creados }}</span>
            <span class="result-stat__label">Creados</span>
          </div>
          <div class="result-stat result-stat--err">
            <mat-icon>error</mat-icon>
            <span class="result-stat__value">{{ result()!.fallidos }}</span>
            <span class="result-stat__label">Fallidos</span>
          </div>
        </div>

        @if (result()!.errores.length > 0) {
          <mat-divider style="margin:12px 0"></mat-divider>
          <p style="font-weight:500;margin-bottom:8px;color:#c62828">
            <mat-icon style="vertical-align:middle;font-size:18px">warning</mat-icon>
            Errores por fila:
          </p>
          <div class="error-list">
            @for (e of result()!.errores; track e.fila) {
              <div class="error-item">
                <mat-chip style="background:#fce4ec;color:#c62828;font-size:11px">Fila {{ e.fila }}</mat-chip>
                <span style="font-size:12px;margin-left:8px;color:#555">{{ e.detalle }}</span>
              </div>
            }
          </div>
        }
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      @if (!result()) {
        <button mat-button mat-dialog-close [disabled]="importing()">Cancelar</button>
        <button mat-raised-button color="primary"
                [disabled]="!selectedFile() || importing()"
                (click)="doImport()">
          <mat-icon>upload</mat-icon>
          Importar
        </button>
      } @else {
        <button mat-raised-button color="primary" (click)="dialogRef.close(result()!.creados > 0)">
          <mat-icon>done</mat-icon>
          {{ result()!.creados > 0 ? 'Ver hallazgos' : 'Cerrar' }}
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: [`
    .drop-zone {
      border: 2px dashed #bdbdbd;
      border-radius: 8px;
      padding: 32px 16px;
      text-align: center;
      cursor: pointer;
      transition: border-color .2s, background .2s;
      margin-top: 8px;
    }
    .drop-zone:hover, .drop-zone--active {
      border-color: #1976d2;
      background: #e3f2fd;
    }
    .drop-zone--selected {
      border-color: #1976d2;
      background: #f0f7ff;
    }
    .result-summary {
      display: flex;
      gap: 24px;
      justify-content: center;
      margin: 16px 0;
    }
    .result-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .result-stat mat-icon { font-size: 36px; width: 36px; height: 36px; }
    .result-stat__value { font-size: 28px; font-weight: 700; }
    .result-stat__label { font-size: 12px; color: #666; }
    .result-stat--ok mat-icon, .result-stat--ok .result-stat__value { color: #2e7d32; }
    .result-stat--err mat-icon, .result-stat--err .result-stat__value { color: #c62828; }
    .error-list { max-height: 200px; overflow-y: auto; }
    .error-item { display: flex; align-items: center; padding: 4px 0; }
  `]
})
export class BulkImportDialogComponent {
  dialogRef = inject(MatDialogRef<BulkImportDialogComponent>);
  private http = inject(HttpClient);

  projectName = '';
  selectedFile = signal<File | null>(null);
  dragOver = signal(false);
  importing = signal(false);
  result = signal<{ creados: number; fallidos: number; errores: { fila: number; detalle: string }[] } | null>(null);

  onDragOver(e: DragEvent) {
    e.preventDefault();
    this.dragOver.set(true);
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.dragOver.set(false);
    const file = e.dataTransfer?.files[0];
    if (file) this.selectedFile.set(file);
  }

  onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.selectedFile.set(file);
  }

  downloadTemplate() {
    const headers = [
      'Cliente', 'Título', 'Descripción', 'CAT-COD-interno', 'Criticidad',
      'Categoria', 'Dominio asociado', 'Subdominio',
      'Impacto', 'Recomendación', 'Evidencia', 'Observaciones',
      'CVE/EUVD', 'cvss_score (si aplica)',
      'referencias(NIST, MITRE, ENISA, INCIBE)',
      'fuente_detectado', 'Metodo_de_busqueda',
      'fecha_hallazgo', 'Revisar en profundidad',
    ];
    const example = [
      'ACME Corp',
      'Inyección SQL en módulo de login',
      'El parámetro username no sanitiza la entrada y permite inyección SQL clásica.',
      'APP-001',
      'Alta',
      'Injection',
      'app.ejemplo.cl',
      'api.app.ejemplo.cl',
      'Acceso no autorizado a datos de usuarios',
      'Implementar consultas parametrizadas y validación de entrada.',
      'Captura de pantalla adjunta en evidencias.',
      'Verificado en entorno de staging.',
      'CVE-2023-12345',
      '8.1',
      'https://cwe.mitre.org/data/definitions/89.html',
      'Prueba manual',
      'OWASP ZAP',
      '2026-06-15',
      'No',
    ];
    const csvContent = [headers, example]
      .map(row => row.map(v => `"${v.replace(/"/g, '""')}"`).join(';'))
      .join('\r\n');
    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_hallazgos.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  doImport() {
    const file = this.selectedFile();
    if (!file) return;

    this.importing.set(true);
    const fd = new FormData();
    fd.append('file', file);

    const nameParam = this.projectName.trim()
      ? `?projectName=${encodeURIComponent(this.projectName.trim())}`
      : '';

    this.http.post<{ creados: number; fallidos: number; errores: any[] }>(
      `${environment.apiUrl}/findings/bulk-import${nameParam}`,
      fd,
    ).subscribe({
      next: (res) => {
        this.importing.set(false);
        this.result.set(res);
      },
      error: (err) => {
        this.importing.set(false);
        this.result.set({
          creados: 0,
          fallidos: 1,
          errores: [{ fila: 0, detalle: err?.error?.message || 'Error al importar' }],
        });
      },
    });
  }
}

import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { MatTooltipModule } from '@angular/material/tooltip';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-finding-download-button',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule
  ],
  template: `
    <button mat-icon-button [matMenuTriggerFor]="downloadMenu" 
            matTooltip="Descargar hallazgo"
            [disabled]="isLoading">
      @if (isLoading) {
        <mat-icon>hourglass_empty</mat-icon>
      } @else {
        <mat-icon>download</mat-icon>
      }
    </button>

    <mat-menu #downloadMenu="matMenu">
      <button mat-menu-item (click)="downloadAsCSV()">
        <mat-icon>description</mat-icon>
        <span>CSV</span>
      </button>
      <button mat-menu-item (click)="downloadAsPDF()" [disabled]="!pdfAvailable">
        <mat-icon>picture_as_pdf</mat-icon>
        <span>PDF</span>
      </button>
      <button mat-menu-item (click)="downloadAsJSON()">
        <mat-icon>code</mat-icon>
        <span>JSON</span>
      </button>
      <mat-divider></mat-divider>
      <button mat-menu-item (click)="copyToClipboard()">
        <mat-icon>content_copy</mat-icon>
        <span>Copiar al portapapeles</span>
      </button>
    </mat-menu>
  `,
  styles: [`
    button {
      cursor: pointer;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class FindingDownloadButtonComponent {
  @Input() findingId!: string;
  @Input() findingData: any = null;
  @Output() downloadComplete = new EventEmitter<void>();

  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);

  isLoading = false;
  pdfAvailable = true;

  downloadAsCSV(): void {
    this.isLoading = true;
    this.http.get(`${environment.apiUrl}/findings/${this.findingId}/export/csv`, {
      responseType: 'blob'
    }).subscribe({
      next: (blob) => {
        this.downloadBlob(blob, `finding-${this.findingId}.csv`);
        this.snackBar.open('Hallazgo descargado en CSV', 'Cerrar', { duration: 2000 });
        this.downloadComplete.emit();
      },
      error: (err) => {
        console.error('Error descargando CSV:', err);
        this.snackBar.open('Error al descargar CSV', 'Cerrar', { duration: 3000 });
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  downloadAsPDF(): void {
    if (!this.pdfAvailable) return;
    
    this.isLoading = true;
    this.http.get(`${environment.apiUrl}/findings/${this.findingId}/export/pdf`, {
      responseType: 'blob'
    }).subscribe({
      next: (blob) => {
        this.downloadBlob(blob, `finding-${this.findingId}.pdf`);
        this.snackBar.open('Hallazgo descargado en PDF', 'Cerrar', { duration: 2000 });
        this.downloadComplete.emit();
      },
      error: (err) => {
        console.error('Error descargando PDF:', err);
        this.snackBar.open('Error al descargar PDF', 'Cerrar', { duration: 3000 });
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  downloadAsJSON(): void {
    this.isLoading = true;
    this.http.get(`${environment.apiUrl}/findings/${this.findingId}`).subscribe({
      next: (data: any) => {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        this.downloadBlob(blob, `finding-${this.findingId}.json`);
        this.snackBar.open('Hallazgo descargado en JSON', 'Cerrar', { duration: 2000 });
        this.downloadComplete.emit();
      },
      error: (err) => {
        console.error('Error descargando JSON:', err);
        this.snackBar.open('Error al descargar JSON', 'Cerrar', { duration: 3000 });
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  copyToClipboard(): void {
    if (this.findingData) {
      const text = JSON.stringify(this.findingData, null, 2);
      navigator.clipboard.writeText(text).then(() => {
        this.snackBar.open('Copiado al portapapeles', 'Cerrar', { duration: 2000 });
      }).catch(err => {
        console.error('Error copiando:', err);
        this.snackBar.open('Error al copiar', 'Cerrar', { duration: 3000 });
      });
    }
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

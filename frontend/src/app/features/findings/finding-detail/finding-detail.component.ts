import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { FindingService } from '../../../core/services/finding.service';
import { AuthService } from '../../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CloseFindingDialogComponent, CloseDialogResult } from '../close-finding-dialog/close-finding-dialog.component';
import { AddUpdateDialogComponent, AddUpdateDialogResult } from '../add-update-dialog/add-update-dialog.component';
import { environment } from '../../../../environments/environment';

interface Finding {
  _id: string;
  code: string;
  internal_code: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  projectId: any;
  retestIncluded: boolean;
  closeReason?: string;
  closedAt?: string;
  closedBy?: any;
  affectedAsset?: string;
  cweId?: string;
  cvss_score?: number;
  cve_id?: string;
  detection_source?: string;
  recommendation?: string;
  impact?: string;
  implications?: string;
  controls?: string[];
  references?: { label: string; url: string }[];
  tags: string[];
  assignedTo?: any;
  createdBy: any;
  createdAt: string;
  updatedAt: string;
}

interface Evidence {
  _id: string;
  findingId: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  uploadedBy: any;
  createdAt: string;
}

interface FindingUpdate {
  _id: string;
  findingId: string;
  type: string;
  content: string;
  createdBy: any;
  previousStatus?: string;
  newStatus?: string;
  evidenceIds?: string[];
  createdAt: string;
}

/**
 * Componente de Detalle de Hallazgo
 * Visualización completa y edición de hallazgos de seguridad
 */
@Component({
    selector: 'app-finding-detail',
    imports: [
        CommonModule,
        RouterLink,
        ReactiveFormsModule,
        FormsModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatChipsModule,
        MatDividerModule,
        MatTabsModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        MatDialogModule,
        MatTooltipModule,
        MatExpansionModule
    ],
    template: `
    <div class="finding-detail-container">
      @if (loading()) {
        <div class="loading-container">
          <mat-spinner></mat-spinner>
          <p>Cargando hallazgo...</p>
        </div>
      } @else if (finding()) {
        <mat-card class="header-card">
          <mat-card-header>
            <div class="header-content">
              <div class="title-section">
                <button mat-icon-button routerLink="/findings" matTooltip="Volver a hallazgos">
                  <mat-icon>arrow_back</mat-icon>
                </button>
                <div>
                  <h1>{{ finding()!.title }}</h1>
                  <div class="codes">
                    <mat-chip [class]="'severity-' + finding()!.severity.toLowerCase()">
                      {{ finding()!.code }}
                    </mat-chip>
                    <mat-chip [class]="'severity-' + finding()!.severity.toLowerCase()" class="internal-code-chip">
                      <mat-icon>tag</mat-icon>
                      {{ getSeverityLabel(finding()!.severity) }}
                    </mat-chip>
                  </div>
                </div>
              </div>
              <div class="actions">
                @if (!editMode()) {
                  <button mat-raised-button color="primary" (click)="toggleEditMode()">
                    <mat-icon>edit</mat-icon>
                    Editar
                  </button>
                  <button mat-raised-button color="accent" (click)="openAddUpdateDialog()">
                    <mat-icon>add_comment</mat-icon>
                    Agregar Seguimiento
                  </button>
                  @if (finding()!.status !== 'CLOSED' && canCloseFinding()) {
                    <button mat-raised-button color="warn" (click)="openCloseDialog()">
                      <mat-icon>lock</mat-icon>
                      Cerrar Hallazgo
                    </button>
                  }
                  <button mat-icon-button color="primary" matTooltip="Descargar Reporte PDF" (click)="downloadPdf()">
                    <mat-icon>picture_as_pdf</mat-icon>
                  </button>
                } @else {
                  <button mat-raised-button (click)="cancelEdit()">
                    <mat-icon>cancel</mat-icon>
                    Cancelar
                  </button>
                  <button mat-raised-button color="primary" (click)="saveFinding()" [disabled]="!findingForm.valid">
                    <mat-icon>save</mat-icon>
                    Guardar
                  </button>
                }
              </div>
            </div>
          </mat-card-header>
        </mat-card>

        <mat-tab-group class="content-tabs">
          <!-- TAB 1: Información General -->
          <mat-tab label="Información General">
            <div class="tab-content">
              <form [formGroup]="findingForm">
                <div class="form-grid">
                  <!-- Severidad y Estado -->
                  <mat-form-field appearance="outline">
                    <mat-label>Severidad</mat-label>
                    <mat-select formControlName="severity" [disabled]="!editMode()">
                      <mat-option value="CRITICAL">CRÍTICA</mat-option>
                      <mat-option value="HIGH">ALTA</mat-option>
                      <mat-option value="MEDIUM">MEDIA</mat-option>
                      <mat-option value="LOW">BAJA</mat-option>
                      <mat-option value="INFORMATIONAL">INFORMACIONAL</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Estado</mat-label>
                    <mat-select formControlName="status" [disabled]="!editMode()">
                      <mat-option value="OPEN">Abierto</mat-option>
                      <mat-option value="IN_PROGRESS">En Progreso</mat-option>
                      <mat-option value="RETEST_REQUIRED">Retest Requerido</mat-option>
                      <mat-option value="RETEST_PASSED">Retest Exitoso</mat-option>
                      <mat-option value="RETEST_FAILED">Retest Fallido</mat-option>
                      <mat-option value="CLOSED">Cerrado</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <!-- Título -->
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Título</mat-label>
                    <input matInput formControlName="title" [readonly]="!editMode()">
                  </mat-form-field>

                  <!-- Descripción -->
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Descripción</mat-label>
                    <textarea matInput formControlName="description" rows="6" [readonly]="!editMode()"></textarea>
                  </mat-form-field>

                  <!-- Activo Afectado -->
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Activo/Sistema Afectado</mat-label>
                    <input matInput formControlName="affectedAsset" [readonly]="!editMode()">
                  </mat-form-field>
                </div>
              </form>

              <!-- Información del Proyecto -->
              <mat-divider></mat-divider>
              <div class="info-section">
                <h3><mat-icon>folder</mat-icon> Proyecto</h3>
                @if (finding()!.projectId) {
                  <p><strong>Nombre:</strong> {{ finding()!.projectId.name || 'N/A' }}</p>
                  <p><strong>Código:</strong> {{ finding()!.projectId.code || 'N/A' }}</p>
                }
              </div>

              <!-- Información de Creación -->
              <mat-divider></mat-divider>
              <div class="info-section">
                <h3><mat-icon>info</mat-icon> Metadatos</h3>
                <p><strong>Creado por:</strong> {{ finding()!.createdBy?.email || 'Desconocido' }}</p>
                <p><strong>Fecha de creación:</strong> {{ finding()!.createdAt | date:'dd/MM/yyyy HH:mm' }}</p>
                <p><strong>Última modificación:</strong> {{ finding()!.updatedAt | date:'dd/MM/yyyy HH:mm' }}</p>
                @if (finding()!.assignedTo) {
                  <p><strong>Asignado a:</strong> {{ finding()!.assignedTo.email }}</p>
                }
              </div>

              <!-- Información de Cierre -->
              @if (finding()!.status === 'CLOSED' && finding()!.closedAt) {
                <mat-divider></mat-divider>
                <div class="info-section closed-info">
                  <h3><mat-icon>lock</mat-icon> Información de Cierre</h3>
                  <p><strong>Estado:</strong> <mat-chip class="closed-chip">CERRADO</mat-chip></p>
                  <p><strong>Motivo:</strong> {{ getCloseReasonLabel(finding()!.closeReason!) }}</p>
                  <p><strong>Cerrado por:</strong> {{ finding()!.closedBy?.email || 'Desconocido' }}</p>
                  <p><strong>Fecha de cierre:</strong> {{ finding()!.closedAt | date:'dd/MM/yyyy HH:mm' }}</p>
                </div>
              }
              
              <!-- Panel de Etiquetas -->
              <mat-divider></mat-divider>
              <mat-expansion-panel class="tags-panel">
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    <mat-icon>label</mat-icon>
                    Etiquetas ({{ tags().length }})
                  </mat-panel-title>
                </mat-expansion-panel-header>
                <div class="tags-content">
                  <mat-chip-listbox>
                    @for (tag of tags(); track tag) {
                      <mat-chip>
                        {{ tag }}
                        @if (editMode()) {
                          <button matChipRemove (click)="removeTag($index)">
                            <mat-icon>cancel</mat-icon>
                          </button>
                        }
                      </mat-chip>
                    }
                  </mat-chip-listbox>
                  @if (editMode()) {
                    <div class="add-tag">
                      <mat-form-field appearance="outline">
                        <mat-label>Nueva etiqueta</mat-label>
                        <input matInput [(ngModel)]="newTag" [ngModelOptions]="{standalone: true}" (keyup.enter)="addTag()">
                      </mat-form-field>
                      <button mat-raised-button color="primary" (click)="addTag()">
                        <mat-icon>add</mat-icon>
                        Agregar
                      </button>
                    </div>
                  }
                </div>
              </mat-expansion-panel>
            </div>
          </mat-tab>

          <!-- TAB 2: Información Técnica -->
          <mat-tab label="Información Técnica">
            <div class="tab-content">
              <form [formGroup]="findingForm">
                <div class="form-grid">
                  <!-- CVSS Score -->
                  <mat-form-field appearance="outline">
                    <mat-label>CVSS Score</mat-label>
                    <input matInput type="number" formControlName="cvss_score" [readonly]="!editMode()" 
                           min="0" max="10" step="0.1">
                    <mat-hint>Puntaje CVSS (0.0 - 10.0)</mat-hint>
                  </mat-form-field>

                  <!-- CVE ID -->
                  <mat-form-field appearance="outline">
                    <mat-label>CVE ID</mat-label>
                    <input matInput formControlName="cve_id" [readonly]="!editMode()"
                           placeholder="CVE-2024-12345">
                    <mat-hint>Formato: CVE-YYYY-NNNNN</mat-hint>
                  </mat-form-field>

                  <!-- Origen de Detección -->
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Origen de Detección (IP/URL)</mat-label>
                    <input matInput formControlName="detection_source" [readonly]="!editMode()"
                           placeholder="192.168.1.100 o https://example.com">
                  </mat-form-field>

                  <!-- Recomendación -->
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Recomendación de Remediación</mat-label>
                    <textarea matInput formControlName="recommendation" rows="4" [readonly]="!editMode()"
                              placeholder="Describe las acciones recomendadas para remediar este hallazgo..."></textarea>
                  </mat-form-field>

                  <!-- Impacto -->
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Impacto</mat-label>
                    <textarea matInput formControlName="impact" rows="3" [readonly]="!editMode()"
                              placeholder="Describe el impacto técnico y de negocio..."></textarea>
                  </mat-form-field>

                  <!-- Implicancias -->
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Implicancias</mat-label>
                    <textarea matInput formControlName="implications" rows="3" [readonly]="!editMode()"
                              placeholder="Describe las implicancias a corto y largo plazo..."></textarea>
                  </mat-form-field>
                </div>
              </form>

              <!-- Panel de Controles -->
              <mat-divider></mat-divider>
              <mat-expansion-panel class="controls-panel">
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    <mat-icon>security</mat-icon>
                    Controles Aplicables ({{ controls().length }})
                  </mat-panel-title>
                </mat-expansion-panel-header>
                <div class="controls-content">
                  <p class="hint-text">Controles de seguridad aplicables (CIS, NIST, OWASP, ISO 27001, etc.)</p>
                  <mat-chip-listbox>
                    @for (control of controls(); track control) {
                      <mat-chip>
                        {{ control }}
                        @if (editMode()) {
                          <button matChipRemove (click)="removeControl($index)">
                            <mat-icon>cancel</mat-icon>
                          </button>
                        }
                      </mat-chip>
                    }
                  </mat-chip-listbox>
                  @if (editMode()) {
                    <div class="add-control">
                      <mat-form-field appearance="outline">
                        <mat-label>Nuevo control</mat-label>
                        <input matInput [(ngModel)]="newControl" [ngModelOptions]="{standalone: true}" 
                               (keyup.enter)="addControl()" placeholder="Ej: CIS 5.1, NIST AC-2">
                      </mat-form-field>
                      <button mat-raised-button color="primary" (click)="addControl()">
                        <mat-icon>add</mat-icon>
                        Agregar
                      </button>
                    </div>
                  }
                </div>
              </mat-expansion-panel>

              <!-- Panel de Referencias -->
              <mat-expansion-panel class="references-panel">
                <mat-expansion-panel-header>
                  <mat-panel-title>
                    <mat-icon>link</mat-icon>
                    Referencias Externas ({{ references().length }})
                  </mat-panel-title>
                </mat-expansion-panel-header>
                <div class="references-list">
                  @if (references().length > 0) {
                    @for (ref of references(); track $index) {
                      <div class="reference-item">
                        <a [href]="ref.url" target="_blank" rel="noopener">
                          <mat-icon>open_in_new</mat-icon>
                          {{ ref.label }}
                        </a>
                        @if (editMode()) {
                          <button mat-icon-button color="warn" (click)="removeReference($index)">
                            <mat-icon>delete</mat-icon>
                          </button>
                        }
                      </div>
                    }
                  } @else {
                    <p class="empty-message">No hay referencias agregadas</p>
                  }
                  @if (editMode()) {
                    <div class="add-reference">
                      <mat-form-field appearance="outline">
                        <mat-label>Título</mat-label>
                        <input matInput [(ngModel)]="newRefLabel" [ngModelOptions]="{standalone: true}">
                      </mat-form-field>
                      <mat-form-field appearance="outline">
                        <mat-label>URL</mat-label>
                        <input matInput [(ngModel)]="newRefUrl" [ngModelOptions]="{standalone: true}" type="url">
                      </mat-form-field>
                      <button mat-raised-button color="primary" (click)="addReference()">
                        <mat-icon>add</mat-icon>
                        Agregar
                      </button>
                    </div>
                  }
                </div>
              </mat-expansion-panel>
            </div>
          </mat-tab>

          <!-- TAB 3: Evidencias -->
          <mat-tab label="Evidencias">
            <div class="tab-content">
              <div class="evidences-section">
                <div class="section-header">
                  <h3><mat-icon>attach_file</mat-icon> Archivos de Evidencia</h3>
                  <button mat-raised-button color="primary" (click)="uploadEvidence()">
                    <mat-icon>upload</mat-icon>
                    Subir Evidencia
                  </button>
                </div>
                @if (loadingEvidences()) {
                  <mat-spinner></mat-spinner>
                } @else if (evidences().length > 0) {
                  <div class="evidences-list">
                    @for (evidence of evidences(); track evidence._id) {
                      <mat-card class="evidence-card">
                        <mat-card-content>
                          <div class="evidence-header">
                            <div class="evidence-info">
                              <mat-icon>{{ getFileIcon(evidence.mimetype) }}</mat-icon>
                              <div class="evidence-details">
                                <h4>{{ evidence.originalName }}</h4>
                                <p>{{ formatFileSize(evidence.size) }} • {{ evidence.createdAt | date:'dd/MM/yyyy HH:mm' }}</p>
                                <p class="uploader">Subido por: {{ evidence.uploadedBy?.email || 'Desconocido' }}</p>
                              </div>
                            </div>
                            <div class="evidence-actions">
                              @if (isTextFile(evidence.mimetype)) {
                                <button mat-icon-button color="accent" (click)="toggleTextPreview(evidence._id)" matTooltip="Ver contenido">
                                  <mat-icon>description</mat-icon>
                                </button>
                              }
                              @if (evidence.mimetype.includes('pdf')) {
                                <button mat-icon-button color="accent" (click)="viewEvidence(evidence)" matTooltip="Abrir PDF">
                                  <mat-icon>picture_as_pdf</mat-icon>
                                </button>
                              }
                              <button mat-icon-button color="primary" (click)="downloadEvidence(evidence)" matTooltip="Descargar">
                                <mat-icon>download</mat-icon>
                              </button>
                              <button mat-icon-button color="warn" (click)="deleteEvidence(evidence._id)" matTooltip="Eliminar">
                                <mat-icon>delete</mat-icon>
                              </button>
                            </div>
                          </div>
                          <!-- Preview de imagen -->
                          @if (evidence.mimetype.startsWith('image/')) {
                            <div class="image-preview">
                              @if (imageUrls[evidence._id]) {
                                <img [src]="imageUrls[evidence._id]" [alt]="evidence.originalName" (click)="viewEvidence(evidence)" />
                              } @else {
                                <div class="loading-image">
                                  <mat-icon>image</mat-icon>
                                  <span>Cargando...</span>
                                </div>
                              }
                            </div>
                          }
                          <!-- Preview de texto -->
                          @if (isTextFile(evidence.mimetype) && textPreviews[evidence._id]) {
                            <div class="text-preview">
                              <pre>{{ textPreviews[evidence._id] }}</pre>
                            </div>
                          }
                        </mat-card-content>
                      </mat-card>
                    }
                  </div>
                } @else {
                  <div class="empty-state">
                    <mat-icon>cloud_upload</mat-icon>
                    <p>No hay evidencias cargadas</p>
                    <button mat-raised-button color="primary" (click)="uploadEvidence()">
                      <mat-icon>upload</mat-icon>
                      Subir Primera Evidencia
                    </button>
                  </div>
                }
              </div>
            </div>
          </mat-tab>

          <!-- TAB 4: Seguimiento -->
          <mat-tab label="Seguimiento">
            <div class="tab-content">
              <div class="updates-section">
                <div class="section-header">
                  <h3><mat-icon>track_changes</mat-icon> Timeline de Seguimiento</h3>
                  <button mat-raised-button color="primary" (click)="openAddUpdateDialog()">
                    <mat-icon>add</mat-icon>
                    Agregar Seguimiento
                  </button>
                </div>
                @if (loadingUpdates()) {
                  <mat-spinner></mat-spinner>
                } @else if (updates().length > 0) {
                  <div class="timeline">
                    @for (update of updates(); track update._id) {
                      <div class="timeline-item">
                        <div class="timeline-marker" [class]="'marker-' + update.type.toLowerCase()"></div>
                        <mat-card class="timeline-card">
                          <mat-card-content>
                            <div class="update-header">
                              <div class="update-type">
                                <mat-chip [class]="'chip-' + update.type.toLowerCase()">
                                  @if (update.type === 'FOLLOWUP') {
                                    <mat-icon>track_changes</mat-icon>
                                    📋 Seguimiento
                                  } @else {
                                    <mat-icon>comment</mat-icon>
                                    💬 Comentario
                                  }
                                </mat-chip>
                              </div>
                              <span class="timestamp">{{ update.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                            </div>
                            <p class="user">👤 {{ update.createdBy?.email || 'Usuario' }}</p>
                            <div class="update-content">
                              {{ update.content }}
                            </div>
                            @if (update.evidenceIds && update.evidenceIds.length > 0) {
                              <div class="update-evidences">
                                <mat-icon>attach_file</mat-icon>
                                <span>{{ update.evidenceIds.length }} evidencia(s) adjunta(s)</span>
                              </div>
                            }
                          </mat-card-content>
                        </mat-card>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="empty-state">
                    <mat-icon>track_changes</mat-icon>
                    <p>No hay seguimientos registrados</p>
                    <button mat-raised-button color="primary" (click)="openAddUpdateDialog()">
                      <mat-icon>add</mat-icon>
                      Agregar Primer Seguimiento
                    </button>
                  </div>
                }
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      } @else {
        <mat-card class="error-card">
          <mat-card-content>
            <mat-icon color="warn">error</mat-icon>
            <h2>Hallazgo no encontrado</h2>
            <button mat-raised-button routerLink="/findings">
              <mat-icon>arrow_back</mat-icon>
              Volver a la lista
            </button>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
    styles: [`
    .finding-detail-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      gap: 16px;
    }

    .header-card {
      margin-bottom: 24px;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      gap: 16px;
    }

    .title-section {
      display: flex;
      align-items: center;
      gap: 16px;
      flex: 1;
    }

    .title-section h1 {
      margin: 0;
      font-size: 24px;
    }

    .codes {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }

    .actions {
      display: flex;
      gap: 8px;
    }

    .severity-critical { background-color: #d32f2f; color: white; }
    .severity-high { background-color: #f57c00; color: white; }
    .severity-medium { background-color: #fbc02d; color: black; }
    .severity-low { background-color: #388e3c; color: white; }
    .severity-informational { background-color: #1976d2; color: white; }

    .content-tabs {
      background: white;
      border-radius: 8px;
    }

    .tab-content {
      padding: 24px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .full-width {
      grid-column: span 2;
    }

    .info-section {
      padding: 16px 0;
    }

    .info-section h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      color: #1976d2;
    }

    .info-section p {
      margin: 8px 0;
    }

    .references-panel, .tags-panel, .controls-panel {
      margin-top: 16px;
    }

    .controls-content {
      padding: 16px;
    }

    .hint-text {
      color: #666;
      font-size: 13px;
      margin-bottom: 12px;
    }

    .add-control {
      display: flex;
      gap: 8px;
      margin-top: 16px;
      align-items: center;
    }

    .references-list {
      padding: 16px;
    }

    .reference-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px;
      border-bottom: 1px solid #e0e0e0;
    }

    .reference-item a {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #1976d2;
      text-decoration: none;
    }

    .reference-item a:hover {
      text-decoration: underline;
    }

    .add-reference {
      display: grid;
      grid-template-columns: 1fr 1fr auto;
      gap: 8px;
      margin-top: 16px;
      align-items: center;
    }

    .tags-content {
      padding: 16px;
    }

    .add-tag {
      display: flex;
      gap: 8px;
      margin-top: 16px;
      align-items: center;
    }

    .evidences-section {
      min-height: 300px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .section-header h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
    }

    .evidences-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }

    .evidence-card {
      border: 1px solid #e0e0e0;
    }

    .evidence-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .evidence-info {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .evidence-info mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #1976d2;
    }

    .evidence-details h4 {
      margin: 0 0 4px 0;
      font-size: 14px;
      font-weight: 500;
    }

    .evidence-details p {
      margin: 4px 0;
      font-size: 12px;
      color: #666;
    }

    .evidence-actions {
      display: flex;
      gap: 4px;
      flex-shrink: 0;
    }

    .image-preview {
      margin-top: 16px;
      border-radius: 4px;
      overflow: hidden;
      background: #f5f5f5;
      max-height: 400px;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .image-preview img {
      max-width: 100%;
      max-height: 400px;
      object-fit: contain;
      cursor: pointer;
      transition: transform 0.2s;
    }

    .image-preview img:hover {
      transform: scale(1.02);
    }

    .text-preview {
      margin-top: 16px;
      background: #f5f5f5;
      border-radius: 4px;
      padding: 12px;
      max-height: 300px;
      overflow-y: auto;
    }

    .text-preview pre {
      margin: 0;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      white-space: pre-wrap;
      word-wrap: break-word;
      color: #333;
    }

    .loading-image {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 40px;
      color: #999;
      font-size: 14px;
      background: #fafafa;
      border-radius: 4px;
    }

    .loading-image mat-spinner {
      margin-bottom: 8px;
    }

    .internal-code-chip {
      display: flex;
      align-items: center;
      gap: 4px;
      font-weight: 600 !important;
      border: 2px solid currentColor !important;
    }

    .internal-code-chip mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .uploader {
      font-style: italic;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      gap: 16px;
      color: #999;
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #ccc;
    }

    .history-section h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 24px;
    }

    .timeline {
      position: relative;
      padding-left: 40px;
    }

    .timeline::before {
      content: '';
      position: absolute;
      left: 15px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #e0e0e0;
    }

    .timeline-item {
      position: relative;
      margin-bottom: 24px;
    }

    .timeline-marker {
      position: absolute;
      left: -29px;
      top: 8px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #1976d2;
      border: 2px solid white;
      box-shadow: 0 0 0 2px #e0e0e0;
    }

    .timeline-card {
      border-left: 3px solid #1976d2;
    }

    .history-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .history-header strong {
      color: #1976d2;
    }

    .timestamp {
      font-size: 12px;
      color: #999;
    }

    .user {
      font-size: 13px;
      color: #666;
      margin: 4px 0;
    }

    .changes {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #f0f0f0;
    }

    .change-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 8px 0;
      font-size: 13px;
    }

    .old-value {
      color: #d32f2f;
      text-decoration: line-through;
    }

    .new-value {
      color: #388e3c;
      font-weight: 500;
    }

    .change-item mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #999;
    }

    .error-card {
      text-align: center;
      padding: 48px;
    }

    .error-card mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
    }

    .empty-message {
      text-align: center;
      color: #999;
      padding: 16px;
    }

    .closed-info {
      background: #f5f5f5;
      border-left: 4px solid #d32f2f;
      padding: 16px;
      border-radius: 4px;
    }

    .closed-info h3 {
      color: #d32f2f;
    }

    .closed-chip {
      background: #d32f2f !important;
      color: white !important;
      font-weight: 500;
    }

    .updates-section {
      padding: 16px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .section-header h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      font-size: 1.3rem;
    }

    .timeline {
      position: relative;
      padding-left: 40px;
    }

    .timeline::before {
      content: '';
      position: absolute;
      left: 15px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: linear-gradient(to bottom, #1976d2, #e0e0e0);
    }

    .timeline-item {
      position: relative;
      margin-bottom: 24px;
    }

    .timeline-marker {
      position: absolute;
      left: -33px;
      top: 8px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 3px solid #fff;
      box-shadow: 0 0 0 2px #1976d2;
    }

    .timeline-marker.marker-followup {
      box-shadow: 0 0 0 2px #2196f3;
      background: #2196f3;
    }

    .timeline-marker.marker-technical {
      box-shadow: 0 0 0 2px #9c27b0;
      background: #9c27b0;
    }

    .timeline-marker.marker-status_change {
      box-shadow: 0 0 0 2px #ff9800;
      background: #ff9800;
    }

    .timeline-marker.marker-comment {
      box-shadow: 0 0 0 2px #757575;
      background: #757575;
    }

    .timeline-card {
      margin-bottom: 16px;
    }

    .update-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .update-type mat-chip {
      display: flex;
      align-items: center;
      gap: 4px;
      font-weight: 500;
    }

    .chip-followup {
      background: #e3f2fd !important;
      color: #1976d2 !important;
    }

    .chip-technical {
      background: #f3e5f5 !important;
      color: #7b1fa2 !important;
    }

    .chip-status_change {
      background: #fff3e0 !important;
      color: #e65100 !important;
    }

    .chip-comment {
      background: #f5f5f5 !important;
      color: #424242 !important;
    }

    .timestamp {
      color: #757575;
      font-size: 0.9rem;
    }

    .user {
      color: #666;
      font-size: 0.9rem;
      margin: 4px 0;
    }

    .update-content {
      background: #fafafa;
      padding: 12px;
      border-radius: 4px;
      border-left: 3px solid #1976d2;
      white-space: pre-wrap;
      word-wrap: break-word;
      margin: 8px 0;
    }

    .update-evidences {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      padding: 8px 12px;
      background: #e3f2fd;
      border-radius: 4px;
      color: #1976d2;
      font-size: 0.9rem;
    }

    .update-evidences mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .status-change {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
    }

    .status-old {
      background: #ffebee !important;
      color: #c62828 !important;
    }

    .status-new {
      background: #e8f5e9 !important;
      color: #2e7d32 !important;
    }

    @media (max-width: 768px) {
      .finding-detail-container {
        padding: 16px;
      }

      .header-content {
        flex-direction: column;
        align-items: flex-start;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .full-width {
        grid-column: span 1;
      }

      .add-reference {
        grid-template-columns: 1fr;
      }

      .evidences-list {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class FindingDetailComponent implements OnInit {
  // Dependencias principales
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private findingService = inject(FindingService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private http = inject(HttpClient);

  // Estado de carga y datos principales
  loading = signal<boolean>(true);
  finding = signal<Finding | null>(null);
  editMode = signal<boolean>(false);
  loadingEvidences = signal<boolean>(false);
  evidences = signal<Evidence[]>([]);
  loadingUpdates = signal<boolean>(false);
  updates = signal<FindingUpdate[]>([]);
  textPreviews: { [key: string]: string } = {};
  imageUrls: { [key: string]: any } = {};

  // Manejo de etiquetas del hallazgo
  tags = signal<string[]>([]);
  newTag = '';

  // Manejo de controles (CIS, NIST, OWASP, etc.)
  controls = signal<string[]>([]);
  newControl = '';

  // Manejo de referencias
  references = signal<{ label: string; url: string }[]>([]);
  newRefLabel = '';
  newRefUrl = '';

  findingForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    severity: ['', Validators.required],
    status: ['', Validators.required],
    affectedAsset: [''],
    cweId: [''],
    cvss_score: [''],
    cve_id: [''],
    detection_source: [''],
    recommendation: [''],
    impact: [''],
    implications: ['']
  });

  ngOnInit(): void {
    // Carga el hallazgo y recursos asociados al entrar
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadFinding(id);
      this.loadEvidences(id);
      this.loadUpdates(id);
    } else {
      this.loading.set(false);
    }
  }

  loadFinding(id: string): void {
    // Trae el hallazgo y sincroniza formulario y tags
    this.loading.set(true);
    this.http.get<Finding>(`${environment.apiUrl}/findings/${id}`)
      .subscribe({
        next: (data) => {
          this.finding.set(data);
          this.tags.set(data.tags || []);
          this.controls.set(data.controls || []);
          this.references.set(data.references || []);
          this.findingForm.patchValue({
            title: data.title,
            description: data.description,
            severity: data.severity,
            status: data.status,
            affectedAsset: data.affectedAsset || '',
            cweId: data.cweId || '',
            cvss_score: data.cvss_score || '',
            cve_id: data?.cve_id || '',
            detection_source: data.detection_source || '',
            recommendation: data.recommendation || '',
            impact: data.impact || '',
            implications: data.implications || ''
          });
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error cargando hallazgo:', err);
          this.snackBar.open('Error al cargar el hallazgo', 'Cerrar', { duration: 3000 });
          this.loading.set(false);
        }
      });
  }

  loadEvidences(findingId: string): void {
    // Carga evidencias y prepara previews para imagenes
    console.log('🔍 Cargando evidencias para finding:', findingId);
    this.loadingEvidences.set(true);
    this.http.get<Evidence[]>(`${environment.apiUrl}/evidence/finding/${findingId}`)
      .subscribe({
        next: (data) => {
          console.log('✅ Evidencias cargadas:', data.length, 'archivo(s)', data);
          this.evidences.set(data);
          this.loadingEvidences.set(false);
          
          // Cargar automáticamente previews de imágenes
          data.forEach(evidence => {
            if (evidence.mimetype?.startsWith('image/')) {
              this.loadImagePreview(evidence._id);
            }
          });
        },
        error: (err) => {
          console.error('❌ Error cargando evidencias:', err);
          console.error('URL:', `${environment.apiUrl}/evidence/finding/${findingId}`);
          this.evidences.set([]);
          this.loadingEvidences.set(false);
        }
      });
  }

  loadHistory(findingId: string): void {
    // Deprecated - replaced by loadUpdates
    console.log('⚠️ loadHistory is deprecated, use loadUpdates instead');
  }

  loadUpdates(findingId: string): void {
    // Carga el timeline de seguimientos del hallazgo
    console.log('📝 Cargando seguimientos para finding:', findingId);
    this.loadingUpdates.set(true);
    this.http.get<FindingUpdate[]>(`${environment.apiUrl}/findings/${findingId}/timeline`)
      .subscribe({
        next: (data) => {
          console.log('✅ Seguimientos cargados:', data.length, 'entrada(s)', data);
          this.updates.set(data);
          this.loadingUpdates.set(false);
        },
        error: (err) => {
          console.error('❌ Error cargando seguimientos:', err);
          this.snackBar.open('Error al cargar los seguimientos', 'Cerrar', { duration: 3000 });
          this.loadingUpdates.set(false);
        }
      });
  }

  toggleEditMode(): void {
    // Activa modo edicion
    this.editMode.set(true);
  }

  cancelEdit(): void {
    // Cancela edicion y restaura valores originales
    this.editMode.set(false);
    const currentFinding = this.finding();
    if (currentFinding) {
      this.tags.set(currentFinding.tags || []);
      this.controls.set(currentFinding.controls || []);
      this.references.set(currentFinding.references || []);
      this.findingForm.patchValue({
        title: currentFinding.title,
        description: currentFinding.description,
        severity: currentFinding.severity,
        status: currentFinding.status,
        affectedAsset: currentFinding.affectedAsset || '',
        cweId: currentFinding.cweId || '',
        cvss_score: currentFinding.cvss_score || '',
        cve_id: currentFinding.cve_id || '',
        detection_source: currentFinding.detection_source || '',
        recommendation: currentFinding.recommendation || '',
        impact: currentFinding.impact || '',
        implications: currentFinding.implications || ''
      });
    }
  }

  saveFinding(): void {
    // Valida y guarda cambios del hallazgo
    if (!this.findingForm.valid || !this.finding()) return;

    const updateData = {
      title: this.findingForm.value.title,
      description: this.findingForm.value.description,
      severity: this.findingForm.value.severity,
      status: this.findingForm.value.status,
      affectedAsset: this.findingForm.value.affectedAsset || '',
      cweId: this.findingForm.value.cweId || '',
      cvss_score: this.findingForm.value.cvss_score || undefined,
      cve_id: this.findingForm.value.cve_id || '',
      detection_source: this.findingForm.value.detection_source || '',
      recommendation: this.findingForm.value.recommendation || '',
      impact: this.findingForm.value.impact || '',
      implications: this.findingForm.value.implications || '',
      tags: this.tags(),
      controls: this.controls(),
      references: this.references()
    };

    console.log('📤 Guardando hallazgo:', updateData);

    this.http.put(`${environment.apiUrl}/findings/${this.finding()!._id}`, updateData)
      .subscribe({
        next: (response) => {
          console.log('✅ Hallazgo actualizado:', response);
          this.snackBar.open('Hallazgo actualizado correctamente', 'Cerrar', { duration: 3000 });
          this.editMode.set(false);
          this.loadFinding(this.finding()!._id);
          this.loadUpdates(this.finding()!._id);
        },
        error: (err) => {
          console.error('❌ Error actualizando hallazgo:', err);
          console.error('Detalles del error:', err.error);
          this.snackBar.open(
            err.error?.message || 'Error al actualizar el hallazgo',
            'Cerrar',
            { duration: 5000 }
          );
        }
      });
  }

  addTag(): void {
    // Agrega una etiqueta si no existe
    if (this.newTag && !this.tags().includes(this.newTag)) {
      this.tags.update(tags => [...tags, this.newTag]);
      this.newTag = '';
    }
  }

  removeTag(index: number): void {
    // Remueve etiqueta por indice
    this.tags.update(tags => tags.filter((_, i) => i !== index));
  }

  addControl(): void {
    // Agrega un control si no existe
    if (this.newControl && !this.controls().includes(this.newControl)) {
      this.controls.update(controls => [...controls, this.newControl]);
      this.newControl = '';
    }
  }

  removeControl(index: number): void {
    // Remueve control por indice
    this.controls.update(controls => controls.filter((_, i) => i !== index));
  }

  addReference(): void {
    // Agrega una referencia si tiene label y URL
    if (this.newRefLabel && this.newRefUrl) {
      this.references.update(refs => [...refs, { label: this.newRefLabel, url: this.newRefUrl }]);
      this.newRefLabel = '';
      this.newRefUrl = '';
    }
  }

  removeReference(index: number): void {
    // Remueve referencia por indice
    this.references.update(refs => refs.filter((_, i) => i !== index));
  }

  async uploadEvidence(): Promise<void> {
    // Carga multiple de evidencias con subida secuencial
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.pdf,.log,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar,.7z,.doc,.docx,.xls,.xlsx,.json,.xml,.csv';
    
    input.onchange = async (e: any) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const findingId = this.finding()?._id;
      if (!findingId) {
        this.snackBar.open('Error: No se puede subir evidencias sin un hallazgo válido', 'Cerrar', { duration: 3000 });
        return;
      }

      let uploaded = 0;
      let errors = 0;
      const errorMessages: string[] = [];

      this.snackBar.open(`Subiendo ${files.length} archivo(s)...`, '', { duration: 2000 });

      // Subir archivos secuencialmente uno por uno
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        try {
          await firstValueFrom(
            this.http.post(`${environment.apiUrl}/evidence/upload?findingId=${findingId}`, formData)
          );
          uploaded++;
          console.log(`✅ Evidencia subida: ${file.name}`);
        } catch (err: any) {
          errors++;
          const errorMsg = err.error?.message || err.message || 'Error desconocido';
          console.error(`❌ Error subiendo ${file.name}:`, errorMsg, err);
          errorMessages.push(`${file.name}: ${errorMsg}`);
        }
      }

      // Mostrar resultado final
      if (errors === 0) {
        this.snackBar.open(
          `✅ ${uploaded} archivo(s) subido(s) correctamente`, 
          'Cerrar', 
          { duration: 3000 }
        );
      } else if (uploaded > 0) {
        this.snackBar.open(
          `⚠️ ${uploaded} subido(s), ${errors} fallido(s). Ver consola para detalles.`, 
          'Cerrar', 
          { duration: 5000 }
        );
        console.error('Errores de subida:', errorMessages);
      } else {
        this.snackBar.open(
          `❌ Error al subir archivos: ${errorMessages[0] || 'Error desconocido'}`, 
          'Cerrar', 
          { duration: 5000 }
        );
      }
      
      // Recargar lista de evidencias solo si se subió al menos uno
      if (uploaded > 0) {
        console.log('Recargando evidencias...');
        this.loadEvidences(findingId);
      }
    };
    
    input.click();
  }

  downloadEvidence(evidence: Evidence): void {
    // Descarga un archivo y crea un enlace temporal
    console.log('📥 Descargando evidencia:', evidence.originalName);
    
    this.http.get(`${environment.apiUrl}/evidence/${evidence._id}/download`, {
      responseType: 'blob',
      observe: 'response'
    }).subscribe({
      next: (response) => {
        const blob = response.body;
        if (blob) {
          // Crear un link temporal para descargar el archivo
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = evidence.originalName || evidence.filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          console.log('✅ Evidencia descargada:', evidence.originalName);
          this.snackBar.open('Archivo descargado correctamente', 'Cerrar', { duration: 2000 });
        }
      },
      error: (err) => {
        console.error('❌ Error descargando evidencia:', err);
        this.snackBar.open(
          err.error?.message || 'Error al descargar el archivo',
          'Cerrar',
          { duration: 3000 }
        );
      }
    });
  }

  viewEvidence(evidence: Evidence): void {
    // Visualiza el archivo en nueva pestana si el navegador lo permite
    console.log('👁️ Visualizando evidencia:', evidence.originalName);
    
    this.http.get(`${environment.apiUrl}/evidence/${evidence._id}/download`, {
      responseType: 'blob'
    }).subscribe({
      next: (blob) => {
        // Crear URL temporal del blob
        const url = window.URL.createObjectURL(blob);
        
        // Abrir en nueva ventana
        const newWindow = window.open(url, '_blank');
        
        if (!newWindow) {
          this.snackBar.open('No se pudo abrir la ventana. Verifica el bloqueador de popups', 'Cerrar', { duration: 3000 });
        }
        
        // Limpiar URL después de un tiempo
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 60000); // 1 minuto
      },
      error: (err) => {
        console.error('❌ Error visualizando evidencia:', err);
        this.snackBar.open(
          err.error?.message || 'Error al visualizar el archivo',
          'Cerrar',
          { duration: 3000 }
        );
      }
    });
  }

  deleteEvidence(id: string): void {
    // Eliminacion con confirmacion y recarga del listado
    if (confirm('¿Estás seguro de eliminar esta evidencia?')) {
      this.http.delete(`${environment.apiUrl}/evidence/${id}`)
        .subscribe({
          next: () => {
            this.snackBar.open('Evidencia eliminada', 'Cerrar', { duration: 3000 });
            this.loadEvidences(this.finding()!._id);
          },
          error: (err) => {
            console.error('Error eliminando evidencia:', err);
            this.snackBar.open('Error al eliminar evidencia', 'Cerrar', { duration: 3000 });
          }
        });
    }
  }

  getFileIcon(mimetype: string): string {
    // Asigna icono segun el tipo de archivo
    if (!mimetype) return 'insert_drive_file';
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.includes('pdf')) return 'picture_as_pdf';
    if (mimetype.includes('word') || mimetype.includes('document')) return 'description';
    if (mimetype.includes('sheet') || mimetype.includes('excel')) return 'table_chart';
    if (mimetype.includes('zip') || mimetype.includes('rar')) return 'archive';
    if (mimetype.includes('text') || mimetype.includes('json') || mimetype.includes('xml')) return 'code';
    return 'insert_drive_file';
  }

  getSeverityLabel(severity: string): string {
    // Etiqueta de severidad en mayusculas
    const labels: { [key: string]: string } = {
      'CRITICAL': 'CRÍTICO',
      'HIGH': 'ALTO',
      'MEDIUM': 'MEDIO',
      'LOW': 'BAJO',
      'INFO': 'INFO'
    };
    return labels[severity] || severity;
  }

  isTextFile(mimetype: string): boolean {
    // Determina si se puede previsualizar como texto
    if (!mimetype) return false;
    return mimetype.includes('text/') || 
           mimetype.includes('json') || 
           mimetype.includes('xml') ||
           mimetype.includes('javascript') ||
           mimetype.includes('html') ||
           mimetype.includes('css');
  }

  loadImagePreview(evidenceId: string): void {
    // Crea una URL temporal para previsualizar imagenes
    this.http.get(`${environment.apiUrl}/evidence/${evidenceId}/download`, {
      responseType: 'blob'
    }).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        this.imageUrls[evidenceId] = url;
      },
      error: (err) => {
        console.error('Error cargando preview:', err);
      }
    });
  }

  toggleTextPreview(evidenceId: string): void {
    // Alterna preview textual limitado a 1000 caracteres
    if (this.textPreviews[evidenceId]) {
      delete this.textPreviews[evidenceId];
      return;
    }

    this.http.get(`${environment.apiUrl}/evidence/${evidenceId}/download`, {
      responseType: 'text'
    }).subscribe({
      next: (content) => {
        // Limitar a 1000 caracteres
        this.textPreviews[evidenceId] = content.length > 1000 
          ? content.substring(0, 1000) + '\n\n... (contenido truncado, descarga el archivo para ver completo)'
          : content;
      },
      error: (err) => {
        console.error('Error cargando texto:', err);
        this.snackBar.open('Error al cargar el contenido', 'Cerrar', { duration: 3000 });
      }
    });
  }

  formatFileSize(bytes: number): string {
    // Formatea tamanos en bytes a unidades legibles
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  downloadPdf() {
    // Descargar reporte PDF del hallazgo
    // Asume que el backend expone /api/export/finding/:id/pdf
    const url = `${environment.apiUrl}/export/finding/${this.finding()!._id}/pdf`;
    window.open(url, '_blank');
  }

  /**
   * Verifica si el usuario puede cerrar hallazgos
   * Solo OWNER, PLATFORM_ADMIN, CLIENT_ADMIN, AREA_ADMIN y ANALYST pueden cerrar
   */
  canCloseFinding(): boolean {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return false;
    
    const allowedRoles = ['OWNER', 'PLATFORM_ADMIN', 'CLIENT_ADMIN', 'AREA_ADMIN', 'ANALYST'];
    return allowedRoles.includes(currentUser.role);
  }

  /**
   * Abre el diálogo de cierre de hallazgo
   */
  openCloseDialog(): void {
    const dialogRef = this.dialog.open(CloseFindingDialogComponent, {
      width: '600px',
      data: {
        findingId: this.finding()!._id,
        findingTitle: this.finding()!.title
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result: CloseDialogResult) => {
      if (result) {
        this.closeFinding(result);
      }
    });
  }

  /**
   * Cierra el hallazgo llamando al endpoint del backend
   */
  closeFinding(closeData: CloseDialogResult): void {
    const findingId = this.finding()!._id;
    
    this.http.post(`${environment.apiUrl}/findings/${findingId}/close`, closeData)
      .subscribe({
        next: (updatedFinding: any) => {
          this.snackBar.open('Hallazgo cerrado correctamente', 'Cerrar', { duration: 3000 });
          // Actualizar el finding con los nuevos datos
          this.finding.set(updatedFinding);
          // Recargar el finding completo
          this.loadFinding(findingId);
        },
        error: (err) => {
          console.error('Error cerrando hallazgo:', err);
          this.snackBar.open(
            err.error?.message || 'Error al cerrar el hallazgo',
            'Cerrar',
            { duration: 5000 }
          );
        }
      });
  }

  /**
   * Abre el diálogo para agregar un seguimiento
   */
  openAddUpdateDialog(): void {
    const dialogRef = this.dialog.open(AddUpdateDialogComponent, {
      width: '600px',
      data: {
        findingId: this.finding()!._id,
        findingTitle: this.finding()!.title
      }
    });

    dialogRef.afterClosed().subscribe((result: AddUpdateDialogResult) => {
      if (result) {
        this.createUpdate(result);
      }
    });
  }

  /**
   * Crea un nuevo seguimiento llamando al endpoint del backend
   */
  async createUpdate(updateData: AddUpdateDialogResult): Promise<void> {
    const findingId = this.finding()!._id;
    
    // Si hay archivos, subirlos primero
    let evidenceIds: string[] = [];
    if (updateData.files && updateData.files.length > 0) {
      console.log('📎 Subiendo', updateData.files.length, 'archivos...');
      
      for (const file of updateData.files) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          
          const response: any = await firstValueFrom(
            this.http.post(`${environment.apiUrl}/evidence/upload?findingId=${findingId}`, formData)
          );
          
          evidenceIds.push(response._id);
          console.log('✅ Archivo subido:', file.name);
        } catch (err) {
          console.error('❌ Error subiendo archivo:', file.name, err);
        }
      }
    }

    const payload = {
      findingId: findingId,
      type: updateData.type,
      content: updateData.content,
      evidenceIds: evidenceIds
    };

    console.log('📝 Creando seguimiento:', payload);

    this.http.post(`${environment.apiUrl}/findings/updates`, payload)
      .subscribe({
        next: (createdUpdate: any) => {
          console.log('✅ Seguimiento creado:', createdUpdate);
          
          const message = evidenceIds.length > 0 
            ? `Seguimiento agregado con ${evidenceIds.length} evidencia(s)`
            : 'Seguimiento agregado correctamente';
            
          this.snackBar.open(message, 'Cerrar', { duration: 3000 });
          
          // Recargar seguimientos y evidencias
          this.loadUpdates(findingId);
          if (evidenceIds.length > 0) {
            this.loadEvidences(findingId);
          }
        },
        error: (err) => {
          console.error('❌ Error creando seguimiento:', err);
          this.snackBar.open(
            err.error?.message || 'Error al agregar el seguimiento',
            'Cerrar',
            { duration: 5000 }
          );
        }
      });
  }

  /**
   * Obtiene la etiqueta legible del motivo de cierre
   */
  getCloseReasonLabel(reason: string): string {
    const labels: { [key: string]: string } = {
      'FIXED': 'Vulnerabilidad Corregida',
      'RISK_ACCEPTED': 'Riesgo Aceptado por el Cliente',
      'FALSE_POSITIVE': 'Falso Positivo',
      'OUT_OF_SCOPE': 'Fuera del Alcance',
      'DUPLICATE': 'Duplicado',
      'CONTRACT_ENDED': 'Contrato Finalizado'
    };
    return labels[reason] || reason;
  }
}

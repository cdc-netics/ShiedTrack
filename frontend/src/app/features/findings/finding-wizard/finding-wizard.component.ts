import { Component, inject, signal, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClient } from '@angular/common/http';
import { FindingService } from '../../../core/services/finding.service';
import { ProjectService } from '../../../core/services/project.service';
import { Observable, startWith, map, of } from 'rxjs';
import { environment } from '../../../../environments/environment';

interface Template {
  id: string | number;
  name: string;
  severity: string;
  description: string;
  recommendation?: string;
  cvssScore?: number;
  cweId?: string;
}

@Component({
  selector: 'app-finding-wizard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule
  ],
  template: `
    <div class="wizard-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>
            <mat-icon>add_circle</mat-icon>
            Nuevo Hallazgo - Wizard Profesional
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <mat-stepper [linear]="true" #stepper>
            <mat-step [stepControl]="basicForm">
              <ng-template matStepLabel>Información Básica</ng-template>
              <form [formGroup]="basicForm" class="wizard-form">
                
                <!-- BUSCADOR DE PLANTILLAS -->
                <div class="template-section">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>🎯 ¿Usar plantilla predefinida? (Ahorra 80% del tiempo)</mat-label>
                    <input matInput 
                           [matAutocomplete]="templateAuto"
                           [(ngModel)]="templateSearch"
                           (ngModelChange)="onTemplateSearch($event)"
                           [ngModelOptions]="{standalone: true}"
                           placeholder="Busca: XSS, SQLi, CSRF, etc...">
                    <mat-icon matSuffix>search</mat-icon>
                  </mat-form-field>
                  <mat-autocomplete #templateAuto="matAutocomplete" (optionSelected)="applyTemplate($event.option.value)">
                    @for (template of filteredTemplates(); track template.id) {
                      <mat-option [value]="template">
                        <div class="template-option">
                          <span class="template-name">{{ template.name }}</span>
                          <mat-chip [class]="'severity-' + template.severity.toLowerCase()">
                            {{ template.severity }}
                          </mat-chip>
                        </div>
                      </mat-option>
                    }
                  </mat-autocomplete>
                </div>

                <mat-divider class="section-divider"></mat-divider>

                <!-- GRID 2 COLUMNAS -->
                <div class="form-row">
                  <mat-form-field appearance="outline">
                    <mat-label>Cliente *</mat-label>
                    <input matInput 
                           formControlName="clientName"
                           [matAutocomplete]="clientAuto"
                           placeholder="Escribe o selecciona"
                           required>
                    <mat-icon matSuffix>business</mat-icon>
                    <mat-error>El cliente es requerido</mat-error>
                  </mat-form-field>
                  <mat-autocomplete #clientAuto="matAutocomplete" (optionSelected)="selectClient($event.option.value)">
                    @for (client of filteredClients(); track client._id) {
                      <mat-option [value]="client">
                        {{ client.name }}
                      </mat-option>
                    }
                    @if (showCreateClient()) {
                      <mat-option [value]="{ _id: 'new', name: basicForm.get('clientName')?.value }">
                        <mat-icon>add_circle</mat-icon>
                        Crear: "{{ basicForm.get('clientName')?.value }}"
                      </mat-option>
                    }
                  </mat-autocomplete>

                  <mat-form-field appearance="outline">
                    <mat-label>Proyecto *</mat-label>
                    <input matInput 
                           formControlName="projectName"
                           [matAutocomplete]="projectAuto"
                           placeholder="Escribe o selecciona"
                           required>
                    <mat-icon matSuffix>folder</mat-icon>
                    <mat-error>El proyecto es requerido</mat-error>
                  </mat-form-field>
                  <mat-autocomplete #projectAuto="matAutocomplete" 
                                   (optionSelected)="selectProject($event.option.value)"
                                   [displayWith]="displayProjectFn">
                    @for (project of filteredProjects(); track project._id) {
                      <mat-option [value]="project">
                        {{ project.name }}
                      </mat-option>
                    }
                    @if (showCreateProject()) {
                      <mat-option [value]="{ _id: 'new', name: basicForm.get('projectName')?.value }">
                        <mat-icon>add_circle</mat-icon>
                        Crear: "{{ basicForm.get('projectName')?.value }}"
                      </mat-option>
                    }
                  </mat-autocomplete>

                  <mat-form-field appearance="outline">
                    <mat-label>Origen de Detección</mat-label>
                    <mat-select formControlName="detectionSource" placeholder="Selecciona la arquitectura">
                      <mat-option value="WEB">WEB</mat-option>
                      <mat-option value="CLOUD">CLOUD</mat-option>
                      <mat-option value="API">API</mat-option>
                      <mat-option value="FTP">FTP</mat-option>
                      <mat-option value="ONPREM">ONPREM</mat-option>
                      <mat-option value="HYBRID">HYBRID</mat-option>
                      <mat-option value="OTHER">OTHER</mat-option>
                    </mat-select>
                  </mat-form-field>
                </div>

                <div class="form-row">
                  <mat-form-field appearance="outline">
                    <mat-label>Código (Auto-generado)</mat-label>
                    <input matInput formControlName="code" readonly>
                    <mat-icon matPrefix class="code-icon">lock</mat-icon>
                    <mat-hint>🤖 Irrepetible</mat-hint>
                  </mat-form-field>

                  <mat-form-field appearance="outline" [class.severity-border]="basicForm.get('severity')?.value">
                    <mat-label>Severidad *</mat-label>
                    <mat-select formControlName="severity" required>
                      <mat-option value="CRITICAL">🔴 Crítica</mat-option>
                      <mat-option value="HIGH">🟠 Alta</mat-option>
                      <mat-option value="MEDIUM">🟡 Media</mat-option>
                      <mat-option value="LOW">🔵 Baja</mat-option>
                      <mat-option value="INFO">⚪ Informativa</mat-option>
                    </mat-select>
                    <mat-error>La severidad es requerida</mat-error>
                  </mat-form-field>
                </div>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Título *</mat-label>
                  <input matInput formControlName="title" required>
                  <mat-error>El título es requerido</mat-error>
                </mat-form-field>

                <div class="rich-section">
                  <label>Descripción Técnica *</label>
                  <div class="toolbar">
                    <button type="button" mat-icon-button (click)="format('bold')" matTooltip="Negrita">
                      <mat-icon>format_bold</mat-icon>
                    </button>
                    <button type="button" mat-icon-button (click)="format('italic')" matTooltip="Cursiva">
                      <mat-icon>format_italic</mat-icon>
                    </button>
                    <button type="button" mat-icon-button (click)="format('insertUnorderedList')" matTooltip="Lista">
                      <mat-icon>format_list_bulleted</mat-icon>
                    </button>
                  </div>
                  <div #editor 
                       contenteditable="true" 
                       class="editor"
                       (input)="onDescriptionChange($event)"
                       [innerHTML]="basicForm.get('description')?.value || ''"></div>
                  @if (basicForm.get('description')?.errors && basicForm.get('description')?.touched) {
                    <small class="error">La descripción es requerida</small>
                  }
                </div>

                <div class="actions">
                  <button mat-button routerLink="/findings">Cancelar</button>
                  <button mat-raised-button color="primary" matStepperNext [disabled]="!basicForm.valid">
                    Siguiente <mat-icon>arrow_forward</mat-icon>
                  </button>
                </div>
              </form>
            </mat-step>

            <mat-step [stepControl]="technicalForm">
              <ng-template matStepLabel>Información Técnica</ng-template>
              <form [formGroup]="technicalForm" class="wizard-form">
                <div class="form-row">
                  <mat-form-field appearance="outline">
                    <mat-label>CVSS Score</mat-label>
                    <input matInput type="number" formControlName="cvssScore" min="0" max="10" step="0.1">
                    <mat-hint>0.0 - 10.0</mat-hint>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>CVE ID</mat-label>
                    <input matInput formControlName="cveId" placeholder="CVE-2024-12345">
                    <mat-hint>Formato: CVE-YYYY-NNNNN</mat-hint>
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>CWE-ID</mat-label>
                    <input matInput formControlName="cweId" placeholder="CWE-89">
                  </mat-form-field>

                  <mat-form-field appearance="outline">
                    <mat-label>Origen de Detección</mat-label>
                    <input matInput formControlName="detectionSource" placeholder="IP o URL">
                  </mat-form-field>
                </div>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Activo Afectado</mat-label>
                  <textarea matInput formControlName="affectedAsset" rows="2" 
                            placeholder="Sistema o aplicación afectada"></textarea>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Recomendación de Remediación</mat-label>
                  <textarea matInput formControlName="recommendation" rows="4"
                            placeholder="Describe las acciones recomendadas para remediar este hallazgo..."></textarea>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Impacto</mat-label>
                  <textarea matInput formControlName="impact" rows="3"
                            placeholder="Describe el impacto técnico y de negocio..."></textarea>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Implicancias</mat-label>
                  <textarea matInput formControlName="implications" rows="3"
                            placeholder="Describe las implicancias a corto y largo plazo..."></textarea>
                </mat-form-field>

                <mat-divider class="section-divider"></mat-divider>

                <!-- Controles Aplicables -->
                <div class="controls-section">
                  <label><mat-icon>security</mat-icon> Controles Aplicables (CIS, NIST, OWASP, ISO 27001)</label>
                  <mat-chip-listbox>
                    @for (control of controls(); track control) {
                      <mat-chip>
                        {{ control }}
                        <button matChipRemove (click)="removeControl($index)">
                          <mat-icon>cancel</mat-icon>
                        </button>
                      </mat-chip>
                    }
                  </mat-chip-listbox>
                  <div class="add-control">
                    <mat-form-field appearance="outline" style="flex: 1;">
                      <mat-label>Agregar control</mat-label>
                      <input matInput [(ngModel)]="newControl" [ngModelOptions]="{standalone: true}"
                             (keyup.enter)="addControl()" placeholder="Ej: CIS 5.1, NIST AC-2">
                    </mat-form-field>
                    <button mat-raised-button color="primary" (click)="addControl()">
                      <mat-icon>add</mat-icon>
                    </button>
                  </div>
                </div>

                <mat-divider class="section-divider"></mat-divider>

                <!-- Referencias Externas -->
                <div class="references-section">
                  <label><mat-icon>link</mat-icon> Referencias Externas</label>
                  @if (references().length > 0) {
                    <div class="references-list">
                      @for (ref of references(); track $index) {
                        <div class="reference-item">
                          <a [href]="ref.url" target="_blank" rel="noopener">
                            <mat-icon>open_in_new</mat-icon>
                            {{ ref.label }}
                          </a>
                          <button mat-icon-button color="warn" (click)="removeReference($index)">
                            <mat-icon>delete</mat-icon>
                          </button>
                        </div>
                      }
                    </div>
                  }
                  <div class="add-reference">
                    <mat-form-field appearance="outline" style="flex: 1;">
                      <mat-label>Título</mat-label>
                      <input matInput [(ngModel)]="newRefLabel" [ngModelOptions]="{standalone: true}">
                    </mat-form-field>
                    <mat-form-field appearance="outline" style="flex: 1;">
                      <mat-label>URL</mat-label>
                      <input matInput [(ngModel)]="newRefUrl" [ngModelOptions]="{standalone: true}" type="url">
                    </mat-form-field>
                    <button mat-raised-button color="primary" (click)="addReference()">
                      <mat-icon>add</mat-icon>
                    </button>
                  </div>
                </div>

                <div class="actions">
                  <button mat-button matStepperPrevious>Atrás</button>
                  <button mat-raised-button color="primary" matStepperNext>Siguiente</button>
                </div>
              </form>
            </mat-step>

            <mat-step>
              <ng-template matStepLabel>Evidencias</ng-template>
              <div class="wizard-form">
                <h3>📎 Adjuntar Evidencias</h3>
                <div class="upload-zone" (click)="fileInput.click()">
                  <mat-icon>cloud_upload</mat-icon>
                  <p>Arrastra o haz clic</p>
                  <input #fileInput type="file" multiple (change)="onFileSelected($event)" hidden>
                </div>

                @if (selectedFiles().length > 0) {
                  <div class="file-list">
                    @for (file of selectedFiles(); track $index) {
                      <mat-chip>
                        {{ file.name }}
                        <button matChipRemove (click)="removeFile($index)">
                          <mat-icon>cancel</mat-icon>
                        </button>
                      </mat-chip>
                    }
                  </div>
                }

                <div class="actions">
                  <button mat-button matStepperPrevious>Atrás</button>
                  <button mat-raised-button color="accent" (click)="submitFinding()" [disabled]="submitting()">
                    @if (submitting()) {
                      <mat-spinner diameter="20"></mat-spinner>
                    } @else {
                      <mat-icon>save</mat-icon>
                      Crear Hallazgo
                    }
                  </button>
                </div>
              </div>
            </mat-step>
          </mat-stepper>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .wizard-container { padding: 0; max-width: 1200px; margin: 0 auto; }
    mat-card-title { display: flex; align-items: center; gap: 12px; font-size: 24px; }
    .wizard-form { padding: 24px 0; }
    .template-section { background: #f0f7ff; padding: 20px; border-radius: 8px; margin-bottom: 24px; border-left: 4px solid #2196f3; }
    .template-option { display: flex; justify-content: space-between; width: 100%; }
    .section-divider { margin: 24px 0; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .full-width { grid-column: 1 / -1; width: 100%; }
    .code-icon { color: #ff9800; }
    .severity-border { border-left: 4px solid #f44336; padding-left: 8px; }
    .rich-section { margin-bottom: 16px; }
    .rich-section label { display: block; font-size: 14px; font-weight: 500; margin-bottom: 8px; }
    .toolbar { display: flex; gap: 4px; background: #f5f5f5; padding: 4px; border: 1px solid #ddd; border-bottom: none; }
    .editor { min-height: 120px; padding: 12px; border: 1px solid #ddd; background: white; }
    .editor:focus { outline: 2px solid #3f51b5; }
    .upload-zone { border: 2px dashed #ccc; padding: 32px; text-align: center; cursor: pointer; margin: 16px 0; }
    .upload-zone:hover { border-color: #2196f3; background: #f5f5f5; }
    .file-list { margin: 16px 0; }
    .actions { display: flex; justify-content: space-between; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e0e0e0; }
    .severity-critical { background: #ffebee; color: #c62828; }
    .severity-high { background: #fff3e0; color: #e65100; }
    .severity-medium { background: #fff9c4; color: #f57f17; }
    .severity-low { background: #e3f2fd; color: #1565c0; }
    .severity-info { background: #f5f5f5; color: #616161; }
    .error { color: #f44336; font-size: 12px; }
    .controls-section, .references-section { margin: 20px 0; }
    .controls-section label, .references-section label { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 500; margin-bottom: 12px; color: #424242; }
    .add-control, .add-reference { display: flex; gap: 8px; margin-top: 12px; align-items: flex-start; }
    .references-list { margin: 12px 0; }
    .reference-item { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: #f5f5f5; border-radius: 4px; margin-bottom: 8px; }
    .reference-item a { display: flex; align-items: center; gap: 8px; color: #1976d2; text-decoration: none; }
    .reference-item a:hover { text-decoration: underline; }
  `]
})
export class FindingWizardComponent implements OnInit {
  @ViewChild('editor') editorRef!: ElementRef;

  // Dependencias principales
  private fb = inject(FormBuilder);
  private router = inject(Router);
  findingService = inject(FindingService);
  projectService = inject(ProjectService);

  // Formularios por paso del wizard
  basicForm!: FormGroup;
  technicalForm!: FormGroup;
  templateSearch = '';

  // Catalogo local de plantillas (fallback)
  templates = signal<Template[]>([
    { id: 1, name: 'SQL Injection', severity: 'CRITICAL', description: 'Inyección SQL que permite acceso no autorizado a BD', cvssScore: 9.8, cweId: 'CWE-89' },
    { id: 2, name: 'XSS Reflejado', severity: 'HIGH', description: 'Cross-Site Scripting reflejado en parámetros', cvssScore: 7.5, cweId: 'CWE-79' },
    { id: 3, name: 'XSS Almacenado', severity: 'CRITICAL', description: 'XSS persistente en base de datos', cvssScore: 9.0, cweId: 'CWE-79' },
    { id: 4, name: 'CSRF', severity: 'MEDIUM', description: 'Cross-Site Request Forgery', cvssScore: 6.5, cweId: 'CWE-352' },
    { id: 5, name: 'Path Traversal', severity: 'HIGH', description: 'Acceso a archivos del sistema', cvssScore: 8.2, cweId: 'CWE-22' },
  ]);
  filteredTemplates = signal(this.templates());
  // Datos para autocompletados de cliente y proyecto
  clients = signal<any[]>([]);
  filteredClients = signal<any[]>([]);
  showCreateClient = signal(false);
  filteredProjects = signal<any[]>([]);
  showCreateProject = signal(false);
  // Archivos adjuntos y estado de envio
  selectedFiles = signal<File[]>([]);
  submitting = signal(false);
  templateLoading = signal(false);
  
  // Manejo de controles y referencias
  controls = signal<string[]>([]);
  newControl = '';
  references = signal<{ label: string; url: string }[]>([]);
  newRefLabel = '';
  newRefUrl = '';
  
  private http = inject(HttpClient);
  private readonly templateApi = `${environment.apiUrl}/templates`;

  ngOnInit(): void {
    // Inicializa formularios y listas base del wizard
    this.initForms();
    this.loadClients();
    this.projectService.loadProjects({});
    this.generateCode();
    this.setupClientFilter();
    this.setupProjectFilter();
  }

  initForms(): void {
    // Define controles y validaciones para cada paso
    this.basicForm = this.fb.group({
      clientName: ['', Validators.required],
      clientId: [''],
      projectName: ['', Validators.required],
      projectId: [''],
      code: [{ value: '', disabled: true }],
      title: ['', Validators.required],
      description: ['', Validators.required],
      severity: ['', Validators.required],
      detectionSource: ['']
    });

    this.technicalForm = this.fb.group({
      cvssScore: [''],
      cveId: [''],
      detectionSource: [''],
      cweId: [''],
      affectedAsset: [''],
      recommendation: [''],
      impact: [''],
      implications: [''],
      controls: [[]],
      references: [[]]
    });
  }

  setupProjectFilter(): void {
    // Filtra proyectos en base al texto ingresado
    this.basicForm.get('projectName')?.valueChanges.subscribe(value => {
      const filter = typeof value === 'string' ? value.toLowerCase() : '';
      const filtered = this.projectService.projects().filter(p => 
        p.name.toLowerCase().includes(filter)
      );
      this.filteredProjects.set(filtered);
      this.showCreateProject.set(filter.length > 0 && filtered.length === 0);
    });
  }

  loadClients(): void {
    // Carga clientes para el autocomplete
    this.http.get<any[]>('http://localhost:3000/api/clients').subscribe({
      next: (clients) => {
        this.clients.set(clients);
        this.filteredClients.set(clients);
      },
      error: (err) => console.error('Error loading clients:', err)
    });
  }

  onTemplateSearch(term: string): void {
    this.templateSearch = term;

    if (!term || term.length < 2) {
      this.filteredTemplates.set(this.templates());
      return;
    }

    this.templateLoading.set(true);
    this.http.get<any[]>(`${this.templateApi}/search`, { params: { q: term } }).subscribe({
      next: (templates) => {
        const mapped: Template[] = templates.map((t: any) => ({
          id: t._id,
          name: t.title,
          description: t.description,
          severity: t.severity,
          recommendation: t.recommendation,
          cvssScore: t.cvss_score,
          cweId: t.cwe_id,
        }));

        this.templates.set(mapped.length ? mapped : this.templates());
        this.filteredTemplates.set(mapped.length ? mapped : this.templates());
        this.templateLoading.set(false);
      },
      error: () => {
        this.templateLoading.set(false);
        this.filteredTemplates.set(this.templates());
      }
    });
  }

  setupClientFilter(): void {
    // Filtra clientes en base al texto ingresado
    this.basicForm.get('clientName')?.valueChanges.subscribe(value => {
      const filter = typeof value === 'string' ? value.toLowerCase() : '';
      const filtered = this.clients().filter(c => 
        c.name.toLowerCase().includes(filter)
      );
      this.filteredClients.set(filtered);
      this.showCreateClient.set(filter.length > 0 && filtered.length === 0);
    });
  }

  selectClient(client: any): void {
    // Normaliza la seleccion cuando se elige "crear nuevo"
    if (client._id === 'new') {
      this.basicForm.patchValue({
        clientId: 'new',
        clientName: client.name
      });
    } else {
      this.basicForm.patchValue({
        clientId: client._id,
        clientName: client.name
      });
    }
  }

  generateCode(): void {
    // Genera un codigo de hallazgo simple basado en timestamp
    const timestamp = Date.now().toString().slice(-8);
    const code = `VULN-${timestamp}`;
    this.basicForm.patchValue({ code });
  }

  applyTemplate(template: Template): void {
    // Copia datos de la plantilla a los formularios
    this.basicForm.patchValue({
      title: template.name,
      description: template.description,
      severity: template.severity
    });
    this.technicalForm.patchValue({
      cvssScore: template.cvssScore,
      cweId: template.cweId,
      recommendation: template.recommendation
    });
    this.templateSearch = '';
  }

  selectProject(project: any): void {
    // Maneja seleccion de proyecto existente o creacion
    if (project._id === 'new') {
      // Usuario quiere crear un proyecto nuevo
      this.basicForm.patchValue({ 
        projectId: 'new'
      });
      // Dejar projectName como texto que escribió el usuario
    } else {
      // Proyecto existente - guardar objeto completo para displayWith
      this.basicForm.patchValue({ 
        projectName: project,  // Objeto completo
        projectId: project._id 
      });
    }
  }

  displayProjectFn = (value: any): string => {
    // Si es string, devolverlo (cuando escribe)
    if (typeof value === 'string') return value;
    // Si es objeto, devolver el nombre
    return value?.name || '';
  };

  format(cmd: string): void {
    // Comando basico de edicion para el editor enriquecido
    document.execCommand(cmd, false);
  }

  onDescriptionChange(event: any): void {
    // Sincroniza el contenido editable al formulario
    this.basicForm.patchValue({ description: event.target.innerHTML });
  }

  onFileSelected(event: any): void {
    // Agrega archivos seleccionados al buffer local
    const files = Array.from(event.target.files) as File[];
    this.selectedFiles.update(current => [...current, ...files]);
  }

  removeFile(index: number): void {
    // Remueve un archivo de la lista
    this.selectedFiles.update(files => files.filter((_, i) => i !== index));
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

  submitFinding(): void {
    // Orquesta la creacion del hallazgo (y proyecto si aplica)
    if (!this.basicForm.valid) {
      alert('⚠️ Completa los campos obligatorios: Cliente, Proyecto, Código, Título, Descripción y Severidad');
      return;
    }

    const projectId = this.basicForm.value.projectId;
    let projectName = this.basicForm.value.projectName;
    
    // Si projectName es un objeto, extraer el nombre
    if (typeof projectName === 'object' && projectName?.name) {
      projectName = projectName.name;
    }
    
    const clientId = this.basicForm.value.clientId;
    
    // Si el proyecto es 'new', crear el proyecto primero
    if (projectId === 'new' && projectName) {
      if (!clientId || clientId === 'new') {
        alert('⚠️ Para crear un proyecto nuevo, primero debes seleccionar un cliente existente.');
        return;
      }
      
      this.submitting.set(true);
      console.log('📤 Verificando si existe proyecto:', projectName);
      
      // Verificar si ya existe un proyecto con este nombre para este cliente
      this.http.get<any[]>(`http://localhost:3000/api/projects?clientId=${clientId}`)
        .subscribe({
          next: (projects) => {
            const existingProject = projects.find(p => 
              p.name.toLowerCase().trim() === projectName.toLowerCase().trim()
            );
            
            if (existingProject) {
              console.log('✅ Proyecto ya existe, usando:', existingProject);
              this.basicForm.patchValue({ projectId: existingProject._id });
              this.createFinding();
            } else {
              console.log('📤 Creando nuevo proyecto:', projectName);
              
              // Obtener la arquitectura del formulario o usar WEB por defecto
              const serviceArchitecture = this.basicForm.value.detectionSource || 'WEB';
              
              // Crear el proyecto
              this.http.post<any>('http://localhost:3000/api/projects', {
                name: projectName,
                clientId: clientId,
                areaId: clientId, // TODO: Fix this, areaId should not be clientId
                description: `Proyecto creado automáticamente desde hallazgo`,
                serviceArchitecture: serviceArchitecture
              }).subscribe({
                next: (newProject) => {
                  console.log('✅ Proyecto creado:', newProject);
                  this.basicForm.patchValue({ projectId: newProject._id });
                  this.createFinding();
                },
                error: (error) => {
                  console.error('❌ Error al crear proyecto:', error);
                  this.submitting.set(false);
                  alert(`❌ Error al crear proyecto: ${error?.error?.message || 'Error desconocido'}`);
                }
              });
            }
          },
          error: (error) => {
            console.error('❌ Error al verificar proyectos:', error);
            this.submitting.set(false);
            alert(`❌ Error al verificar proyectos: ${error?.error?.message || 'Error desconocido'}`);
          }
        });
    } else if (!projectId) {
      alert('⚠️ Debes seleccionar un proyecto o escribir el nombre de uno nuevo.');
      return;
    } else {
      // Proyecto ya existe, crear hallazgo directamente
      this.createFinding();
    }
  }

  private createFinding(): void {
    // Construye payload final y envia al backend
    this.submitting.set(true);
    const basicData = this.basicForm.getRawValue();
    const technicalData = this.technicalForm.value;
    
    // Generar internal_code basado en severidad y timestamp
    const severityPrefix = basicData.severity.substring(0, 3).toUpperCase();
    const internalCode = `${severityPrefix}-${Date.now().toString().slice(-6)}`;
    
    const data = {
      code: basicData.code,
      internal_code: internalCode,
      title: basicData.title,
      description: basicData.description,
      severity: basicData.severity,
      projectId: basicData.projectId,
      cvssScore: technicalData.cvssScore ? Number(technicalData.cvssScore) : undefined,
      cve_id: technicalData.cveId || undefined,
      cweId: technicalData.cweId || undefined,
      detection_source: technicalData.detectionSource || undefined,
      affectedAsset: technicalData.affectedAsset || undefined,
      recommendation: technicalData.recommendation || undefined,
      impact: technicalData.impact || undefined,
      implications: technicalData.implications || undefined,
      controls: this.controls(),
      references: this.references()
    };

    console.log('📤 Enviando hallazgo:', data);

    this.findingService.createFinding(data).subscribe({
      next: (response) => {
        console.log('✅ Hallazgo creado:', response);
        alert('✅ Hallazgo guardado exitosamente');
        this.router.navigate(['/findings']);
      },
      error: (error) => {
        console.error('❌ Error al guardar hallazgo:', error);
        this.submitting.set(false);
        const errorMsg = error?.error?.message || error?.message || 'Error desconocido al guardar';
        alert(`❌ Error al guardar hallazgo: ${errorMsg}`);
      }
    });
  }
}

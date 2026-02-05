import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../shared/enums';

@Component({
    selector: 'app-project-detail',
    imports: [
        CommonModule,
        RouterLink,
        ReactiveFormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatChipsModule,
        MatDividerModule,
        MatTooltipModule,
        MatSnackBarModule,
        MatDialogModule
    ],
    template: `
    <div class="project-detail-container">
      <div class="header">
        <button mat-icon-button routerLink="/projects">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>
          @if (isEditMode()) {
            📝 Editar Proyecto
          } @else {
            ➕ Nuevo Proyecto
          }
        </h1>
        <div class="header-actions">
           @if (isEditMode()) {
             <button mat-icon-button color="primary" matTooltip="Descargar Reporte PDF" (click)="downloadPdf()">
               <mat-icon>picture_as_pdf</mat-icon>
             </button>
             <button mat-icon-button color="accent" matTooltip="Descargar Evidencias (ZIP)" (click)="downloadZip()">
                <mat-icon>folder_zip</mat-icon>
             </button>
           }
        </div>
      </div>

      @if (loading()) {
        <mat-card>
          <mat-card-content>
            <p>Cargando proyecto...</p>
          </mat-card-content>
        </mat-card>
      } @else {
        <form [formGroup]="projectForm" (ngSubmit)="saveProject()">
          <!-- INFORMACIÓN BÁSICA -->
          <mat-card class="section-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>info</mat-icon>
                Información Básica
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="form-row">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Nombre del Proyecto</mat-label>
                  <input matInput formControlName="name" placeholder="Ej: Auditoría Web Banking">
                  @if (projectForm.get('name')?.hasError('required')) {
                    <mat-error>El nombre es requerido</mat-error>
                  }
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Código</mat-label>
                  <input matInput formControlName="code" placeholder="Ej: PROJ-2025-001">
                  <mat-hint>Opcional, se genera automáticamente</mat-hint>
                </mat-form-field>

                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Cliente</mat-label>
                  <mat-select formControlName="clientId">
                    @for (client of clients(); track client.id) {
                      <mat-option [value]="client.id">{{ client.name }}</mat-option>
                    }
                  </mat-select>
                  @if (projectForm.get('clientId')?.hasError('required')) {
                    <mat-error>El cliente es requerido</mat-error>
                  }
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Áreas</mat-label>
                  <mat-select formControlName="areaIds" multiple>
                    @for (area of areas(); track area._id) {
                      <mat-option [value]="area._id">{{ area.name }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Descripción</mat-label>
                  <textarea matInput formControlName="description" rows="3" 
                            placeholder="Descripción breve del proyecto"></textarea>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Arquitectura del Servicio</mat-label>
                  <mat-select formControlName="serviceArchitecture">
                    <mat-option value="WEB">Aplicación Web</mat-option>
                    <mat-option value="MOBILE">Aplicación Móvil</mat-option>
                    <mat-option value="API">API REST</mat-option>
                    <mat-option value="NETWORK">Infraestructura de Red</mat-option>
                    <mat-option value="CLOUD">Cloud / AWS / Azure</mat-option>
                    <mat-option value="DESKTOP">Aplicación Desktop</mat-option>
                    <mat-option value="IOT">IoT / Embedded</mat-option>
                    <mat-option value="OTHER">Otro</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Tipo de Prueba</mat-label>
                  <mat-select formControlName="testType">
                    <mat-option value="BLACKBOX">Black Box</mat-option>
                    <mat-option value="GREYBOX">Grey Box</mat-option>
                    <mat-option value="WHITEBOX">White Box</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- FECHAS Y DURACIÓN -->
          <mat-card class="section-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>schedule</mat-icon>
                Fechas y Duración
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="form-row">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Fecha de Creación</mat-label>
                  <input matInput [matDatepicker]="pickerCreated" formControlName="createdAt">
                  <mat-datepicker-toggle matSuffix [for]="pickerCreated"></mat-datepicker-toggle>
                  <mat-datepicker #pickerCreated></mat-datepicker>
                  <mat-hint>Fecha en que se creó el proyecto</mat-hint>
                </mat-form-field>

                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Fecha de Inicio del Servicio</mat-label>
                  <input matInput [matDatepicker]="pickerStart" formControlName="serviceStartDate">
                  <mat-datepicker-toggle matSuffix [for]="pickerStart"></mat-datepicker-toggle>
                  <mat-datepicker #pickerStart></mat-datepicker>
                  <mat-hint>Fecha en que inicia el servicio (puede ser posterior)</mat-hint>
                </mat-form-field>
              </div>

              <div class="form-row">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Fecha de Término</mat-label>
                  <input matInput [matDatepicker]="pickerEnd" formControlName="endDate">
                  <mat-datepicker-toggle matSuffix [for]="pickerEnd"></mat-datepicker-toggle>
                  <mat-datepicker #pickerEnd></mat-datepicker>
                  <mat-hint>Fecha estimada de finalización</mat-hint>
                </mat-form-field>

                @if (projectDuration()) {
                  <div class="duration-info half-width">
                    <mat-icon>timeline</mat-icon>
                    <div>
                      <strong>Duración del proyecto</strong>
                      <p>{{ projectDuration() }}</p>
                    </div>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>

          <!-- EQUIPO Y CONTACTOS -->
          <mat-card class="section-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>group</mat-icon>
                Equipo y Contactos
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div formArrayName="teamMembers">
                @for (member of teamMembers.controls; track $index) {
                  <div [formGroupName]="$index" class="team-member-row">
                    <mat-form-field appearance="outline" class="member-name">
                      <mat-label>Nombre</mat-label>
                      <input matInput formControlName="name" placeholder="Ej: Juan Pérez">
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="member-email">
                      <mat-label>Email</mat-label>
                      <input matInput type="email" formControlName="email" placeholder="juan@empresa.com">
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="member-role">
                      <mat-label>Rol</mat-label>
                      <mat-select formControlName="role">
                        <mat-option value="LEAD">Líder</mat-option>
                        <mat-option value="ANALYST">Analista</mat-option>
                        <mat-option value="REVIEWER">Revisor</mat-option>
                        <mat-option value="CONTACT">Contacto Cliente</mat-option>
                      </mat-select>
                    </mat-form-field>

                    <button mat-icon-button color="warn" type="button" 
                            (click)="removeTeamMember($index)"
                            [disabled]="teamMembers.length === 1">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                }
              </div>

              <button mat-stroked-button type="button" (click)="addTeamMember()">
                <mat-icon>add</mat-icon>
                Agregar Miembro
              </button>
            </mat-card-content>
          </mat-card>

          <!-- ESTADO Y CIERRE -->
          <mat-card class="section-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>flag</mat-icon>
                Estado del Proyecto
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="form-row">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Estado</mat-label>
                  <mat-select formControlName="projectStatus" 
                              [disabled]="!canChangeStatus()">
                    <mat-option value="ACTIVE">🟢 Activo</mat-option>
                    <mat-option value="CLOSED">🔴 Cerrado</mat-option>
                    <mat-option value="ARCHIVED">📦 Archivado</mat-option>
                  </mat-select>
                  @if (!canChangeStatus()) {
                    <mat-hint class="warning-hint">
                      Solo OWNER o ADMIN del tenant/área pueden cambiar el estado
                    </mat-hint>
                  }
                </mat-form-field>
              </div>

              @if (projectForm.get('projectStatus')?.value === 'CLOSED') {
                <div class="warning-box">
                  <mat-icon>warning</mat-icon>
                  <div>
                    <strong>⚠️ Proyecto Cerrado</strong>
                    <p>Al cerrar el proyecto, todos los hallazgos asociados quedarán en modo solo lectura y no podrán modificarse.</p>
                  </div>
                </div>
              }
            </mat-card-content>
          </mat-card>

          <!-- ACCIONES -->
          <div class="actions">
            <button mat-button type="button" routerLink="/projects">
              Cancelar
            </button>
            <button mat-raised-button color="primary" type="submit" 
                    [disabled]="projectForm.invalid || saving()">
              <mat-icon>{{ saving() ? 'hourglass_empty' : 'save' }}</mat-icon>
              {{ saving() ? 'Guardando...' : 'Guardar Proyecto' }}
            </button>
          </div>
        </form>
      }
    </div>
  `,
    styles: [`
    .project-detail-container {
      padding: 0;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }

    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 500;
    }

    .section-card {
      margin-bottom: 24px;
    }

    mat-card-header {
      margin-bottom: 16px;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
    }

    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }

    .full-width {
      flex: 1;
      width: 100%;
    }

    .half-width {
      flex: 1;
      min-width: 0;
    }

    .team-member-row {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .member-name {
      flex: 2;
    }

    .member-email {
      flex: 2;
    }

    .member-role {
      flex: 1;
    }

    .duration-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #e3f2fd;
      border-radius: 4px;
    }

    .duration-info mat-icon {
      color: #1976d2;
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .duration-info strong {
      display: block;
      font-size: 14px;
      color: rgba(0,0,0,0.6);
    }

    .duration-info p {
      margin: 4px 0 0 0;
      font-size: 18px;
      font-weight: 500;
      color: #1976d2;
    }

    .warning-box {
      display: flex;
      gap: 12px;
      padding: 16px;
      background: #fff3e0;
      border-left: 4px solid #ff9800;
      border-radius: 4px;
      margin-top: 16px;
    }

    .warning-box mat-icon {
      color: #ff9800;
    }

    .warning-box strong {
      display: block;
      margin-bottom: 4px;
    }

    .warning-box p {
      margin: 0;
      font-size: 14px;
      color: rgba(0,0,0,0.7);
    }

    .warning-hint {
      color: #ff9800 !important;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      margin-top: 24px;
      padding-bottom: 24px;
    }
  `]
})
export class ProjectDetailComponent implements OnInit {
  // Dependencias para formularios, enrutamiento y mensajeria
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);

  private API_URL = `${environment.apiUrl}/projects`;
  private CLIENT_API_URL = `${environment.apiUrl}/clients`;
  private AREA_API_URL = `${environment.apiUrl}/areas`;

  // Estado principal de la pantalla
  projectForm!: FormGroup;
  loading = signal(false);
  saving = signal(false);
  isEditMode = signal(false);
  projectId = signal<string | null>(null);
  clients = signal<any[]>([]);
  areas = signal<any[]>([]);

  projectDuration = computed(() => {
    // Calcula una duracion legible desde la fecha de inicio del servicio
    const startDate = this.projectForm?.get('serviceStartDate')?.value;
    if (!startDate) return null;

    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) {
      return `${diffDays} días`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      const days = diffDays % 30;
      return `${months} ${months === 1 ? 'mes' : 'meses'}${days > 0 ? ` y ${days} días` : ''}`;
    } else {
      const years = Math.floor(diffDays / 365);
      const months = Math.floor((diffDays % 365) / 30);
      return `${years} ${years === 1 ? 'año' : 'años'}${months > 0 ? ` y ${months} meses` : ''}`;
    }
  });

  downloadPdf() {
    if (!this.projectId()) return;
    const url = `${environment.apiUrl}/export/project/${this.projectId()}/pdf`;
    window.open(url, '_blank');
  }

  downloadZip() {
    if (!this.projectId()) return;
    const url = `${environment.apiUrl}/export/project/${this.projectId()}/zip`;
    window.open(url, '_blank');
  }

  get teamMembers() {
    // Acceso tipado al FormArray de miembros del equipo
    return this.projectForm.get('teamMembers') as FormArray;
  }

  ngOnInit(): void {
    // Inicializa formulario y determina si es alta o edicion
    this.initForm();
    this.loadClients();
    this.loadAreas();

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode.set(true);
      this.projectId.set(id);
      this.loadProject(id);
    } else {
      // Agregar un miembro por defecto
      this.addTeamMember();
    }
  }

  initForm(): void {
    // Estructura base del formulario para proyecto
    this.projectForm = this.fb.group({
      name: ['', Validators.required],
      code: [''],
      clientId: ['', Validators.required],
      areaIds: [[]],
      description: [''],
      serviceArchitecture: ['WEB'],
      testType: ['BLACKBOX'],
      createdAt: [new Date()],
      serviceStartDate: [new Date()],
      endDate: [''],
      projectStatus: ['ACTIVE'],
      teamMembers: this.fb.array([])
    });
  }

  loadClients(): void {
    // Carga clientes para el selector de cliente
    this.http.get<any[]>(this.CLIENT_API_URL).subscribe({
      next: (data) => this.clients.set(data),
      error: (err) => console.error('Error al cargar clientes:', err)
    });
  }

  loadAreas(): void {
    this.http.get<any[]>(this.AREA_API_URL).subscribe({
      next: (data) => this.areas.set(data),
      error: (err) => console.error('Error al cargar áreas:', err)
    });
  }

  loadProject(id: string): void {
    // Carga datos del proyecto y los vuelca al formulario
    this.loading.set(true);
    this.http.get<any>(`${this.API_URL}/${id}`).subscribe({
      next: (project) => {
        this.projectForm.patchValue({
          name: project.name,
          code: project.code,
          clientId: project.clientId?._id || project.clientId,
          areaIds: project.areaIds?.map((a: any) => a._id || a) || (project.areaId ? [project.areaId._id || project.areaId] : []),
          description: project.description,
          serviceArchitecture: project.serviceArchitecture,
          testType: project.testType,
          createdAt: project.createdAt ? new Date(project.createdAt) : new Date(),
          serviceStartDate: project.serviceStartDate ? new Date(project.serviceStartDate) : new Date(),
          endDate: project.endDate ? new Date(project.endDate) : null,
          projectStatus: project.projectStatus
        });

        // Cargar equipo
        if (project.teamMembers && project.teamMembers.length > 0) {
          project.teamMembers.forEach((member: any) => {
            this.teamMembers.push(this.createTeamMember(member));
          });
        } else {
          this.addTeamMember();
        }

        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar proyecto:', err);
        this.snackBar.open('Error al cargar el proyecto', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  createTeamMember(data?: any): FormGroup {
    // Crea un grupo de formulario para un miembro del equipo
    return this.fb.group({
      name: [data?.name || '', Validators.required],
      email: [data?.email || '', [Validators.required, Validators.email]],
      role: [data?.role || 'ANALYST']
    });
  }

  addTeamMember(): void {
    // Agrega un miembro vacio al formulario
    this.teamMembers.push(this.createTeamMember());
  }

  removeTeamMember(index: number): void {
    // Evita dejar el equipo vacio por error de usuario
    if (this.teamMembers.length > 1) {
      this.teamMembers.removeAt(index);
    }
  }

  canChangeStatus(): boolean {
    // Regla de permisos para cambio de estado del proyecto
    const user = this.authService.currentUser();
    if (!user) return false;
    
    // OWNER puede cambiar cualquier estado
    if (user.role === UserRole.OWNER) return true;
    
    // CLIENT_ADMIN y AREA_ADMIN pueden cambiar estado de proyectos de su tenant
    if (user.role === UserRole.CLIENT_ADMIN || user.role === UserRole.AREA_ADMIN) {
      // TODO: Verificar que el proyecto pertenece al mismo tenant del admin
      return true;
    }
    
    return false;
  }

  saveProject(): void {
    // Valida y persiste el proyecto (alta o edicion)
    if (this.projectForm.invalid) {
      this.snackBar.open('Por favor completa todos los campos requeridos', 'Cerrar', { duration: 3000 });
      return;
    }

    this.saving.set(true);
    const projectData = this.projectForm.value;

    const request = this.isEditMode()
      ? this.http.put(`${this.API_URL}/${this.projectId()}`, projectData)
      : this.http.post(this.API_URL, projectData);

    request.subscribe({
      next: (response) => {
        this.snackBar.open(
          this.isEditMode() ? '✅ Proyecto actualizado' : '✅ Proyecto creado',
          'Cerrar',
          { duration: 3000 }
        );
        // Navega a listado tras guardar
        this.router.navigate(['/projects']);
      },
      error: (err) => {
        console.error('Error al guardar proyecto:', err);
        this.snackBar.open('❌ Error al guardar el proyecto', 'Cerrar', { duration: 3000 });
        this.saving.set(false);
      }
    });
  }
}

import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  effect,
} from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
} from "@angular/forms";
import { CommonModule } from "@angular/common";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatCardModule } from "@angular/material/card";
import { MatRadioModule } from "@angular/material/radio";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatChipsModule } from "@angular/material/chips";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatTabsModule } from "@angular/material/tabs";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { AuthService } from "../../../core/services/auth.service";

/**
 * Nuevo modelo de roles (5 roles)
 */
enum NewUserRole {
  OWNER = "OWNER",
  ADMIN_AREA = "ADMIN_AREA",
  PENTESTER = "PENTESTER",
  QA = "QA",
  NORMAL_USER = "NORMAL_USER",
  AUDITOR = "AUDITOR",
}

enum AuditorVisibilityScope {
  PER_PROJECT = "PER_PROJECT",
  PER_CLIENT = "PER_CLIENT",
  ALL_AREA = "ALL_AREA",
}

/**
 * Componente mejorado de creación/edición de usuarios con formulario dinámico
 *
 * CARACTERÍSTICAS:
 * - Validación condicional de contraseña según rol del creador
 * - Mostrar/ocultar campos dinámicamente según rol seleccionado
 * - Validación de Auditor con scope dinámico (Per-Project, Per-Client, All-Area)
 * - Soporte para bypass de password si creador es Owner
 * - Gestión de múltiples roles con reglas específicas
 */
@Component({
  standalone: true,
  selector: "app-user-create-dynamic",
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatRadioModule,
    MatCheckboxModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatSnackBarModule,
  ],
  template: `
    <mat-card class="user-form-container">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>person_add</mat-icon>
          {{ isEditMode() ? "Editar Usuario" : "Crear Nuevo Usuario" }}
        </mat-card-title>
        <mat-card-subtitle>
          Formulario dinámico adaptado según el rol seleccionado
        </mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <form [formGroup]="userForm" (ngSubmit)="submitForm()">
          <!-- SECCIÓN 1: Datos Básicos (siempre visible) -->
          <div class="form-section">
            <h3>Datos Básicos</h3>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input
                matInput
                formControlName="email"
                type="email"
                placeholder="usuario@example.com"
              />
              <mat-icon matPrefix>email</mat-icon>
              @if (userForm.get("email")?.hasError("required")) {
              <mat-error>Email requerido</mat-error>
              } @if (userForm.get("email")?.hasError("email")) {
              <mat-error>Email inválido</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nombre</mat-label>
              <input
                matInput
                formControlName="firstName"
                placeholder="Juan"
              />
              <mat-icon matPrefix>person</mat-icon>
              @if (userForm.get("firstName")?.hasError("required")) {
              <mat-error>Nombre requerido</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Apellido</mat-label>
              <input
                matInput
                formControlName="lastName"
                placeholder="Pérez"
              />
              <mat-icon matPrefix>person</mat-icon>
              @if (userForm.get("lastName")?.hasError("required")) {
              <mat-error>Apellido requerido</mat-error>
              }
            </mat-form-field>

            <!-- CONTRASEÑA: Validación condicional -->
            @if (showPasswordField()) {
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Contraseña</mat-label>
              <input
                matInput
                formControlName="password"
                [type]="showPassword() ? 'text' : 'password'"
                [placeholder]="passwordPlaceholder()"
              />
              <button
                mat-icon-button
                matSuffix
                type="button"
                (click)="togglePasswordVisibility()"
              >
                <mat-icon>{{
                  showPassword() ? "visibility_off" : "visibility"
                }}</mat-icon>
              </button>
              @if (userForm.get("password")?.hasError("required")) {
              <mat-error>Contraseña requerida</mat-error>
              } @if (userForm.get("password")?.hasError("minlength") &&
              !isOwner()) {
              <mat-error>
                Mínimo {{ passwordMinLength() }} caracteres
              </mat-error>
              }
              <mat-hint *ngIf="isOwner()"
                >Owner: puede usar cualquier contraseña
              </mat-hint>
            </mat-form-field>
            }
          </div>

          <!-- SECCIÓN 2: Rol y Permisos -->
          <div class="form-section">
            <h3>Asignación de Rol</h3>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Rol</mat-label>
              <mat-select formControlName="role" (selectionChange)="onRoleChange()">
                @for (role of availableRoles(); track role) {
                <mat-option [value]="role">
                  {{ getRoleLabel(role) }}
                  <span class="role-description">
                    {{ getRoleDescription(role) }}
                  </span>
                </mat-option>
                }
              </mat-select>
              <mat-icon matPrefix>security</mat-icon>
              @if (userForm.get("role")?.hasError("required")) {
              <mat-error>Rol requerido</mat-error>
              } @if (userForm.get("role")?.hasError("forbidden")) {
              <mat-error>{{ roleError() }}</mat-error>
              }
            </mat-form-field>

            <!-- Info del rol seleccionado -->
            <div class="role-info-panel">
              <mat-icon>info</mat-icon>
              <p>{{ selectedRoleInfo() }}</p>
            </div>
          </div>

          <!-- SECCIÓN 3: Asignación de Alcance (Dinámico según rol) -->
          @if (showScopeSection()) {
          <div class="form-section">
            <h3>Asignación de Alcance</h3>

            <!-- CLIENT_ID: Para OWNER, ADMIN_AREA, NORMAL_USER -->
            @if (showClientField()) {
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Cliente (Tenant)</mat-label>
              <mat-select formControlName="clientId">
                <mat-option value="">
                  -- Sin cliente específico (transversal) --
                </mat-option>
                @for (client of availableClients(); track client._id) {
                <mat-option [value]="client._id">
                  {{ client.name }}
                </mat-option>
                }
              </mat-select>
              <mat-icon matPrefix>business</mat-icon>
              @if (isClientFieldRequired()) {
              <mat-hint *ngIf="!userForm.get('clientId')?.value">
                Campo requerido para este rol
              </mat-hint>
              }
            </mat-form-field>
            }

            <!-- AREA_IDS: Para OWNER, NORMAL_USER -->
            @if (showAreaField()) {
            <div class="form-group">
              <label>Áreas Asignadas</label>
              <div class="area-selection">
                @for (area of availableAreas(); track area._id) {
                <mat-checkbox
                  [checked]="isAreaSelected(area._id)"
                  (change)="toggleArea(area._id)"
                >
                  {{ area.name }}
                </mat-checkbox>
                }
              </div>
              @if (userForm.get("areaIds")?.invalid &&
              userForm.get("areaIds")?.touched) {
              <mat-error>Selecciona al menos un área</mat-error>
              }
            </div>
            }
          </div>
          }

          <!-- SECCIÓN 4: Configuración de Auditor (Solo si rol === AUDITOR) -->
          @if (isAuditor()) {
          <div class="form-section auditor-section">
            <h3>
              <mat-icon>visibility</mat-icon>
              Scope de Visibilidad (Auditor)
            </h3>

            <p class="section-description">
              Define qué proyectos/clientes verá este Auditor
            </p>

            <mat-radio-group formControlName="auditorVisibilityScope">
              <!-- Per-Project -->
              <mat-radio-button value="PER_PROJECT" class="radio-option">
                <div class="radio-label">
                  <strong>Por Proyecto</strong>
                  <span class="radio-description">
                    El auditor ve solo proyectos específicos
                  </span>
                </div>
              </mat-radio-button>

              @if (visibilityScope() === "PER_PROJECT") {
              <div class="sub-form-group">
                <label>Selecciona proyectos visibles:</label>
                <div class="multi-select">
                  @for (project of availableProjects(); track project._id) {
                  <mat-checkbox
                    [checked]="isProjectSelected(project._id)"
                    (change)="toggleProject(project._id)"
                  >
                    {{ project.name }}
                    <span class="project-meta">
                      ({{ project.status }})
                    </span>
                  </mat-checkbox>
                  }
                </div>
              </div>
              }

              <!-- Per-Client -->
              <mat-radio-button value="PER_CLIENT" class="radio-option">
                <div class="radio-label">
                  <strong>Por Cliente</strong>
                  <span class="radio-description">
                    El auditor ve todos los proyectos de clientes específicos
                  </span>
                </div>
              </mat-radio-button>

              @if (visibilityScope() === "PER_CLIENT") {
              <div class="sub-form-group">
                <label>Selecciona clientes visibles:</label>
                <div class="multi-select">
                  @for (client of availableClients(); track client._id) {
                  <mat-checkbox
                    [checked]="isClientSelected(client._id)"
                    (change)="toggleClient(client._id)"
                  >
                    {{ client.name }}
                  </mat-checkbox>
                  }
                </div>
              </div>
              }

              <!-- All-Area -->
              <mat-radio-button value="ALL_AREA" class="radio-option">
                <div class="radio-label">
                  <strong>Todo el Área</strong>
                  <span class="radio-description">
                    El auditor ve todos los proyectos y hallazgos del área
                  </span>
                </div>
              </mat-radio-button>
            </mat-radio-group>

            @if (auditorScopeError()) {
            <mat-error>{{ auditorScopeError() }}</mat-error>
            }
          </div>
          }

          <!-- SECCIÓN 5: Acciones -->
          <div class="form-section form-actions">
            <button
              mat-raised-button
              color="primary"
              type="submit"
              [disabled]="!userForm.valid || isSubmitting()"
            >
              <mat-icon>{{ isEditMode() ? "edit" : "person_add" }}</mat-icon>
              {{
                isSubmitting()
                  ? "Procesando..."
                  : isEditMode()
                    ? "Actualizar Usuario"
                    : "Crear Usuario"
              }}
            </button>

            <button
              mat-stroked-button
              type="button"
              (click)="cancel()"
              [disabled]="isSubmitting()"
            >
              <mat-icon>close</mat-icon>
              Cancelar
            </button>
          </div>

          <!-- DEBUG: Mostrar validación actual (solo en desarrollo) -->
          @if (showDebugInfo()) {
          <div class="debug-section">
            <h4>DEBUG: Validación Actual</h4>
            <pre>{{ userForm.value | json }}</pre>
            <p>Form Valid: {{ userForm.valid }}</p>
            <p>Selected Role: {{ selectedRole() }}</p>
            <p>Is Auditor: {{ isAuditor() }}</p>
            <p>Visibility Scope: {{ visibilityScope() }}</p>
          </div>
          }
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .user-form-container {
        max-width: 800px;
        margin: 20px auto;
      }

      mat-card-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 24px;
      }

      mat-card-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 20px;
        font-weight: 500;
      }

      .form-section {
        margin-bottom: 32px;
        padding: 16px;
        background-color: #f9f9f9;
        border-left: 4px solid #2196f3;
        border-radius: 4px;
      }

      .form-section h3 {
        margin: 0 0 16px 0;
        font-size: 16px;
        font-weight: 600;
        color: #333;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .full-width {
        width: 100%;
        margin-bottom: 16px;
      }

      .role-info-panel {
        margin-top: 12px;
        padding: 12px;
        background-color: #e3f2fd;
        border-left: 3px solid #2196f3;
        border-radius: 3px;
        display: flex;
        gap: 12px;
      }

      .role-info-panel mat-icon {
        color: #2196f3;
      }

      .role-description {
        display: block;
        font-size: 12px;
        color: #999;
        margin-top: 4px;
      }

      .area-selection,
      .multi-select {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 12px;
        padding: 12px;
        background-color: #fafafa;
        border-radius: 4px;
      }

      mat-checkbox {
        margin-bottom: 8px;
      }

      .auditor-section {
        border-left-color: #ff9800;
      }

      .section-description {
        font-size: 13px;
        color: #666;
        margin: 0 0 16px 0;
      }

      mat-radio-group {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .radio-option {
        padding: 8px;
        background-color: #fafafa;
        border-radius: 4px;
        margin-bottom: 8px;
      }

      .radio-label {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .radio-description {
        font-size: 12px;
        color: #999;
        font-weight: normal;
      }

      .sub-form-group {
        margin-left: 32px;
        margin-top: 12px;
        padding: 12px;
        background-color: #f5f5f5;
        border-radius: 4px;
      }

      .sub-form-group label {
        display: block;
        font-size: 13px;
        font-weight: 600;
        margin-bottom: 8px;
      }

      .project-meta {
        font-size: 11px;
        color: #999;
        margin-left: 6px;
      }

      .form-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        background-color: #fff;
        border-left-color: #4caf50;
      }

      .form-actions button {
        min-width: 120px;
      }

      .debug-section {
        margin-top: 24px;
        padding: 12px;
        background-color: #f3e5f5;
        border: 1px solid #ce93d8;
        border-radius: 4px;
        font-size: 12px;
      }

      .debug-section pre {
        background-color: #fff3e0;
        padding: 8px;
        border-radius: 3px;
        overflow-x: auto;
      }

      mat-error {
        font-size: 12px;
      }

      mat-hint {
        font-size: 12px;
        color: #ff9800;
      }
    `,
  ],
})
export class UserCreateDynamicComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private http = inject(HttpClient);

  // ============ SIGNALS ============
  isEditMode = signal(false);
  isSubmitting = signal(false);
  showPassword = signal(false);
  showDebugInfo = signal(false); // Cambiar a true para debug

  selectedRole = signal<NewUserRole>(NewUserRole.NORMAL_USER);
  visibilityScope = signal<AuditorVisibilityScope>(AuditorVisibilityScope.ALL_AREA);

  selectedProjects = signal<Set<string>>(new Set());
  selectedClients = signal<Set<string>>(new Set());
  selectedAreas = signal<Set<string>>(new Set());

  availableClients = signal<any[]>([]);
  availableProjects = signal<any[]>([]);
  availableAreas = signal<any[]>([]);

  currentUserRole = signal<NewUserRole | null>(null);
  roleError = signal<string>("");
  auditorScopeError = signal<string>("");

  // ============ REACTIVE FORM ============
  userForm!: FormGroup;

  // ============ COMPUTED PROPERTIES ============

  /**
   * Determina si el creador (currentUser) es Owner
   */
  isOwner = computed(() => this.currentUserRole() === NewUserRole.OWNER);

  /**
   * Valida si el rol seleccionado es permitido por el creador
   */
  canCreateSelectedRole = computed(() => {
    const creatorRole = this.currentUserRole();
    const targetRole = this.selectedRole();

    if (!creatorRole) return true; // Sin validación en edición

    if (creatorRole === NewUserRole.OWNER) return true;
    if (creatorRole === NewUserRole.ADMIN_AREA) {
      return [NewUserRole.NORMAL_USER, NewUserRole.AUDITOR].includes(targetRole);
    }

    return false;
  });

  /**
   * Roles disponibles para seleccionar según quien crea
   */
  availableRoles = computed(() => {
    const creatorRole = this.currentUserRole();

    if (creatorRole === NewUserRole.OWNER) {
      return Object.values(NewUserRole);
    }

    if (creatorRole === NewUserRole.ADMIN_AREA) {
      return [NewUserRole.NORMAL_USER, NewUserRole.AUDITOR];
    }

    // Otros roles no pueden crear
    return [];
  });

  /**
   * Determina si mostrar el campo de contraseña
   */
  showPasswordField = computed(() => {
    const creatorRole = this.currentUserRole();
    // Mostrar si es new user o si creador es Owner/Admin
    return !this.isEditMode() || creatorRole === NewUserRole.OWNER || creatorRole === NewUserRole.ADMIN_AREA;
  });

  /**
   * Validación de contraseña
   */
  passwordMinLength = computed(() => (this.isOwner() ? 1 : 6));
  passwordPlaceholder = computed(() =>
    this.isOwner()
      ? "Owner: cualquier contraseña (1+ caracteres)"
      : "Mínimo 6 caracteres"
  );

  /**
   * Determinan visibilidad de campos según rol
   */
  showScopeSection = computed(() => {
    const role = this.selectedRole();
    return ![NewUserRole.PENTESTER, NewUserRole.QA].includes(role);
  });

  showClientField = computed(() => {
    const role = this.selectedRole();
    return ![NewUserRole.PENTESTER, NewUserRole.QA, NewUserRole.AUDITOR].includes(
      role,
    );
  });

  showAreaField = computed(() => {
    const role = this.selectedRole();
    return [
      NewUserRole.OWNER,
      NewUserRole.NORMAL_USER,
    ].includes(role);
  });

  isClientFieldRequired = computed(() => {
    const role = this.selectedRole();
    return role === NewUserRole.ADMIN_AREA;
  });

  /**
   * Determina si el rol seleccionado es Auditor
   */
  isAuditor = computed(() => this.selectedRole() === NewUserRole.AUDITOR);

  /**
   * Información sobre el rol seleccionado
   */
  selectedRoleInfo = computed(() => {
    const descriptions: Record<NewUserRole, string> = {
      [NewUserRole.OWNER]:
        "Acceso total a la plataforma sin restricciones. Puede crear cualquier tipo de usuario.",
      [NewUserRole.ADMIN_AREA]:
        "Administrador de un área específica. Gestiona proyectos, clientes, Normal Users y Auditores.",
      [NewUserRole.PENTESTER]:
        "Profesional transversal. Crea proyectos, hallazgos y evidencia sin estar amarrado a cliente específico.",
      [NewUserRole.QA]:
        "Asegurador de calidad. Mismo nivel de permisos que Pentester.",
      [NewUserRole.NORMAL_USER]:
        "Usuario común. Crea hallazgos en proyectos asignados.",
      [NewUserRole.AUDITOR]:
        "Perfil de solo lectura. Visibilidad dinámica decidida por Admin Area.",
    };

    return descriptions[this.selectedRole()] || "";
  });

  // ============ LIFECYCLE ============
  ngOnInit(): void {
    this.initForm();
    this.loadCurrentUser();
    this.loadScopes();

    // Effect para validación condicional de rol
    effect(() => {
      const role = this.selectedRole();
      if (!this.canCreateSelectedRole()) {
        this.roleError.set("No tienes permiso para crear este rol");
        this.userForm.get("role")?.setErrors({ forbidden: true });
      } else {
        this.roleError.set("");
        this.userForm.get("role")?.setErrors(null);
      }
    });

    // Effect para validación de auditor scope
    effect(() => {
      if (this.isAuditor()) {
        this.validateAuditorScope();
      }
    });
  }

  // ============ MÉTODOS ============

  /**
   * Inicializar formulario reactivo con validadores dinámicos
   */
  private initForm(): void {
    this.userForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      firstName: ["", [Validators.required]],
      lastName: ["", [Validators.required]],
      password: this.isEditMode() ? "" : ["", [Validators.required]],
      role: [NewUserRole.NORMAL_USER, [Validators.required]],
      clientId: [""],
      areaIds: [[]],
      auditorVisibilityScope: [AuditorVisibilityScope.ALL_AREA],
      visibleProjectIds: [[]],
      visibleClientIds: [[]],
    });

    // Validador condicional de password
    this.userForm.get("password")?.setValidators([
      Validators.required,
      (control: AbstractControl) => {
        const value = control.value;
        if (!value) return null;

        // Si Owner, permitir cualquier longitud
        if (this.isOwner()) {
          return null;
        }

        // Para otros, min 6
        return value.length >= 6 ? null : { minlength: { requiredLength: 6, actualLength: value.length } };
      },
    ]);
  }

  /**
   * Cargar usuario actual para saber qué roles puede crear
   */
  private loadCurrentUser(): void {
    // Simulado - en producción obtener del authService
    const currentUser = this.authService.getCurrentUser(); // Método que debe existir en AuthService
    if (currentUser) {
      this.currentUserRole.set(currentUser.role as NewUserRole);
    }
  }

  /**
   * Cargar datos disponibles (clientes, proyectos, áreas)
   */
  private loadScopes(): void {
    // Simulado - en producción hacer llamadas HTTP
    this.http.get("/api/clients").subscribe((clients: any) => {
      this.availableClients.set(clients || []);
    });

    this.http.get("/api/projects").subscribe((projects: any) => {
      this.availableProjects.set(projects || []);
    });

    this.http.get("/api/areas").subscribe((areas: any) => {
      this.availableAreas.set(areas || []);
    });
  }

  /**
   * Al cambiar rol
   */
  onRoleChange(): void {
    const newRole = this.userForm.get("role")?.value;
    this.selectedRole.set(newRole);

    // Limpiar campos dinámicos
    if (![NewUserRole.PENTESTER, NewUserRole.QA].includes(newRole)) {
      // Estos roles son transversales
    }

    if (newRole !== NewUserRole.AUDITOR) {
      this.userForm.get("auditorVisibilityScope")?.reset();
      this.userForm.get("visibleProjectIds")?.reset();
      this.userForm.get("visibleClientIds")?.reset();
    }
  }

  /**
   * Gestionar selección de áreas
   */
  toggleArea(areaId: string): void {
    const current = new Set(this.selectedAreas());
    if (current.has(areaId)) {
      current.delete(areaId);
    } else {
      current.add(areaId);
    }
    this.selectedAreas.set(current);
    this.userForm.get("areaIds")?.setValue(Array.from(current));
  }

  isAreaSelected(areaId: string): boolean {
    return this.selectedAreas().has(areaId);
  }

  /**
   * Gestionar selección de proyectos (Auditor)
   */
  toggleProject(projectId: string): void {
    const current = new Set(this.selectedProjects());
    if (current.has(projectId)) {
      current.delete(projectId);
    } else {
      current.add(projectId);
    }
    this.selectedProjects.set(current);
    this.userForm.get("visibleProjectIds")?.setValue(Array.from(current));
  }

  isProjectSelected(projectId: string): boolean {
    return this.selectedProjects().has(projectId);
  }

  /**
   * Gestionar selección de clientes (Auditor)
   */
  toggleClient(clientId: string): void {
    const current = new Set(this.selectedClients());
    if (current.has(clientId)) {
      current.delete(clientId);
    } else {
      current.add(clientId);
    }
    this.selectedClients.set(current);
    this.userForm.get("visibleClientIds")?.setValue(Array.from(current));
  }

  isClientSelected(clientId: string): boolean {
    return this.selectedClients().has(clientId);
  }

  /**
   * Validar scope de Auditor
   */
  private validateAuditorScope(): void {
    const scope = this.visibilityScope();
    let error = "";

    if (scope === AuditorVisibilityScope.PER_PROJECT) {
      if (this.selectedProjects().size === 0) {
        error = "Debe seleccionar al menos un proyecto";
      }
    } else if (scope === AuditorVisibilityScope.PER_CLIENT) {
      if (this.selectedClients().size === 0) {
        error = "Debe seleccionar al menos un cliente";
      }
    }

    this.auditorScopeError.set(error);
  }

  /**
   * Toggle visibilidad de contraseña
   */
  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  /**
   * Etiquetas de roles
   */
  getRoleLabel(role: NewUserRole): string {
    const labels: Record<NewUserRole, string> = {
      [NewUserRole.OWNER]: "Owner (Propietario)",
      [NewUserRole.ADMIN_AREA]: "Admin Area",
      [NewUserRole.PENTESTER]: "Pentester",
      [NewUserRole.QA]: "QA",
      [NewUserRole.NORMAL_USER]: "Normal User",
      [NewUserRole.AUDITOR]: "Auditor",
    };
    return labels[role] || role;
  }

  getRoleDescription(role: NewUserRole): string {
    const descriptions: Record<NewUserRole, string> = {
      [NewUserRole.OWNER]: "Control total",
      [NewUserRole.ADMIN_AREA]: "Administrador de área",
      [NewUserRole.PENTESTER]: "Profesional pentesting",
      [NewUserRole.QA]: "Asegurador de calidad",
      [NewUserRole.NORMAL_USER]: "Usuario común",
      [NewUserRole.AUDITOR]: "Solo lectura",
    };
    return descriptions[role] || "";
  }

  /**
   * Enviar formulario
   */
  submitForm(): void {
    if (!this.userForm.valid) {
      this.snackBar.open("Formulario inválido", "Cerrar", { duration: 3000 });
      return;
    }

    this.isSubmitting.set(true);
    const formData = this.userForm.value;

    // Llamar al service
    (this.isEditMode()
      ? this.authService.updateUser(formData)
      : this.authService.createUser(formData)
    ).subscribe(
      (response: any) => {
        this.snackBar.open(
          `Usuario ${this.isEditMode() ? "actualizado" : "creado"} exitosamente`,
          "Cerrar",
          { duration: 3000 },
        );
        this.router.navigate(["/admin/users"]);
      },
      (error: any) => {
        this.snackBar.open(
          `Error: ${error.error?.message || "No se pudo procesar la solicitud"}`,
          "Cerrar",
          { duration: 5000 },
        );
        this.isSubmitting.set(false);
      },
    );
  }

  /**
   * Cancelar y volver
   */
  cancel(): void {
    this.router.navigate(["/admin/users"]);
  }
}

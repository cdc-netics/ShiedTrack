import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Project } from '../../shared/models';

/**
 * Servicio de gestión de Proyectos con Signals
 */
@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private readonly API_URL = 'http://localhost:3000/api/projects';
  
  // Estado local cacheado para evitar recargas innecesarias
  private projectsSignal = signal<Project[]>([]);
  private selectedProjectSignal = signal<Project | null>(null);
  private loadingSignal = signal<boolean>(false);
  
  // Exposicion de signals solo lectura para componentes
  public readonly projects = this.projectsSignal.asReadonly();
  public readonly selectedProject = this.selectedProjectSignal.asReadonly();
  public readonly loading = this.loadingSignal.asReadonly();

  constructor(private http: HttpClient) {}

  /**
   * Carga proyectos con filtros
   */
  loadProjects(filters?: { clientId?: string; status?: string }) {
    this.loadingSignal.set(true);
    
    let url = this.API_URL;
    if (filters) {
      // Serializa filtros simples como querystring
      const params = new URLSearchParams(filters as any).toString();
      url += `?${params}`;
    }

    return this.http.get<Project[]>(url).pipe(
      tap(projects => {
        // Cachea resultados y apaga el indicador de carga
        this.projectsSignal.set(projects);
        this.loadingSignal.set(false);
      })
    );
  }

  /**
   * Carga un proyecto por ID
   */
  loadProject(id: string) {
    this.loadingSignal.set(true);
    
    return this.http.get<Project>(`${this.API_URL}/${id}`).pipe(
      tap(project => {
        // Guarda la seleccion actual para vistas de detalle
        this.selectedProjectSignal.set(project);
        this.loadingSignal.set(false);
      })
    );
  }

  /**
   * Crea un nuevo proyecto
   */
  createProject(data: any) {
    return this.http.post<Project>(this.API_URL, data).pipe(
      tap(project => {
        // Inserta el nuevo proyecto al inicio del listado
        this.projectsSignal.update(projects => [project, ...projects]);
      })
    );
  }

  /**
   * Actualiza un proyecto
   */
  updateProject(id: string, data: any) {
    return this.http.put<Project>(`${this.API_URL}/${id}`, data).pipe(
      tap(updated => {
        // Actualiza el item en el listado cacheado
        this.projectsSignal.update(projects =>
          projects.map(p => p._id === id ? updated : p)
        );
        
        // Mantiene sincronizada la vista de detalle si aplica
        if (this.selectedProjectSignal()?._id === id) {
          this.selectedProjectSignal.set(updated);
        }
      })
    );
  }

  /**
   * Archiva un proyecto
   */
  archiveProject(id: string) {
    return this.http.delete<Project>(`${this.API_URL}/${id}`).pipe(
      tap(archived => {
        // Marca el proyecto actualizado en cache
        this.projectsSignal.update(projects =>
          projects.map(p => p._id === id ? archived : p)
        );
      })
    );
  }

  clearSelected(): void {
    // Limpia el detalle para evitar estados stale
    this.selectedProjectSignal.set(null);
  }
}

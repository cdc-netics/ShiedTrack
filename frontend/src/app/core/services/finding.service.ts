import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Finding, FindingUpdate } from '../../shared/models';
import { normalizeFinding, normalizeFindingUpdate } from '../../shared/utils/domain-normalizers';
import { environment } from '../../../environments/environment';

/**
 * Servicio de gestión de Hallazgos con Signals
 * State management reactivo para la vista de hallazgos
 */
@Injectable({
  providedIn: 'root'
})
export class FindingService {
  private readonly API_URL = `${environment.apiUrl}/findings`;
  
  // Signal para la lista de hallazgos
  private findingsSignal = signal<Finding[]>([]);
  
  // Signal para el hallazgo seleccionado
  private selectedFindingSignal = signal<Finding | null>(null);
  
  // Signal para el timeline del hallazgo
  private timelineSignal = signal<FindingUpdate[]>([]);
  
  // Señales de carga
  private loadingSignal = signal<boolean>(false);
  
  // Exponer signals como readonly
  public readonly findings = this.findingsSignal.asReadonly();
  public readonly selectedFinding = this.selectedFindingSignal.asReadonly();
  public readonly timeline = this.timelineSignal.asReadonly();
  public readonly loading = this.loadingSignal.asReadonly();

  constructor(private http: HttpClient) {}


  /**
   * Cierra múltiples hallazgos masivamente
   */
  bulkClose(findingIds: string[], closeReason = 'FIXED') {
    return this.http.post<number>(`${this.API_URL}/bulk-close`, { ids: findingIds, closeReason })
      .pipe(
        tap(() => {
          // O más simple, recargar todo:
          // this.loadFindings(); 
          this.findingsSignal.update(findings =>
            findings.filter(f => !findingIds.includes(f._id))
          );
        })
      );
  }

  /**
   * Carga hallazgos con filtros opcionales
   */
  loadFindings(filters?: {
    projectId?: string;
    status?: string;
    severity?: string;
    assignedTo?: string;
    includeClosed?: boolean;
  }) {
    this.loadingSignal.set(true);
    
    let url = this.API_URL;
    if (filters) {
      // Convierte filtros en querystring para el backend
      const params = new URLSearchParams(filters as any).toString();
      url += `?${params}`;
    }

    return this.http.get<Finding[]>(url).pipe(
      tap(findings => {
        // Cache de resultados y fin de carga
        this.findingsSignal.set(findings.map(finding => normalizeFinding(finding)));
        this.loadingSignal.set(false);
      })
    );
  }

  /**
   * Carga un hallazgo específico por ID
   */
  loadFinding(id: string) {
    this.loadingSignal.set(true);
    
    return this.http.get<Finding>(`${this.API_URL}/${id}`).pipe(
      tap(finding => {
        // Conserva el detalle en memoria para la vista
        this.selectedFindingSignal.set(normalizeFinding(finding));
        this.loadingSignal.set(false);
      })
    );
  }

  /**
   * Carga el timeline de un hallazgo
   */
  loadTimeline(findingId: string) {
    return this.http.get<FindingUpdate[]>(`${this.API_URL}/${findingId}/timeline`).pipe(
      // Mantiene el timeline localmente para render inmediato
      tap(timeline => this.timelineSignal.set(timeline.map(update => normalizeFindingUpdate(update))))
    );
  }

  /**
   * Crea un nuevo hallazgo
   */
  createFinding(data: any) {
    return this.http.post<Finding>(this.API_URL, data).pipe(
      tap(finding => {
        // Agregar a la lista local
        this.findingsSignal.update(findings => [normalizeFinding(finding), ...findings]);
      })
    );
  }

  /**
   * Actualiza un hallazgo
   */
  updateFinding(id: string, data: any) {
    return this.http.put<Finding>(`${this.API_URL}/${id}`, data).pipe(
      tap(updatedFinding => {
        const normalized = normalizeFinding(updatedFinding);

        // Actualizar en la lista local
        this.findingsSignal.update(findings =>
          findings.map(f => f._id === id ? normalized : f)
        );
        
        // Actualizar hallazgo seleccionado si es el mismo
        if (this.selectedFindingSignal()?._id === id) {
          this.selectedFindingSignal.set(normalized);
        }
      })
    );
  }

  /**
   * Cierra un hallazgo
   */
  closeFinding(id: string, data: { closeReason: string; comment?: string }) {
    return this.http.post<Finding>(`${this.API_URL}/${id}/close`, data).pipe(
      tap(closedFinding => {
        const normalized = normalizeFinding(closedFinding);

        // Actualizar en la lista local
        this.findingsSignal.update(findings =>
          findings.map(f => f._id === id ? normalized : f)
        );
        
        // Si el usuario esta en detalle, reflejar el cierre
        if (this.selectedFindingSignal()?._id === id) {
          this.selectedFindingSignal.set(normalized);
        }
      })
    );
  }

  /**
   * Agrega una actualización al timeline
   */
  createUpdate(data: {
    findingId: string;
    type: string;
    content: string;
    evidenceIds?: string[];
  }) {
    return this.http.post<FindingUpdate>(`${this.API_URL}/updates`, data).pipe(
      tap(update => {
        // Agregar al timeline local
        this.timelineSignal.update(timeline => [normalizeFindingUpdate(update), ...timeline]);
      })
    );
  }

  /**
   * Limpia el hallazgo seleccionado
   */
  clearSelected(): void {
    // Reinicia el estado cuando se cambia de vista
    this.selectedFindingSignal.set(null);
    this.timelineSignal.set([]);
  }
}

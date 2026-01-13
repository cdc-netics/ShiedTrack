import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface SystemBranding {
  appName: string;
  faviconUrl?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

/**
 * Servicio de gestión de branding del sistema
 * Permite configurar favicon, logo y colores desde la UI
 */
@Injectable({
  providedIn: 'root'
})
export class BrandingService {
  private readonly apiUrl = '/api/system-config/branding';
  private brandingSubject = new BehaviorSubject<SystemBranding>({
    appName: 'ShieldTrack'
  });

  public branding$ = this.brandingSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadBranding();
  }

  /**
   * Carga la configuración de branding desde el backend
   */
  loadBranding(): void {
    this.http.get<SystemBranding>(this.apiUrl).subscribe({
      next: (branding) => {
        this.brandingSubject.next(branding);
        this.applyBranding(branding);
      },
      error: () => {
        // Si falla, usa valores por defecto
        this.applyBranding(this.brandingSubject.value);
      }
    });
  }

  /**
   * Actualiza la configuración de branding
   */
  updateBranding(branding: Partial<SystemBranding>): Observable<SystemBranding> {
    return this.http.put<SystemBranding>(this.apiUrl, branding).pipe(
      tap((updated) => {
        this.brandingSubject.next(updated);
        this.applyBranding(updated);
      })
    );
  }

  /**
   * Aplica el branding al DOM
   */
  private applyBranding(branding: SystemBranding): void {
    // Actualizar favicon
    if (branding.faviconUrl) {
      this.updateFavicon(branding.faviconUrl);
    }

    // Actualizar título
    document.title = branding.appName || 'ShieldTrack';

    // Actualizar colores CSS
    if (branding.primaryColor) {
      document.documentElement.style.setProperty('--primary-color', branding.primaryColor);
    }
    if (branding.secondaryColor) {
      document.documentElement.style.setProperty('--secondary-color', branding.secondaryColor);
    }
  }

  /**
   * Actualiza el favicon dinámicamente
   */
  private updateFavicon(url: string): void {
    const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'icon';
    link.href = url;
    document.getElementsByTagName('head')[0].appendChild(link);
  }

  /**
   * Sube un archivo de favicon
   */
  uploadFavicon(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('favicon', file);
    return this.http.post<{ url: string }>(`${this.apiUrl}/favicon`, formData);
  }

  /**
   * Sube un archivo de logo
   */
  uploadLogo(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('logo', file);
    return this.http.post<{ url: string }>(`${this.apiUrl}/logo`, formData);
  }
}

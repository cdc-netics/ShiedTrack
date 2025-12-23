import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { User } from '../../shared/models';

/**
 * Servicio de autenticación con Angular Signals
 * Gestiona el estado de autenticación de forma reactiva
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:3000/api/auth';
  
  // Signal para el usuario actual
  private currentUserSignal = signal<User | null>(null);
  
  // Signal para el token
  private tokenSignal = signal<string | null>(null);
  
  // Computed signals para estado derivado
  public readonly currentUser = this.currentUserSignal.asReadonly();
  public readonly isAuthenticated = computed(() => !!this.tokenSignal());
  public readonly isAdmin = computed(() => {
    const user = this.currentUserSignal();
    return user?.role === 'OWNER' || user?.role === 'PLATFORM_ADMIN';
  });

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Cargar token desde localStorage al iniciar
    this.loadTokenFromStorage();
  }

  /**
   * Carga el token almacenado y obtiene perfil del usuario
   */
  private loadTokenFromStorage(): void {
    const token = localStorage.getItem('shieldtrack_token');
    if (token) {
      // Primero restaura el token para habilitar llamadas autenticadas
      this.tokenSignal.set(token);
      // Obtener perfil del usuario
      this.loadUserProfile();
    }
  }

  /**
   * Obtiene el perfil del usuario actual
   */
  private loadUserProfile(): void {
    this.http.get<User>(`${this.API_URL}/profile`)
      .subscribe({
        next: (user) => this.currentUserSignal.set(user),
        error: (err) => {
          console.error('Error cargando perfil:', err);
          // Solo hacer logout si el token es inválido (401)
          if (err.status === 401) {
            this.logout();
          }
        }
      });
  }

  /**
   * Carga el perfil del usuario de forma segura
   */
  loadCurrentUser(): void {
    if (this.tokenSignal()) {
      this.loadUserProfile();
    }
  }

  /**
   * Inicia sesión
   */
  login(email: string, password: string, mfaToken?: string) {
    return this.http.post<{ accessToken: string; user: User }>(
      `${this.API_URL}/login`,
      { email, password, mfaToken }
    ).pipe(
      tap(response => {
        // Persistencia basica de sesion
        this.tokenSignal.set(response.accessToken);
        this.currentUserSignal.set(response.user);
        localStorage.setItem('shieldtrack_token', response.accessToken);
        this.router.navigate(['/dashboard']);
      })
    );
  }

  /**
   * Cierra sesión
   */
  logout(): void {
    // Limpieza total de sesion local
    this.tokenSignal.set(null);
    this.currentUserSignal.set(null);
    localStorage.removeItem('shieldtrack_token');
    this.router.navigate(['/login']);
  }

  /**
   * Obtiene el token actual
   */
  getToken(): string | null {
    return this.tokenSignal();
  }

  /**
   * Configura MFA
   */
  setupMfa() {
    // Inicia el flujo para mostrar QR y secreto
    return this.http.post<{ secret: string; qrCode: string }>(
      `${this.API_URL}/mfa/setup`,
      {}
    );
  }

  /**
   * Habilita MFA
   */
  enableMfa(token: string) {
    return this.http.post<{ success: boolean }>(
      `${this.API_URL}/mfa/enable`,
      { token }
    ).pipe(
      tap(() => {
        // Actualizar usuario con MFA habilitado
        const user = this.currentUserSignal();
        if (user) {
          this.currentUserSignal.set({ ...user, mfaEnabled: true });
        }
      })
    );
  }
}

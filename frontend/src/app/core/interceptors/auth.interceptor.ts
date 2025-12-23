import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Interceptor funcional para agregar JWT a las peticiones HTTP
 * Angular 17+ functional interceptors
 * 
 * IMPORTANTE: NO usar inject(AuthService) aquí para evitar dependencia circular
 * El AuthService usa HttpClient, que usa este interceptor
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Acceder directamente al token desde localStorage
  const token = localStorage.getItem('shieldtrack_token');

  // Si hay token, clonamos la request y agregamos el header Authorization
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req);
};

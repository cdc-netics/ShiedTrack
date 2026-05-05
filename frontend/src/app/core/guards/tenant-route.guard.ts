import { Injectable, inject } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment'; // Corrected path for environment import
//import { environment } from '/frontend/src/environments/environment.prod.ts'; // Importing the production environment configuration
                      
@Injectable({
  providedIn: 'root'
})
export class TenantRouteGuard implements CanActivate {
  private router = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    // Check if tenant section is enabled in the environment configuration
    if (environment.enableTenantSection) {
      return true; // Allow access
    } else {
      // Redirect to dashboard or another appropriate route if disabled
      return this.router.createUrlTree(['/dashboard']);
    }
  }
}

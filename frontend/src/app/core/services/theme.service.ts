import { Injectable } from '@angular/core';

/**
 * Servicio de theme/white-labeling
 * Aplica colores y logo dinámicamente usando variables CSS
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private logoUrl = 'assets/logo.svg';

  applyTheme(theme: { primaryColor?: string; logoUrl?: string }): void {
    const root = document.documentElement;

    if (theme.primaryColor) {
      root.style.setProperty('--primary-color', theme.primaryColor);
    }

    if (theme.logoUrl) {
      this.logoUrl = theme.logoUrl;
    }
  }

  get currentLogo(): string {
    return this.logoUrl;
  }
}

import { Injectable } from '@angular/core';

/**
 * Servicio de theme/white-labeling
 * Aplica colores y logo dinámicamente usando variables CSS
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private static readonly DEFAULT_LOGO = '/assets/logo.svg';
  private logoUrl = ThemeService.DEFAULT_LOGO;

  applyTheme(theme: { primaryColor?: string; logoUrl?: string }): void {
    const root = document.documentElement;

    if (theme.primaryColor) {
      root.style.setProperty('--primary-color', theme.primaryColor);
    }

    if (theme.logoUrl && theme.logoUrl.trim()) {
      this.logoUrl = this.normalizeLogoUrl(theme.logoUrl.trim());
    } else {
      this.logoUrl = ThemeService.DEFAULT_LOGO;
    }
  }

  get currentLogo(): string {
    return this.logoUrl;
  }

  private normalizeLogoUrl(url: string): string {
    if (/^https?:\/\//i.test(url) || url.startsWith('/assets/') || url.startsWith('assets/')) {
      if (url.startsWith('assets/')) {
        return `/${url}`;
      }
      return url;
    }
    if (url.startsWith('/')) {
      return url;
    }
    return `/${url}`;
  }
}

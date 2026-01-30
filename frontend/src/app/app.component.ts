import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BrandingService } from './core/services/branding.service';

/**
 * Componente raíz de ShieldTrack
 * Standalone Component (Angular 17+)
 * Carga branding dinámico al iniciar
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <router-outlet />
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'ShieldTrack';
  private brandingService = inject(BrandingService);

  ngOnInit(): void {
    // Cargar y aplicar branding al iniciar la aplicación
    this.brandingService.loadBranding();
  }
}

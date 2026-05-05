import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../services/auth.service';
import { ThemeService } from '../services/theme.service';
import { environment } from '../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-main-layout',
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent implements OnInit, AfterViewInit {
  private readonly http = inject(HttpClient);
  currentTenant: { name?: string; displayName?: string } | null = null;

  protected readonly environment = environment;

  constructor(
    public authService: AuthService,
    public theme: ThemeService,
  ) {}

  canAccessNotifications(): boolean {
    const role = this.authService.currentUser()?.role;
    return (
      role === 'OWNER' ||
      role === 'PLATFORM_ADMIN' ||
      role === 'CLIENT_ADMIN'
    );
  }

  userFullName(): string {
    const u = this.authService.currentUser();
    if (!u) {
      return 'Usuario';
    }
    const parts = [u.firstName, u.lastName].filter(
      (p): p is string => !!p && String(p).trim().length > 0,
    );
    if (parts.length > 0) {
      return parts.join(' ');
    }
    const email = (u as { email?: string }).email;
    return email?.trim() || 'Usuario';
  }

  tenantDisplayName(): string {
    if (!this.currentTenant) {
      return '';
    }
    const d = this.currentTenant.displayName?.trim();
    const n = this.currentTenant.name?.trim();
    return d || n || 'Cliente';
  }

  tenantTooltip(): string {
    return `Cliente actual: ${this.tenantDisplayName()}`;
  }

  ngOnInit(): void {
    const clientSettings = (this.authService.currentUser() as { clientSettings?: { primaryColor?: string; logoUrl?: string } })?.clientSettings;
    this.theme.applyTheme({
      primaryColor: clientSettings?.primaryColor,
      logoUrl: clientSettings?.logoUrl,
    });
    void this.loadCurrentTenant();
  }

  async loadCurrentTenant(): Promise<void> {
    const user = this.authService.currentUser();
    const clientId = (user as { clientId?: string })?.clientId;

    if (!clientId) {
      return;
    }

    try {
      this.currentTenant = await firstValueFrom(
        this.http.get<{ name?: string; displayName?: string }>(
          `${environment.apiUrl}/clients/${clientId}`,
        ),
      );
    } catch (error) {
      console.error('Error al cargar tenant actual:', error);
      this.currentTenant = null;
    }
  }

  async ngAfterViewInit(): Promise<void> {
    try {
      const anime = (await import('animejs')).default;
      anime({
        targets: 'main.app-main',
        opacity: [0, 1],
        translateY: [12, 0],
        duration: 450,
        easing: 'easeOutQuad',
      });
    } catch (error) {
      console.warn('Animacion no cargada (anime.js):', error);
    }
  }
}

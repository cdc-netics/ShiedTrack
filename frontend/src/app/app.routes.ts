import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

/**
 * Definición de rutas de la aplicación
 * Desktop-First: Optimizado para pantallas ≥1366px
 */
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./core/layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'clients',
        loadComponent: () => import('./features/clients/client-list/client-list.component').then(m => m.ClientListComponent)
      },
      {
        path: 'projects',
        loadComponent: () => import('./features/projects/project-list/project-list.component').then(m => m.ProjectListComponent)
      },
      {
        path: 'projects/:id',
        loadComponent: () => import('./features/projects/project-detail/project-detail.component').then(m => m.ProjectDetailComponent)
      },
      {
        path: 'findings',
        loadComponent: () => import('./features/findings/finding-list/finding-list.component').then(m => m.FindingListComponent)
      },
      {
        path: 'findings/new',
        loadComponent: () => import('./features/findings/finding-wizard').then(m => m.FindingWizardComponent)
      },
      {
        path: 'findings/:id',
        loadComponent: () => import('./features/findings/finding-detail/finding-detail.component').then(m => m.FindingDetailComponent)
      },
      {
        path: 'admin/users',
        loadComponent: () => import('./features/admin/users/user-list-improved.component').then(m => m.UserListImprovedComponent)
      },
      {
        path: 'admin/areas',
        loadComponent: () => import('./features/admin/areas/area-list.component').then(m => m.AreaListComponent)
      },
      {
        path: 'admin/templates',
        loadComponent: () => import('./features/admin/templates/template-list.component').then(m => m.TemplateListComponent)
      },
      {
        path: 'admin/audit',
        loadComponent: () => import('./features/admin/audit/audit-log.component').then(m => m.AuditLogComponent)
      },
      {
        path: 'admin/config',
        loadComponent: () => import('./features/admin/config/system-config.component').then(m => m.SystemConfigComponent)
      },
      {
        path: 'admin/branding',
        loadComponent: () => import('./features/admin/branding/branding-config.component').then(m => m.BrandingConfigComponent)
      },
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

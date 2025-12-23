import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

/**
 * Bootstrap de la aplicación Angular 17+
 * Usa standalone components sin NgModule
 */
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));

import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { JwtHelperService, JWT_OPTIONS } from '@auth0/angular-jwt'; 

import { routes } from './app.routes';
import { authInterceptor, jsonInterceptor, loggingInterceptor } from './shared/interceptors/auth.interceptor';

// Función para obtener la configuración de JWT (para mantener la lógica separada)
export function jwtOptionsFactory() {
  return {
    tokenGetter: () => localStorage.getItem('salesapp_token'), 
    allowedDomains: ['localhost:3000'],
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    
    { provide: JWT_OPTIONS, useValue: jwtOptionsFactory() },
    JwtHelperService, // Se provee el servicio. Ahora puede ser inyectado.
    
    provideHttpClient(withInterceptors([
      authInterceptor, // TOKEN JWT automático (si estás usando un interceptor de JWT)
      jsonInterceptor,
      loggingInterceptor // Para desarrollo (logs) 
    ]))
  ]
};
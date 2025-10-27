// src/app/shared/interceptors/auth.interceptor.ts

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, tap, throwError } from 'rxjs';
import { AuthService } from '../../features/auth/services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Obtener el token del servicio de autenticación
  const token = authService.getToken();

  // Clonar la petición y agregar el header de autorización si hay token
  let authReq = req;
  
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Auth Interceptor: Token agregado a la petición', {
      url: req.url,
      method: req.method
    });
  }

  // Continuar con la petición y manejar errores
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      
      // Error 401: No autorizado (token inválido o expirado)
      if (error.status === 401) {
        console.error('Auth Interceptor: Error 401 - Token inválido o expirado');
        
        // Limpiar la sesión
        authService.logout();

        if (router.url !== '/auth/login') {
          // Redirigir al login
          router.navigate(['/auth/login'], {
            queryParams: { sessionExpired: 'true' }
          });
        }
      }

      // Error 403: Prohibido (sin permisos)
      if (error.status === 403) {
        console.error('❌ Auth Interceptor: Error 403 - Sin permisos');
        router.navigate(['/access-denied']);
      }

      // Error 0: No hay conexión con el servidor
      if (error.status === 0) {
        console.error('Auth Interceptor: Error de red - No se pudo conectar con el servidor');
        //this.snackbar.open('No se pudo conectar con el servidor', 'Cerrar', {duracion: 3000});
      }

      return throwError(() => new Error(error.message));
    })
  );
};

/**
 * Interceptor para agregar el tipo de contenido JSON por defecto
 */
export const jsonInterceptor: HttpInterceptorFn = (req, next) => {
  // Si la petición ya tiene Content-Type o es FormData, no modificar
  if (req.headers.has('Content-Type') || req.body instanceof FormData) {
    return next(req);
  }

  // Agregar Content-Type: application/json por defecto
  const jsonReq = req.clone({
    setHeaders: {
      'Content-Type': 'application/json'
    }
  });

  return next(jsonReq);
};

/**
 * Interceptor para logging de peticiones (útil en desarrollo)
 */
export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const startTime = Date.now();

  console.log(`HTTP ${req.method} → ${req.url}`, {
    body: req.body,
    headers: req.headers.keys()
  });

  return next(req).pipe(

    tap((event) => {
      const elapsedTime = Date.now() - startTime;
      console.log(`HTTP ${req.method} → ${req.url} completado (${elapsedTime}ms)`, event);
    }),
    catchError((error) => {
      const elapsedTime = Date.now() - startTime;
      console.error(`HTTP ${req.method} → ${req.url} [${error.status}] (${elapsedTime}ms)`, error);
      return throwError(() => error);
    })
  );
};
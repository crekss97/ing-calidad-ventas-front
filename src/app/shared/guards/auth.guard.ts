// src/app/shared/guards/auth.guard.ts

import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';

/**
 * Guard para proteger rutas que requieren autenticación
 * 
 * Uso:
 * {
 *   path: 'dashboard',
 *   component: DashboardComponent,
 *   canActivate: [authGuard]
 * }
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar si el usuario está autenticado
  if (authService.isAuthenticated) {
    console.log('Usuario autenticado, permite acceso');
    return true;
  }

  // Si no está autenticado, guardar la URL intentada para redirigir después del login
  console.warn('Usuario no autenticado, redirigiendo a login');
  
  // Guardar la URL que intentó acceder
  const returnUrl = state.url;
  localStorage.setItem('returnUrl', returnUrl);

  // Redirigir al login
  router.navigate(['/auth/login'], {
    queryParams: { returnUrl: returnUrl }
  });

  return false;
};

/**
 * Guard para rutas públicas que NO deben ser accesibles si ya estás autenticado
 * (Ej: Login, Register)
 * 
 * Uso:
 * {
 *   path: 'login',
 *   component: LoginComponent,
 *   canActivate: [publicOnlyGuard]
 * }
 */
export const publicOnlyGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si ya está autenticado, redirigir al dashboard
  if (authService.isAuthenticated) {
    console.log('✅ Public Only Guard: Usuario autenticado, redirigiendo a dashboard');
    router.navigate(['/dashboard']);
    return false;
  }

  console.log('✅ Public Only Guard: Usuario no autenticado, acceso permitido');
  return true;
};
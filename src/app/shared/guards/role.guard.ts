// src/app/shared/guards/role.guard.ts

import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';
import { UserRole } from '../../features/auth/models/user.model';

/**
 * Guard para proteger rutas por rol de usuario
 * 
 * Uso en las rutas:
 * {
 *   path: 'admin',
 *   component: AdminComponent,
 *   canActivate: [authGuard, roleGuard],
 *   data: { roles: [UserRole.ADMIN] }
 * }
 * 
 * O para múltiples roles:
 * data: { roles: [UserRole.ADMIN, UserRole.SELLER] }
 */
export const roleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Obtener el usuario actual
  const currentUser = authService.currentUserValue;

  // Si no hay usuario (no debería pasar si se usa junto con authGuard)
  if (!currentUser) {
    console.error('Role Guard: No hay usuario autenticado');
    router.navigate(['/auth/login']);
    return false;
  }

  // Obtener los roles permitidos de la configuración de la ruta
  const allowedRoles = route.data['roles'] as UserRole[];

  // Si no se especificaron roles, permitir acceso
  if (!allowedRoles || allowedRoles.length === 0) {
    console.warn('Role Guard: No se especificaron roles requeridos, permitiendo acceso');
    return true;
  }

  // Verificar si el usuario tiene alguno de los roles permitidos
  const hasRequiredRole = allowedRoles.includes(currentUser.rol);

  if (hasRequiredRole) {
    console.log(`Role Guard: Usuario con rol ${currentUser.rol} tiene acceso`);
    return true;
  }

  // Si no tiene el rol requerido, denegar acceso
  console.error(`Role Guard: Usuario con rol ${currentUser.rol} NO tiene acceso. Roles requeridos: ${allowedRoles.join(', ')}`);
  
  // Redirigir a página de acceso denegado o dashboard
  router.navigate(['/access-denied']);
  
  return false;
};

/**
 * Helper function para verificar si un usuario tiene un rol específico
 * 
 * Uso en componentes:
 * if (hasRole(UserRole.ADMIN)) {
 *   // Mostrar funcionalidad de admin
 * }
 */
export function hasRole(role: UserRole): boolean {
  const authService = inject(AuthService);
  const currentUser = authService.currentUserValue;
  return currentUser?.rol === role;
}

/**
 * Helper function para verificar si un usuario tiene alguno de varios roles
 * 
 * Uso en componentes:
 * if (hasAnyRole([UserRole.ADMIN, UserRole.SELLER])) {
 *   // Mostrar funcionalidad
 * }
 */
export function hasAnyRole(roles: UserRole[]): boolean {
  const authService = inject(AuthService);
  const currentUser = authService.currentUserValue;
  return currentUser ? roles.includes(currentUser.rol) : false;
}
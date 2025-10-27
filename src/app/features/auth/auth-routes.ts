import { Routes } from '@angular/router';
import { RegisterComponent } from './components/register/register';
import { LoginComponent } from './components/login/login';
import { publicOnlyGuard } from '../../shared/guards/auth.guard';

export const AuthRoutes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [publicOnlyGuard],
    data: { title: 'Iniciar Sesión - Gestión de Ventas'}
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [publicOnlyGuard],
    data: { title: 'Crear Cuenta - Gestión de Ventas' }
  },
]

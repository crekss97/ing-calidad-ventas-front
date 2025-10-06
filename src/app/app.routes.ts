import { Routes } from '@angular/router';
import { AccessDeniedComponent } from './shared/components/access-denied/access-denied.component';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
    },
    {
        path: 'auth',
        loadChildren: () => import('./features/auth/auth-routes').then(m => m.AuthRoutes)
    },
    {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard-routes').then(m => m.DashboardRoutes)
    },
    // {
    //     path: 'access-denied',
    //     component: AccessDeniedComponent,
    //     data: { title: 'Acceso Denegado' }
    // }
];

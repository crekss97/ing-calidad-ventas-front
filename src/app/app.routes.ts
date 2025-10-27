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
    {
        path: 'profile',
        loadChildren: () => import('./features/profile/profile-routes').then(m => m.ProfileRoutes)
    },
    {
        path: 'products',
        loadChildren: () => import('./features/products/products.routes').then(m => m.ProductsRoutes)
    },
    {
        path: 'lines',
        loadChildren: () => import('./features/lines/lines.routes').then(m => m.LineRoutes)
    },
    {
        path: 'sales',
        loadChildren: () => import('./features/sales/sales.routes').then(m => m.SalesRoutes)
    },
    {   path: 'suppliers',
        loadChildren: () => import('./features/suppliers/suppliers-routes').then(m => m.SupplierRoutes)

    },
    {
        path: 'access-denied',
        component: AccessDeniedComponent,
        data: { title: 'Acceso Denegado' }
    },
    {
        path: '**', redirectTo: 'dashboard'
    }
];

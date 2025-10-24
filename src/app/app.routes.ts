import { Routes } from '@angular/router';
import { AccessDeniedComponent } from './shared/components/access-denied/access-denied.component';
import { MarcaListComponent } from './features/marca/models/marca-list-component/marca-list-component';

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
        path: 'products',
        loadChildren: () => import('./features/products/products.routes').then(m => m.ProductsRoutes)
    },
    {path: 'marca', component: MarcaListComponent}
    
    {
        path: 'lines',
        loadChildren: () => import('./features/lines/lines.routes').then(m => m.LineRoutes)
    },

    // {
    //     path: 'access-denied',
    //     component: AccessDeniedComponent,
    //     data: { title: 'Acceso Denegado' }
    // }
];

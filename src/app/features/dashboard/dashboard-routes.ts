import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard';
import { authGuard } from '../../shared/guards/auth.guard';

export const DashboardRoutes: Routes = [
    {
        path: '',
        component: DashboardComponent,
        //canActivate: [authGuard],
        data: { title: 'Dashboard' }
    }
]
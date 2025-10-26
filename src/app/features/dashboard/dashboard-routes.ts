import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard';
import { authGuard } from '../../shared/guards/auth.guard';
import { UserRole } from '../auth/models/user.model';

export const DashboardRoutes: Routes = [
    {
        path: '',
        component: DashboardComponent,
        canActivate: [authGuard],
        data: { 
            roles: (UserRole.ADMIN),
            title: 'Dashboard'
        }
    }
]
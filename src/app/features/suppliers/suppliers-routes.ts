import { Routes } from "@angular/router";
import { SuppliersComponent } from "./suppliers";
import { authGuard } from "../../shared/guards/auth.guard";
import { UserRole } from "../auth/models/user.model";

export const SupplierRoutes: Routes = [
    {
        path: '',
        component: SuppliersComponent,
        canActivate: [authGuard],
        data: {
            roles: (UserRole.ADMIN),
            title: 'Proveedores'
        }
    }
]
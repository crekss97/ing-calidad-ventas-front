import { Routes } from "@angular/router";
import { SuppliersComponent } from "./suppliers";
import { authGuard } from "../../shared/guards/auth.guard";

export const SupplierRoutes: Routes = [
    {
        path: '',
        component: SuppliersComponent,
        canActivate: [authGuard],
        data: {
            title: 'Proveedores'
        }
    }
]
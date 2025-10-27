import { Routes } from "@angular/router";
import { RegistrarVentaComponent } from "./model/component/sale-form/sale-form";

export const SalesRoutes: Routes = [
  {
    path: 'new',
    component: RegistrarVentaComponent,
    data: { title: 'Nueva venta - VentasPro' },
  },
]
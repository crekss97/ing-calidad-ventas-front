import { Routes } from "@angular/router";
import { LineListComponent } from "./models/components/line-list-component/line-list-component";

export const LineRoutes: Routes = [
  {
    path: '',
    component: LineListComponent,
    data: { title: 'Lineas - VentasPro' },
  }]

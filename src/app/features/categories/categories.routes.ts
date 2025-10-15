import { Routes } from "@angular/router";
import { CategoryListComponent } from "./models/components/category-list-component/category-list-component";

export const CategoryRoutes: Routes = [
  {
    path: '',
    component: CategoryListComponent,
    data: { title: 'Lineas - VentasPro' },
  }]

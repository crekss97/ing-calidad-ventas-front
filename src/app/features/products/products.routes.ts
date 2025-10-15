import { Routes } from '@angular/router';
import { ProductsListComponent } from '../products/models/components/products-list/products-list-component';
import { authGuard } from '../../shared/guards/auth.guard';
import { roleGuard } from '../../shared/guards/role.guard';
import { UserRole } from '../auth/models/user.model';

export const ProductsRoutes: Routes = [
  {
    path: '',
    component: ProductsListComponent,
    data: { title: 'Productos - VentasPro' },
  },
  // path: '',
  // canActivate: [authGuard],
  // children: [

  //   {
  //     path: 'new',
  //     loadComponent: () =>
  //       import('../products/models/components/products-list/products-form-component')
  //         .then(m => m.ProductFormComponent),
  //     canActivate: [roleGuard],
  //     data: {
  //       title: 'Nuevo Producto - SalesHub',
  //       roles: [UserRole.ADMIN, UserRole.SELLER]
  //     }
  //   },
  //   {
  //     path: ':id',
  //     loadComponent: () =>
  //       import('./components/product-detail/product-detail.component')
  //         .then(m => m.ProductDetailComponent),
  //     data: { title: 'Detalle de Producto - SalesHub' }
  //   },
  //   {
  //     path: ':id/edit',
  //     loadComponent: () =>
  //       import('./components/product-form/product-form.component')
  //         .then(m => m.ProductFormComponent),
  //     canActivate: [roleGuard],
  //     data: {
  //       title: 'Editar Producto - SalesHub',
  //       roles: [UserRole.ADMIN, UserRole.SELLER]
  //     }
  //   }
  //]
];

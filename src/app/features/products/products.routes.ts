import { Routes } from '@angular/router';
import { ProductsListComponent } from '../products/models/components/products-list/products-list-component';

export const ProductsRoutes: Routes = [
  {
    path: '',
    component: ProductsListComponent,
    //canActivate: [authGuard],
    data: { title: 'Productos - VentasPro' },
  },
    {
      path: 'new',
      loadComponent: () =>
        import('../products/models/components/product-form/product-form-component')
          .then(m => m.ProductFormComponent),
      data: {
        title: 'Nuevo Producto - VentasPro',
      }
    },
    // {
    //   path: ':id',
    //   loadComponent: () =>
    //     import('./components/product-detail/product-detail.component')
    //       .then(m => m.ProductDetailComponent),
    //   data: { title: 'Detalle de Producto - SalesHub' }
    // },
    // {
    //   path: ':id/edit',
    //   loadComponent: () =>
    //     import('./components/product-form/product-form.component')
    //       .then(m => m.ProductFormComponent),
    //   canActivate: [roleGuard],
    //   data: {
    //     title: 'Editar Producto - SalesHub',
    //     roles: [UserRole.ADMIN, UserRole.SELLER]
    //   }
    // }
];

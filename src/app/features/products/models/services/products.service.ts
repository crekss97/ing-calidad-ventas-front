import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, of, map } from 'rxjs';
import { 
  Product, 
  Brand, 
  Line, 
  ProductFilters, 
  PaginatedResponse,
  ProductFormData 
} from '../../models/product.models';
import { AuthService } from '../../../auth/services/auth.service';
import { environment } from '../../../../environments/environments';

interface BackendProductRequest {
  nombre: string;
  descripcion: string;
  stock: number;
  precio: number; 
  lineaId: number;
  proveedorId: number;
  estadoId: number;
}

interface BackendProduct {
  id: number;
  nombre: string;
  descripcion: string;
  stock?: number;
  precio: number;
  linea?: {
    id: number;
    nombre: string;
    marcaId?: number;
    marca?: {
      id: number;
      nombre: string;
    };
  };
  lineaId?: number;
  proveedorId?: number;
  estadoId?: number;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})



export class ProductsService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = environment.vercelUrl;
  // State con Signals
  private productsState = signal<Product[]>([]);
  private brandsState = signal<Brand[]>([]);
  private linesState = signal<Line[]>([]);
  private loadingState = signal(false);
  private errorState = signal<string | null>(null);
  private selectedProductState = signal<Product | null>(null);

  // Public readonly signals
  products = this.productsState.asReadonly();
  brands = this.brandsState.asReadonly();
  lines = this.linesState.asReadonly();
  loading = this.loadingState.asReadonly();
  error = this.errorState.asReadonly();
  selectedProduct = this.selectedProductState.asReadonly();

  // Computed signals
  productsCount = computed(() => this.productsState().length);
  
  lowStockProducts = computed(() => 
    this.productsState().filter(p => p.stock < 10)
  );

  activeProducts = computed(() => 
    this.productsState().filter(p => p.isActive)
  );

  productsByBrand = computed(() => {
    const products = this.productsState();
    const grouped = new Map<string, Product[]>();
    
    products.forEach(product => {
      const brandId = product.brandId;
      if (!grouped.has(brandId)) {
        grouped.set(brandId, []);
      }
      grouped.get(brandId)!.push(product);
    });
    
    return grouped;
  });

  // Líneas filtradas por marca seleccionada
  linesByBrand = (brandId: string) => computed(() => 
    this.linesState().filter(line => line.brandId === brandId)
  );

  constructor() {}

  private transformToBackendFormat(data: ProductFormData): BackendProductRequest {
    return {
      nombre: data.name,
      descripcion: data.description,
      stock: data.stock,
      precio: data.price,
      lineaId: parseInt(data.lineId),
      proveedorId: 1,
      estadoId: 1
    }
  }

  private transformFromBackendFormat(backendProduct: BackendProduct): Product {
    // Extraer lineaId: puede venir como objeto anidado o como ID directo
    const lineaId = backendProduct.linea?.id || backendProduct.lineaId || 0;
    
    // Extraer brandId: puede venir desde linea.marcaId o linea.marca.id
    const brandId = backendProduct.linea?.marcaId || 
                    backendProduct.linea?.marca?.id || 
                    1; // valor por defecto

    return {
      id: backendProduct.id.toString(),
      name: backendProduct.nombre,
      description: backendProduct.descripcion,
      price: backendProduct.precio,
      stock: backendProduct.stock || 0,
      brandId: brandId.toString(),
      lineId: lineaId.toString(),
      sku: `PROD-${backendProduct.id}`,
      isActive: backendProduct.estadoId === 1,
      createdAt: backendProduct.createdAt ? new Date(backendProduct.createdAt) : new Date(),
      updatedAt: backendProduct.updatedAt ? new Date(backendProduct.updatedAt) : new Date(),
      images: []
    }
  }

  // ==================== PRODUCTS ====================

  getProducts(filters?: ProductFilters): Observable<PaginatedResponse<Product>> {
    this.loadingState.set(true);
    this.errorState.set(null);

    let params = new HttpParams();
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.brandId) params = params.set('brandId', filters.brandId);
    if (filters?.lineId) params = params.set('lineId', filters.lineId);
    if (filters?.minPrice) params = params.set('minPrice', filters.minPrice.toString());
    if (filters?.maxPrice) params = params.set('maxPrice', filters.maxPrice.toString());
    if (filters?.inStock !== undefined) params = params.set('inStock', filters.inStock.toString());

    return this.http.get<BackendProduct[]>(`${this.apiUrl}/producto`, { params }).pipe(
      map(backendProducts => {

        console.log('Productos del backend', backendProducts);

        const products = backendProducts.map(bp => this.transformFromBackendFormat(bp));

        this.productsState.set(products);
        this.loadingState.set(false);

        return {
          data: products,
          total: products.length,
          page: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        } as PaginatedResponse<Product>;
      }),

      tap(() =>{}),
      catchError(error => {
        console.error('Error al cargar productos:', error);
        this.errorState.set(error.message || 'Error al cargar productos');
        this.loadingState.set(false);
        return of({ 
          data: [], 
          total: 0, 
          page: 1, 
          totalPages: 0, 
          hasNextPage: false, 
          hasPreviousPage: false 
        });
      })
    );
  }

  getProductById(id: string): Observable<BackendProduct> {
    this.loadingState.set(true);
    
    return this.http.get<BackendProduct>(`${this.apiUrl}/products/${id}`).pipe(
      tap(backendProduct => {
        const product = this.transformFromBackendFormat(backendProduct);
        this.selectedProductState.set(product);
        this.loadingState.set(false);
      }),
      catchError(error => {
        this.errorState.set(error.message || 'Error al cargar producto');
        this.loadingState.set(false);
        throw error;
      })
    );
  }

  createProduct(data: ProductFormData): Observable<BackendProduct> {
    this.loadingState.set(true);
    
    const backendData = this.transformToBackendFormat(data);

    console.log('Enviando datos al backend:', backendData);

    return this.http.post<BackendProduct>(`${this.apiUrl}/products`, backendData).pipe(
      tap(backendProduct => {
        console.log('Producto creado:', backendProduct)
        // Agregar el nuevo producto al estado
        const product = this.transformFromBackendFormat(backendProduct)
        this.productsState.update(products => [...products, product]);
        this.loadingState.set(false);
      }),
      catchError(error => {
        console.log('Error al crear producto:', error)
        this.errorState.set(error.message || 'Error al crear producto');
        this.loadingState.set(false);
        throw error;
      })
    );
  }

  updateProduct(id: string, data: Partial<ProductFormData>): Observable<BackendProduct> {
    this.loadingState.set(true);
    
    // Transformar al formato del backend
    const backendData = this.transformToBackendFormat(data as ProductFormData);
    
    console.log('📤 Actualizando producto:', backendData);
    
    return this.http.put<BackendProduct>(`${this.apiUrl}/productos/${id}`, backendData).pipe(
      tap(backendProduct => {
        console.log('✅ Producto actualizado:', backendProduct);
        
        // Transformar y actualizar el estado
        const updatedProduct = this.transformFromBackendFormat(backendProduct);
        this.productsState.update(products =>
          products.map(p => p.id === id ? updatedProduct : p)
        );
        this.selectedProductState.set(updatedProduct);
        this.loadingState.set(false);
      }),
      catchError(error => {
        console.error('❌ Error al actualizar producto:', error);
        this.errorState.set(error.message || 'Error al actualizar producto');
        this.loadingState.set(false);
        throw error;
      })
    );
  }

  deleteProduct(id: string): Observable<void> {
    this.loadingState.set(true);
    
    return this.http.delete<void>(`${this.apiUrl}/productos/${id}`).pipe(
      tap(() => {
        console.log('✅ Producto eliminado:', id);
        // Eliminar del estado
        this.productsState.update(products => 
          products.filter(p => p.id !== id)
        );
        this.loadingState.set(false);
      }),
      catchError(error => {
        console.error('❌ Error al eliminar producto:', error);
        this.errorState.set(error.message || 'Error al eliminar producto');
        this.loadingState.set(false);
        throw error;
      })
    );
  }

  // ==================== BRANDS ====================

  getBrands(): Observable<Brand[]> {
    return this.http.get<any[]>(`${this.apiUrl}/marca`).pipe(
      map(backendBrands => backendBrands.map(b => ({
        id: b.id.toString(),
        name: b.nombre,
        description: b.descripcion || '',
        isActive: true,
        createdAt: new Date(b.createdAt || Date.now()),
        updatedAt: new Date(b.updatedAt || Date.now())
      }))),
      tap(brands => {
        console.log('✅ Marcas cargadas:', brands);
        this.brandsState.set(brands);
      }),
      catchError(error => {
        console.error('❌ Error al cargar marcas:', error);
        this.errorState.set(error.message || 'Error al cargar marcas');
        return of([]);
      })
    );
  }

  createBrand(data: { name: string; description?: string; logo?: File }): Observable<Brand> {
    const formData = new FormData();
    formData.append('nombre', data.name);
    if (data.description) formData.append('descripcion', data.description);
    if (data.logo) formData.append('logo', data.logo);

    return this.http.post<any>(`${this.apiUrl}/marca`, formData).pipe(
      map(backendBrand => ({
        id: backendBrand.id.toString(),
        name: backendBrand.nombre,
        description: backendBrand.descripcion || '',
        isActive: true,
        createdAt: new Date(backendBrand.createdAt || Date.now()),
        updatedAt: new Date(backendBrand.updatedAt || Date.now())
      })),
      tap(brand => {
        console.log('✅ Marca creada:', brand);
        this.brandsState.update(brands => [...brands, brand]);
      }),
      catchError(error => {
        console.error('❌ Error al crear marca:', error);
        this.errorState.set(error.message || 'Error al crear marca');
        throw error;
      })
    );
  }

  // ==================== LINES ====================

  getLines(brandId?: string): Observable<Line[]> {
    let params = new HttpParams();
    if (brandId) params = params.set('marcaId', brandId);

    return this.http.get<any[]>(`${this.apiUrl}/linea`, { params }).pipe(
      map(backendLines => backendLines.map(l => ({
        id: l.id.toString(),
        name: l.nombre,
        description: l.descripcion || '',
        brandId: (l.marcaId || l.marca?.id || '').toString(),
        isActive: true,
        createdAt: new Date(l.createdAt || Date.now()),
        updatedAt: new Date(l.updatedAt || Date.now())
      }))),
      tap(lines => {
        console.log('✅ Líneas cargadas:', lines);
        this.linesState.set(lines);
      }),
      catchError(error => {
        console.error('❌ Error al cargar líneas:', error);
        this.errorState.set(error.message || 'Error al cargar líneas');
        return of([]);
      })
    );
  }

  createLine(data: { name: string; description?: string; brandId: string }): Observable<Line> {
    const backendData = {
      nombre: data.name,
      descripcion: data.description,
      marcaId: parseInt(data.brandId)
    };

    return this.http.post<any>(`${this.apiUrl}/linea`, backendData).pipe(
      map(backendLine => ({
        id: backendLine.id.toString(),
        name: backendLine.nombre,
        description: backendLine.descripcion || '',
        brandId: (backendLine.marcaId || backendLine.marca?.id || data.brandId).toString(),
        isActive: true,
        createdAt: new Date(backendLine.createdAt || Date.now()),
        updatedAt: new Date(backendLine.updatedAt || Date.now())
      })),
      tap(line => {
        console.log('✅ Línea creada:', line);
        this.linesState.update(lines => [...lines, line]);
      }),
      catchError(error => {
        console.error('❌ Error al crear línea:', error);
        this.errorState.set(error.message || 'Error al crear línea');
        throw error;
      })
    );
  }

  // ==================== UTILITY METHODS ====================

  clearError(): void {
    this.errorState.set(null);
  }

  clearSelectedProduct(): void {
    this.selectedProductState.set(null);
  }
}
  // Mock data para desarrollo sin backend
//   loadMockData(): void {
//     const mockBrands: Brand[] = [
//       { id: '1', name: 'Nike', description: 'Marca deportiva americana', isActive: true, createdAt: new Date(), updatedAt: new Date() },
//       { id: '2', name: 'Adidas', description: 'Marca deportiva alemana', isActive: true, createdAt: new Date(), updatedAt: new Date() },
//       { id: '3', name: 'Puma', description: 'Marca deportiva alemana', isActive: true, createdAt: new Date(), updatedAt: new Date() }
//     ];

//     const mockLines: Line[] = [
//       { id: '1', name: 'Zapatillas', brandId: '1', isActive: true, createdAt: new Date(), updatedAt: new Date() },
//       { id: '2', name: 'Ropa Deportiva', brandId: '1', isActive: true, createdAt: new Date(), updatedAt: new Date() },
//       { id: '3', name: 'Zapatillas', brandId: '2', isActive: true, createdAt: new Date(), updatedAt: new Date() },
//       { id: '4', name: 'Accesorios', brandId: '2', isActive: true, createdAt: new Date(), updatedAt: new Date() }
//     ];

//     const mockProducts: Product[] = [
//       {
//         id: '1',
//         name: 'Nike Air Max 270',
//         description: 'Zapatillas deportivas con tecnología Air',
//         price: 45000,
//         stock: 25,
//         brandId: '1',
//         lineId: '1',
//         sku: 'NIKE-AM270',
//         isActive: true,
//         createdAt: new Date(),
//         updatedAt: new Date()
//       },
//       {
//         id: '2',
//         name: 'Adidas Ultraboost',
//         description: 'Zapatillas para running de alto rendimiento',
//         price: 55000,
//         stock: 8,
//         brandId: '2',
//         lineId: '3',
//         sku: 'ADIDAS-UB',
//         isActive: true,
//         createdAt: new Date(),
//         updatedAt: new Date()
//       },
//       {
//         id: '3',
//         name: 'Nike Dri-FIT Camiseta',
//         description: 'Camiseta deportiva con tecnología de secado rápido',
//         price: 12000,
//         stock: 50,
//         brandId: '1',
//         lineId: '2',
//         sku: 'NIKE-DF-TEE',
//         isActive: true,
//         createdAt: new Date(),
//         updatedAt: new Date()
//       }
//     ];

//     this.brandsState.set(mockBrands);
//     this.linesState.set(mockLines);
//     this.productsState.set(mockProducts);
//   }
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environments';
import {
  CreateLineaDto,
  CreateMarcaDto,
  CreateProductoDto,
  Linea,
  Marca,
  Proveedor,
  Producto
} from '../../../../models/global.models';
import { AuthService } from '../../../auth/services/auth.service';

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


  // ==================== PRODUCTS ====================

  getProducts(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/producto`);
  }

  getProductById(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/producto/${id}`);
  }

  createProduct(data: CreateProductoDto): Observable<Producto> {
    return this.http.post<Producto>(`${this.apiUrl}/producto`, data);
  }

  updateProduct(id: number, data: Partial<CreateProductoDto>): Observable<Producto> {
    // El backend usa PATCH, no PUT
    return this.http.patch<Producto>(`${this.apiUrl}/producto/${id}`, data);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/producto/${id}`);
  }

  // ==================== BRANDS ====================

  getBrands(): Observable<Marca[]> {
    return this.http.get<Marca[]>(`${this.apiUrl}/marca`);
  }

  createBrand(data: CreateMarcaDto): Observable<Marca> {
    // FormData solo si subís imagen u otro archivo
    return this.http.post<Marca>(`${this.apiUrl}/marca`, data);
  }

  // ==================== LINES ====================

  getLines(brandId?: number): Observable<Linea[]> {
    return this.http.get<Linea[]>(`${this.apiUrl}/linea`).pipe(
      map(lines =>
        brandId ? lines.filter(line => line.marcaId === brandId) : lines
      )
    );
  }

  createLine(data: CreateLineaDto): Observable<Linea> {
    return this.http.post<Linea>(`${this.apiUrl}/linea`, data);
  }

  // ==================== PROVIDERS ====================

  getProviders(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(`${this.apiUrl}/proveedor`);
  }
}

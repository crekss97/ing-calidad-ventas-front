import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  Supplier,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  SuppliersResponse,
  ApiError,
  ProductSupplier,
  CreateProductSupplierRequest,
  UpdateProductSupplierRequest
} from '../models/supplier.model';
import { environment } from '../../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private apiUrl = environment.vercelUrl + '/proveedor';

  constructor(private http: HttpClient) {}

  // ============= CRUD de Proveedores =============

  /** Obtener todos los proveedores */
  getSuppliers(page: number = 1, limit: number = 50): Observable<SuppliersResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<SuppliersResponse>(`${this.apiUrl}`, { params })
      .pipe(catchError(this.handleError));
  }

  /** Obtener un proveedor por ID */
  getSupplierById(id: number): Observable<Supplier> {
    return this.http.get<Supplier>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /** Crear un nuevo proveedor */
  createSupplier(data: CreateSupplierRequest): Observable<Supplier> {
    return this.http.post<Supplier>(`${this.apiUrl}`, data)
      .pipe(catchError(this.handleError));
  }

  /** Actualizar un proveedor existente */
  updateSupplier(id: number, data: UpdateSupplierRequest): Observable<Supplier> {
    return this.http.put<Supplier>(`${this.apiUrl}/${id}`, data)
      .pipe(catchError(this.handleError));
  }

  /** Eliminar un proveedor */
  deleteSupplier(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  // ============= Relación Producto-Proveedor =============

  /** Vincular producto con proveedor */
  linkProductToSupplier(data: CreateProductSupplierRequest): Observable<ProductSupplier> {
    return this.http.post<ProductSupplier>(`${this.apiUrl}/producto`, data)
      .pipe(catchError(this.handleError));
  }

  /** Obtener proveedores asociados a un producto */
  getProductSuppliers(productId: number): Observable<ProductSupplier[]> {
    return this.http.get<ProductSupplier[]>(`${this.apiUrl}/producto/${productId}`)
      .pipe(catchError(this.handleError));
  }

  /** Actualizar relación producto-proveedor */
  updateProductSupplier(id: number, data: UpdateProductSupplierRequest): Observable<ProductSupplier> {
    return this.http.put<ProductSupplier>(`${this.apiUrl}/producto/${id}`, data)
      .pipe(catchError(this.handleError));
  }

  /** Eliminar vinculación producto-proveedor */
  unlinkProductFromSupplier(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/producto/${id}`)
      .pipe(catchError(this.handleError));
  }

  // ============= Manejo de errores =============

  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'Ha ocurrido un error desconocido';

    if (error.error instanceof ErrorEvent) {
      message = `Error del cliente: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 0:
          message = 'No se pudo conectar con el servidor';
          break;
        case 404:
          message = 'Recurso no encontrado';
          break;
        case 409:
          message = 'El recurso ya existe';
          break;
        case 500:
          message = 'Error interno del servidor';
          break;
        default:
          message = error.error?.message || `Error HTTP ${error.status}`;
      }
    }

    const apiError: ApiError = {
      statusCode: error.status,
      message,
      errores: error.error?.errors
    };

    return throwError(() => apiError);
  }
}

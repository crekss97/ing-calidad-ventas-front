// src/app/features/suppliers/services/supplier.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, tap, delay, map } from 'rxjs/operators';
import {
  Supplier,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  SuppliersResponse,
  ApiError,
  ProductSupplier,
  CreateProductSupplierRequest,
  UpdateProductSupplierRequest,
  SupplierWithProducts
} from '../models/supplier.model';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {
  private apiUrl = 'http://localhost:3000/proveedor';
  private readonly isMockMode = true; // Cambiar a false cuando tengas el backend

  // Estado local para modo mock
  private mockSuppliers: Supplier[] = [
    {
      id: 1,
      nombre: 'Distribuidora Central',
      razonSocial: 'Distribuidora Central S.A.',
      cuitRut: '30-12345678-9',
      direccion: 'Av. Corrientes 1234, CABA',
      telefono: '+54 11 4567-8900',
      email: 'ventas@distcentral.com',
      sitioWeb: 'https://www.distcentral.com',
      activo: true,
      createdAt: new Date('2024-01-15')
    },
    {
      id: 2,
      nombre: 'Importadora del Sur',
      razonSocial: 'Importadora del Sur S.R.L.',
      cuitRut: '30-98765432-1',
      direccion: 'Calle Mitre 567, Córdoba',
      telefono: '+54 351 123-4567',
      email: 'contacto@impsur.com',
      sitioWeb: 'https://www.impsur.com',
      activo: true,
      createdAt: new Date('2024-02-20')
    },
    {
      id: 3,
      nombre: 'Mayorista Norte',
      razonSocial: 'Mayorista Norte S.A.',
      cuitRut: '30-11223344-5',
      direccion: 'Ruta 9 Km 45, Rosario',
      telefono: '+54 341 555-6789',
      email: 'info@mayoristanorte.com',
      activo: true,
      createdAt: new Date('2024-03-10')
    }
  ];

  private mockProductSuppliers: ProductSupplier[] = [];
  private nextSupplierId = 4;
  private nextProductSupplierId = 1;

  private suppliersSubject = new BehaviorSubject<Supplier[]>(this.mockSuppliers);
  public suppliers$ = this.suppliersSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ============= CRUD de Proveedores =============

  /**
   * Obtener todos los proveedores
   */
  getSuppliers(page: number = 1, limit: number = 50): Observable<SuppliersResponse> {
    if (this.isMockMode) {
      return of({
        suppliers: this.mockSuppliers,
        total: this.mockSuppliers.length,
        page,
        limit
      }).pipe(delay(500));
    }

    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<SuppliersResponse>(this.apiUrl, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtener un proveedor por ID
   */
  getSupplierById(id: number): Observable<Supplier> {
    if (this.isMockMode) {
      const supplier = this.mockSuppliers.find(s => s.id === id);
      if (!supplier) {
        return throwError(() => ({ 
          statusCode: 404, 
          message: 'Proveedor no encontrado' 
        } as ApiError));
      }
      return of(supplier).pipe(delay(300));
    }

    return this.http.get<Supplier>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Crear un nuevo proveedor
   */
  createSupplier(data: CreateSupplierRequest): Observable<Supplier> {
    // Validar duplicados
    const duplicate = this.checkDuplicateSupplier(data.nombre, data.cuitRut);
    if (duplicate) {
      return throwError(() => ({
        statusCode: 409,
        message: duplicate
      } as ApiError));
    }

    if (this.isMockMode) {
      const newSupplier: Supplier = {
        id: this.nextSupplierId++,
        ...data,
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.mockSuppliers.push(newSupplier);
      this.suppliersSubject.next(this.mockSuppliers);

      return of(newSupplier).pipe(delay(800));
    }

    return this.http.post<Supplier>(this.apiUrl, data)
      .pipe(
        tap(supplier => {
          this.mockSuppliers.push(supplier);
          this.suppliersSubject.next(this.mockSuppliers);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Actualizar un proveedor
   */
  updateSupplier(id: number, data: UpdateSupplierRequest): Observable<Supplier> {
    // Validar duplicados (excluyendo el mismo proveedor)
    const duplicate = this.checkDuplicateSupplier(data.nombre, data.cuitRut, id);
    if (duplicate) {
      return throwError(() => ({
        statusCode: 409,
        message: duplicate
      } as ApiError));
    }

    if (this.isMockMode) {
      const index = this.mockSuppliers.findIndex(s => s.id === id);
      if (index === -1) {
        return throwError(() => ({ 
          statusCode: 404, 
          message: 'Proveedor no encontrado' 
        } as ApiError));
      }

      const updatedSupplier: Supplier = {
        ...this.mockSuppliers[index],
        ...data,
        updatedAt: new Date()
      };

      this.mockSuppliers[index] = updatedSupplier;
      this.suppliersSubject.next(this.mockSuppliers);

      return of(updatedSupplier).pipe(delay(800));
    }

    return this.http.put<Supplier>(`${this.apiUrl}/${id}`, data)
      .pipe(
        tap(supplier => {
          const index = this.mockSuppliers.findIndex(s => s.id === id);
          if (index !== -1) {
            this.mockSuppliers[index] = supplier;
            this.suppliersSubject.next(this.mockSuppliers);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Eliminar un proveedor
   */
  deleteSupplier(id: number): Observable<void> {
    if (this.isMockMode) {
      const index = this.mockSuppliers.findIndex(s => s.id === id);
      if (index === -1) {
        return throwError(() => ({ 
          statusCode: 404, 
          message: 'Proveedor no encontrado' 
        } as ApiError));
      }

      this.mockSuppliers.splice(index, 1);
      this.suppliersSubject.next(this.mockSuppliers);

      return of(void 0).pipe(delay(500));
    }

    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(() => {
          const index = this.mockSuppliers.findIndex(s => s.id === id);
          if (index !== -1) {
            this.mockSuppliers.splice(index, 1);
            this.suppliersSubject.next(this.mockSuppliers);
          }
        }),
        catchError(this.handleError)
      );
  }

  // ============= Relación Producto-Proveedor =============

  /**
   * Vincular producto con proveedor
   */
  linkProductToSupplier(data: CreateProductSupplierRequest): Observable<ProductSupplier> {
    // Validar que no exista ya esta relación
    const existing = this.mockProductSuppliers.find(
      ps => ps.productoId === data.productId && ps.proveedorId === data.proveedorId
    );

    if (existing) {
      return throwError(() => ({
        statusCode: 409,
        message: 'Este producto ya está vinculado a este proveedor'
      } as ApiError));
    }

    // Validar que el código del proveedor sea único para ese proveedor
    const duplicateCode = this.mockProductSuppliers.find(
      ps => ps.proveedorId === data.proveedorId && 
            ps.codigoProveedor === data.codigoProveedor
    );

    if (duplicateCode) {
      return throwError(() => ({
        statusCode: 409,
        message: 'Este código de proveedor ya está en uso'
      } as ApiError));
    }

    if (this.isMockMode) {
      const newLink: ProductSupplier = {
          id: this.nextProductSupplierId++,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
          productoId: 0
      };

      this.mockProductSuppliers.push(newLink);
      return of(newLink).pipe(delay(500));
    }

    return this.http.post<ProductSupplier>(`${this.apiUrl}/product-links`, data)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtener proveedores de un producto
   */
  getProductSuppliers(productId: number): Observable<ProductSupplier[]> {
    if (this.isMockMode) {
      const links = this.mockProductSuppliers.filter(ps => ps.productoId === productId);
      return of(links).pipe(delay(300));
    }

    return this.http.get<ProductSupplier[]>(`${this.apiUrl}/products/${productId}/suppliers`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Actualizar relación producto-proveedor
   */
  updateProductSupplier(id: number, data: UpdateProductSupplierRequest): Observable<ProductSupplier> {
    if (this.isMockMode) {
      const index = this.mockProductSuppliers.findIndex(ps => ps.id === id);
      if (index === -1) {
        return throwError(() => ({ 
          statusCode: 404, 
          message: 'Relación no encontrada' 
        } as ApiError));
      }

      const updated: ProductSupplier = {
        ...this.mockProductSuppliers[index],
        ...data,
        updatedAt: new Date()
      };

      this.mockProductSuppliers[index] = updated;
      return of(updated).pipe(delay(500));
    }

    return this.http.put<ProductSupplier>(`${this.apiUrl}/product-links/${id}`, data)
      .pipe(catchError(this.handleError));
  }

  /**
   * Eliminar vinculación producto-proveedor
   */
  unlinkProductFromSupplier(id: number): Observable<void> {
    if (this.isMockMode) {
      const index = this.mockProductSuppliers.findIndex(ps => ps.id === id);
      if (index === -1) {
        return throwError(() => ({ 
          statusCode: 404, 
          message: 'Relación no encontrada' 
        } as ApiError));
      }

      this.mockProductSuppliers.splice(index, 1);
      return of(void 0).pipe(delay(500));
    }

    return this.http.delete<void>(`${this.apiUrl}/product-links/${id}`)
      .pipe(catchError(this.handleError));
  }

  // ============= Utilidades =============

  /**
   * Verificar si existe un proveedor duplicado
   */
  private checkDuplicateSupplier(nombre: string, cuitRut: string, excludeId?: number): string | null {
    const duplicateName = this.mockSuppliers.find(
      s => s.nombre.toLowerCase() === nombre.toLowerCase() && s.id !== excludeId
    );

    if (duplicateName) {
      return 'Ya existe un proveedor con ese nombre';
    }

    const duplicateCuit = this.mockSuppliers.find(
      s => s.cuitRut === cuitRut && s.id !== excludeId
    );

    if (duplicateCuit) {
      return 'Ya existe un proveedor con ese CUIT/RUT';
    }

    return null;
  }

  /**
   * Manejo de errores HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 0) {
        errorMessage = 'No se pudo conectar con el servidor';
      } else if (error.status === 404) {
        errorMessage = 'Recurso no encontrado';
      } else if (error.status === 409) {
        errorMessage = 'El recurso ya existe';
      } else if (error.status === 500) {
        errorMessage = 'Error interno del servidor';
      }
    }

    return throwError(() => ({
      statusCode: error.status,
      message: errorMessage,
      errors: error.error?.errors
    } as ApiError));
  }
}
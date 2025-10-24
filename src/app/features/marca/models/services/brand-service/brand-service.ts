import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { Brand } from '../../../../products/models/product.models';

@Injectable({
  providedIn: 'root'
})
export class BrandService {
  private apiUrl = 'http://localhost:3000/api';

  // State con Signals
  private brandsState = signal<Brand[]>([]);
  private loadingState = signal(false);
  private errorState = signal<string | null>(null);

  // Public readonly signals
  brands = this.brandsState.asReadonly();
  loading = this.loadingState.asReadonly();
  error = this.errorState.asReadonly();

  // Computed signals
  brandsCount = computed(() => this.brandsState().length);
  activeBrands = computed(() => this.brandsState().filter(b => (b as any).isActive));
  brandsWithProducts = computed(() => this.brandsState().filter(b => !!b.hasProducts));

  constructor(private http: HttpClient) {}

  // Obtener todas las marcas (opcionalmente con filtro de búsqueda)
  getAll(search?: string): Observable<Brand[]> {
    this.loadingState.set(true);
    this.errorState.set(null);

    let params = new HttpParams();
    if (search) params = params.set('search', search);

    return this.http.get<Brand[]>(`${this.apiUrl}/brands`, { params }).pipe(
      tap(brands => {
        this.brandsState.set(brands);
        this.loadingState.set(false);
      }),
      catchError(error => {
        this.errorState.set(error?.message || 'Error al cargar marcas');
        this.loadingState.set(false);
        return of([]);
      })
    );
  }

  // Obtener marca por id
  getById(id: string): Observable<Brand> {
    this.loadingState.set(true);
    this.errorState.set(null);

    return this.http.get<Brand>(`${this.apiUrl}/brands/${id}`).pipe(
      tap(brand => {
        // actualizar o agregar al estado local
        this.brandsState.update(brands => {
          const exists = brands.find(b => b.id === brand.id);
          if (exists) {
            return brands.map(b => b.id === brand.id ? brand : b);
          }
          return [...brands, brand];
        });
        this.loadingState.set(false);
      }),
      catchError(error => {
        this.errorState.set(error?.message || 'Error al cargar marca');
        this.loadingState.set(false);
        throw error;
      })
    );
  }

  // Crear marca (incluye logo como FormData)
  create(data: { name: string; description?: string; logo?: File }): Observable<Brand> {
    this.loadingState.set(true);
    this.errorState.set(null);

    const formData = new FormData();
    formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);
    if (data.logo) formData.append('logo', data.logo);

    return this.http.post<Brand>(`${this.apiUrl}/brands`, formData).pipe(
      tap(brand => {
        this.brandsState.update(brands => [...brands, brand]);
        this.loadingState.set(false);
      }),
      catchError(error => {
        this.errorState.set(error?.message || 'Error al crear marca');
        this.loadingState.set(false);
        throw error;
      })
    );
  }

  // Actualizar marca (soporta datos parciales y archivo logo opcional)
  update(id: string, data: { name?: string; description?: string; logo?: File | string }): Observable<Brand> {
    this.loadingState.set(true);
    this.errorState.set(null);

    // Si logo es File usamos FormData, si es string (url) enviamos JSON parcial
    if (data.logo instanceof File) {
      const formData = new FormData();
      if (data.name) formData.append('name', data.name);
      if (data.description) formData.append('description', data.description);
      formData.append('logo', data.logo);
      return this.http.put<Brand>(`${this.apiUrl}/brands/${id}`, formData).pipe(
        tap(updated => {
          this.brandsState.update(brands => brands.map(b => b.id === id ? updated : b));
          this.loadingState.set(false);
        }),
        catchError(error => {
          this.errorState.set(error?.message || 'Error al actualizar marca');
          this.loadingState.set(false);
          throw error;
        })
      );
    } else {
      const payload: any = {};
      if (data.name !== undefined) payload.name = data.name;
      if (data.description !== undefined) payload.description = data.description;
      if (typeof data.logo === 'string') payload.logo = data.logo;

      return this.http.put<Brand>(`${this.apiUrl}/brands/${id}`, payload).pipe(
        tap(updated => {
          this.brandsState.update(brands => brands.map(b => b.id === id ? updated : b));
          this.loadingState.set(false);
        }),
        catchError(error => {
          this.errorState.set(error?.message || 'Error al actualizar marca');
          this.loadingState.set(false);
          throw error;
        })
      );
    }
  }

  // Eliminar marca. El backend debe validar si tiene productos asociados y devolver error.
  delete(id: string): Observable<void> {
    this.loadingState.set(true);
    this.errorState.set(null);

    return this.http.delete<void>(`${this.apiUrl}/brands/${id}`).pipe(
      tap(() => {
        this.brandsState.update(brands => brands.filter(b => b.id !== id));
        this.loadingState.set(false);
      }),
      catchError(error => {
        this.errorState.set(error?.message || 'Error al eliminar marca');
        this.loadingState.set(false);
        throw error;
      })
    );
  }

  // Validación local: nombre duplicado (no case-sensitive)
  isNameDuplicate(name: string, excludeId?: string): boolean {
    const n = (name || '').trim().toLowerCase();
    return this.brandsState().some(b => b.name.trim().toLowerCase() === n && b.id !== excludeId);
  }

  // Métodos utilitarios
  clearError(): void {
    this.errorState.set(null);
  }

  // Mock data para desarrollo sin backend
  loadMockData(): void {
    const mock: Brand[] = [
      { id: '1', name: 'Nike', description: 'Marca deportiva americana', logo: '', hasProducts: false, createdAt: new Date(), updatedAt: new Date() } as any,
      { id: '2', name: 'Adidas', description: 'Marca deportiva alemana', logo: '', hasProducts: true, createdAt: new Date(), updatedAt: new Date() } as any,
      { id: '3', name: 'Puma', description: 'Marca deportiva alemana', logo: '', hasProducts: false, createdAt: new Date(), updatedAt: new Date() } as any
    ];

    this.brandsState.set(mock);
  }
}

import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, tap, catchError } from 'rxjs';
import { Line, Brand } from '../../../products/models/product.models';

interface LineFilters {
  search?: string;
  brandId?: string;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = 'http://localhost:3000/api';

  // ==================== STATE SIGNALS ====================
  private linesState = signal<Line[]>([]);
  private brandsState = signal<Brand[]>([]);
  private loadingState = signal(false);
  private errorState = signal<string | null>(null);
  private selectedLineState = signal<Line | null>(null);

  // ==================== READONLY SIGNALS ====================
  lines = this.linesState.asReadonly();
  brands = this.brandsState.asReadonly();
  loading = this.loadingState.asReadonly();
  error = this.errorState.asReadonly();
  selectedLine = this.selectedLineState.asReadonly();

  // ==================== COMPUTED SIGNALS ====================
  linesCount = computed(() => this.linesState().length);

  activeLines = computed(() => 
    this.linesState().filter(line => line.isActive)
  );

  linesByBrand = (brandId: string) => computed(() => 
    this.linesState().filter(line => line.brandId === brandId)
  );

  constructor(private http: HttpClient) {}

  // ==================== CRUD METHODS ====================

  getLines(filters?: LineFilters): Observable<Line[]> {
    this.loadingState.set(true);
    this.errorState.set(null);

    let params = new HttpParams();
    if (filters?.search) params = params.set('search', filters.search);
    if (filters?.brandId) params = params.set('brandId', filters.brandId);
    if (filters?.isActive !== undefined) params = params.set('isActive', filters.isActive.toString());

    return this.http.get<Line[]>(`${this.apiUrl}/lines`, { params }).pipe(
      tap(lines => {
        this.linesState.set(lines);
        this.loadingState.set(false);
      }),
      catchError(error => {
        this.errorState.set(error.message || 'Error al cargar líneas');
        this.loadingState.set(false);
        return of([]);
      })
    );
  }

  getLineById(id: string): Observable<Line> {
    this.loadingState.set(true);
    return this.http.get<Line>(`${this.apiUrl}/lines/${id}`).pipe(
      tap(line => {
        this.selectedLineState.set(line);
        this.loadingState.set(false);
      }),
      catchError(error => {
        this.errorState.set(error.message || 'Error al cargar línea');
        this.loadingState.set(false);
        throw error;
      })
    );
  }

  createLine(data: { name: string; description?: string; brandId: string }): Observable<Line> {
    this.loadingState.set(true);
    return this.http.post<Line>(`${this.apiUrl}/lines`, data).pipe(
      tap(newLine => {
        this.linesState.update(lines => [...lines, newLine]);
        this.loadingState.set(false);
      }),
      catchError(error => {
        this.errorState.set(error.message || 'Error al crear línea');
        this.loadingState.set(false);
        throw error;
      })
    );
  }

  updateLine(id: string, data: Partial<{ name: string; description?: string; brandId: string; isActive?: boolean }>): Observable<Line> {
    this.loadingState.set(true);
    return this.http.put<Line>(`${this.apiUrl}/lines/${id}`, data).pipe(
      tap(updated => {
        this.linesState.update(lines => lines.map(l => l.id === id ? updated : l));
        this.selectedLineState.set(updated);
        this.loadingState.set(false);
      }),
      catchError(error => {
        this.errorState.set(error.message || 'Error al actualizar línea');
        this.loadingState.set(false);
        throw error;
      })
    );
  }

  deleteLine(id: string): Observable<void> {
    this.loadingState.set(true);
    return this.http.delete<void>(`${this.apiUrl}/lines/${id}`).pipe(
      tap(() => {
        this.linesState.update(lines => lines.filter(l => l.id !== id));
        this.loadingState.set(false);
      }),
      catchError(error => {
        this.errorState.set(error.message || 'Error al eliminar línea');
        this.loadingState.set(false);
        throw error;
      })
    );
  }

  // ==================== BRANDS SUPPORT ====================

  getBrands(): Observable<Brand[]> {
    return this.http.get<Brand[]>(`${this.apiUrl}/brands`).pipe(
      tap(brands => this.brandsState.set(brands)),
      catchError(error => {
        this.errorState.set(error.message || 'Error al cargar marcas');
        return of([]);
      })
    );
  }

  // ==================== UTILITIES ====================

  clearError(): void {
    this.errorState.set(null);
  }

  clearSelectedLine(): void {
    this.selectedLineState.set(null);
  }

  // ==================== MOCK DATA (DEV ONLY) ====================

  loadMockData(): void {
    const mockBrands: Brand[] = [
      { id: '1', name: 'Nike', description: 'Marca deportiva americana', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: '2', name: 'Adidas', description: 'Marca deportiva alemana', isActive: true, createdAt: new Date(), updatedAt: new Date() }
    ];

    const mockLines: Line[] = [
      { id: '1', name: 'Zapatillas', description: 'Calzado deportivo', brandId: '1', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: '2', name: 'Ropa Deportiva', description: 'Prendas técnicas', brandId: '1', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: '3', name: 'Accesorios', description: 'Bolsos y mochilas', brandId: '2', isActive: true, createdAt: new Date(), updatedAt: new Date() }
    ];

    this.brandsState.set(mockBrands);
    this.linesState.set(mockLines);
  }
}

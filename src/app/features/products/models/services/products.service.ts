import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../../../environments/environments';
import { CreateLineaDto, CreateMarcaDto, CreateProductoDto, Linea, Marca, Producto } from '../../../../models/global.models';

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private apiUrl = environment.vercelUrl;
  constructor(private http: HttpClient) { }

  // ==================== PRODUCTS ====================

  getProducts(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/producto`)
  }

  getProductById(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/producto/${id}`)
  }

  createProduct(data: CreateProductoDto): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${this.apiUrl}/products`, data);
  }

  updateProduct(id: string, data: Partial<CreateProductoDto>): Observable<HttpResponse<any>> {
    return this.http.put<HttpResponse<any>>(`${this.apiUrl}/products/${id}`, data);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/products/${id}`);
  }

  // ==================== BRANDS ====================

  getBrands(): Observable<Marca[]> {
    return this.http.get<Marca[]>(`${this.apiUrl}/marca`);
  }

  createBrand(data: CreateMarcaDto): Observable<HttpResponse<any>> {
    const formData = new FormData();
    formData.append('nombre', data.nombre);
    if (data.descripcion) formData.append('descripcion', data.descripcion);

    return this.http.post<HttpResponse<any>>(`${this.apiUrl}/marca`, formData);
  }

  // ==================== LINES ====================

  getLines(brandId?: number): Observable<Linea[]> {
    let params = new HttpParams();
    return this.http.get<Linea[]>(`${this.apiUrl}/linea`,).pipe(
      tap(lines => 
        // Get all lines and filter the response by brandid if provided
        brandId ? of(lines.filter(line => line.marcaId === brandId)) :
        of(lines)
      ));
  }

  createLine(data: CreateLineaDto): Observable<HttpResponse<any>> {
    return this.http.post<HttpResponse<any>>(`${this.apiUrl}/linea`, data);
  }


}
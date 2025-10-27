import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';
import { environment } from '../../../../environments/environments';

// Interfaces para los DTOs
export interface CreateDetalleVentaDto {
  cantidad: number;
  subtotal: number;
  ventaId?: number;
  productoId: number;
}

export interface UpdateDetalleVentaDto {
  cantidad?: number;
  subtotal?: number;
  ventaId?: number;
  productoId?: number;
}

export interface DetalleVenta {
  id: number;
  cantidad: number;
  subtotal: number;
  productoId: number;
  ventaId: number;
}

export interface CreateVentaDto {
  fechaHora: string; // ISO 8601 string
  usuarioId: number;
  detalles: CreateDetalleVentaDto[];
  total: number;
}

export interface UpdateVentaDto {
  fechaHora?: string;
  usuarioId?: number;
  detalles?: CreateDetalleVentaDto[];
  total?: number;
}

export interface Venta {
  id: number;
  fechaHora: string; // ISO 8601 string
  total: number;
  usuarioId: number;
  detalles?: DetalleVenta[];
}

export interface VentaDetallada extends Venta {
  detalles: DetalleVenta[];
}

// Tipos para respuestas de API
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.vercelUrl}/venta`;
  private readonly detalleApiUrl = `${environment.vercelUrl}/detalle-venta`;


  /**
   * Crea una nueva venta con sus detalles
   */
  crearVenta(venta: CreateVentaDto): Observable<Venta> {
    return this.http.post<Venta>(this.apiUrl, venta).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene todas las ventas
   */
  obtenerVentas(): Observable<Venta[]> {
    return this.http.get<Venta[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene una venta específica por ID
   */
  obtenerVentaPorId(id: number): Observable<Venta> {
    return this.http.get<Venta>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Actualiza una venta existente
   */
  actualizarVenta(id: number, venta: UpdateVentaDto): Observable<Venta> {
    return this.http.patch<Venta>(`${this.apiUrl}/${id}`, venta).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Elimina una venta
   */
  eliminarVenta(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // ============================================
  // MÉTODOS PARA DETALLES DE VENTA
  // ============================================

  /**
   * Crea un detalle de venta individual
   */
  crearDetalleVenta(detalle: CreateDetalleVentaDto): Observable<DetalleVenta> {
    return this.http.post<DetalleVenta>(this.detalleApiUrl, detalle).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene todos los detalles de venta
   */
  obtenerDetallesVenta(): Observable<DetalleVenta[]> {
    return this.http.get<DetalleVenta[]>(this.detalleApiUrl).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene un detalle de venta específico
   */
  obtenerDetalleVentaPorId(id: number): Observable<DetalleVenta> {
    return this.http.get<DetalleVenta>(`${this.detalleApiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Actualiza un detalle de venta
   */
  actualizarDetalleVenta(id: number, detalle: UpdateDetalleVentaDto): Observable<DetalleVenta> {
    return this.http.patch<DetalleVenta>(`${this.detalleApiUrl}/${id}`, detalle).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Elimina un detalle de venta
   */
  eliminarDetalleVenta(id: number): Observable<void> {
    return this.http.delete<void>(`${this.detalleApiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // ============================================
  // MÉTODOS HELPER
  // ============================================

  /**
   * Calcula el total de una venta basado en sus detalles
   */
  calcularTotal(detalles: CreateDetalleVentaDto[]): number {
    return detalles.reduce((total, detalle) => total + detalle.subtotal, 0);
  }

  /**
   * Crea un detalle de venta a partir de producto y cantidad
   */
  crearDetalle(productoId: number, cantidad: number, precioUnitario: number): CreateDetalleVentaDto {
    return {
      productoId,
      cantidad,
      subtotal: cantidad * precioUnitario
    };
  }

  /**
   * Valida que una venta tenga al menos un detalle
   */
  validarVenta(venta: CreateVentaDto): { valida: boolean; errores: string[] } {
    const errores: string[] = [];

    if (!venta.detalles || venta.detalles.length === 0) {
      errores.push('La venta debe tener al menos un producto');
    }

    if (venta.total <= 0) {
      errores.push('El total de la venta debe ser mayor a 0');
    }

    if (!venta.usuarioId) {
      errores.push('Debe especificar un usuario');
    }

    const totalCalculado = this.calcularTotal(venta.detalles);
    if (Math.abs(totalCalculado - venta.total) > 0.01) {
      errores.push('El total no coincide con la suma de los subtotales');
    }

    return {
      valida: errores.length === 0,
      errores
    };
  }

  /**
   * Formatea una fecha para el backend (ISO 8601)
   */
  formatearFecha(fecha: Date): string {
    return fecha.toISOString();
  }

  /**
   * Parsea una fecha del backend
   */
  parsearFecha(fechaString: string): Date {
    return new Date(fechaString);
  }

  /**
   * Limpia el cache local
   */
  limpiarCache(): void {
    // No-op: el servicio ya no mantiene cache local
  }

  /**
   * Manejo centralizado de errores HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocurrió un error desconocido';

    if (error.error instanceof ErrorEvent) {
      // Error del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del servidor
      errorMessage = error.error?.message || 
                     error.error?.error || 
                     `Error ${error.status}: ${error.statusText}`;
    }

    console.error('Error en VentasService:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}

// ============================================
// SERVICIO ADICIONAL PARA REPORTES
// ============================================

@Injectable({
  providedIn: 'root'
})
export class VentasReportesService {
  private ventasService = inject(SalesService);

  /**
   * Obtiene ventas filtradas por rango de fechas
   */
  obtenerVentasPorFechas(fechaInicio: Date, fechaFin: Date): Observable<Venta[]> {
    return this.ventasService.obtenerVentas().pipe(
      map(ventas => ventas.filter(venta => {
        const fecha = new Date(venta.fechaHora);
        return fecha >= fechaInicio && fecha <= fechaFin;
      }))
    );
  }

  /**
   * Calcula el total de ventas en un período
   */
  calcularTotalVentas(ventas: Venta[]): number {
    return ventas.reduce((total, venta) => total + venta.total, 0);
  }

  /**
   * Agrupa ventas por usuario
   */
  agruparPorUsuario(ventas: Venta[]): Map<number, Venta[]> {
    return ventas.reduce((mapa, venta) => {
      const ventasUsuario = mapa.get(venta.usuarioId) || [];
      ventasUsuario.push(venta);
      mapa.set(venta.usuarioId, ventasUsuario);
      return mapa;
    }, new Map<number, Venta[]>());
  }

  /**
   * Obtiene estadísticas de ventas
   */
  obtenerEstadisticas(ventas: Venta[]): {
    total: number;
    cantidad: number;
    promedio: number;
    mayor: number;
    menor: number;
  } {
    if (ventas.length === 0) {
      return { total: 0, cantidad: 0, promedio: 0, mayor: 0, menor: 0 };
    }

    const totales = ventas.map(v => v.total);
    const total = totales.reduce((sum, val) => sum + val, 0);

    return {
      total,
      cantidad: ventas.length,
      promedio: total / ventas.length,
      mayor: Math.max(...totales),
      menor: Math.min(...totales)
    };
  }
}
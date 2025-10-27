import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environments';
import { Linea, CreateLineaDto } from '../../../../models/global.models';

@Injectable({
  providedIn: 'root'
})
export class LineService {
  private apiUrl = environment.vercelUrl;

  constructor(private http: HttpClient) {}

  // ==================== LINES ====================

  /** Obtiene todas las líneas */
  getLines(): Observable<Linea[]> {
    return this.http.get<Linea[]>(`${this.apiUrl}/linea`);
  }

  /** Obtiene una línea por ID */
  getLineById(id: number): Observable<Linea> {
    return this.http.get<Linea>(`${this.apiUrl}/linea/${id}`);
  }

  /** Crea una nueva línea */
  createLine(data: CreateLineaDto): Observable<Linea> {
    return this.http.post<Linea>(`${this.apiUrl}/linea`, data);
  }

  /** Actualiza una línea existente */
  updateLine(id: number, data: Partial<CreateLineaDto>): Observable<Linea> {
    return this.http.patch<Linea>(`${this.apiUrl}/linea/${id}`, data);
  }

  /** Elimina una línea */
  deleteLine(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/linea/${id}`);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environments';
import { CreateUsuarioDto, LoginDto, Usuario } from '../../../models/global.models';


// Interfaz para la respuesta real del backend
interface BackendLoginResponse {
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = environment.vercelUrl;

  private currentUserSubject = new BehaviorSubject<Usuario | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private tokenKey = 'salesapp_token';
  private userKey = 'salesapp_user';

  constructor(private http: HttpClient, private router: Router) {
    const storedUser = this.getStoredUser();
    if (storedUser) this.currentUserSubject.next(storedUser);
  }

  // ==================== GETTERS ====================

  get currentUserValue(): Usuario | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // ==================== AUTH ====================

  /** Iniciar sesión */
  login(credentials: LoginDto): Observable<Usuario> {
    return this.http.post<{ token: string }>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap(res => this.storeToken(res.token)),
      switchMap(() => this.http.get<Usuario>(`${this.apiUrl}/auth/profile`)),
      tap(user => this.storeUser(user)),
      catchError(this.handleError)
    );
  }

  /** Registro de nuevo usuario */
  register(data: CreateUsuarioDto): Observable<Usuario> {
    return this.http.post<{ token: string }>(`${this.apiUrl}/auth/register`, data).pipe(
      tap(res => this.storeToken(res.token)),
      switchMap(() => this.http.get<Usuario>(`${this.apiUrl}/auth/profile`)),
      tap(user => this.storeUser(user)),
      catchError(this.handleError)
    );
  }

  /** Cerrar sesión */
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  // ==================== HELPERS ====================

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private storeToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  private storeUser(user: Usuario): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private getStoredUser(): Usuario | null {
    const stored = localStorage.getItem(this.userKey);
    return stored ? JSON.parse(stored) : null;
  }

  // ==================== ERRORES ====================

  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'Error desconocido';

    if (error.error instanceof ErrorEvent) {
      message = `Error del cliente: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 0: message = 'No se pudo conectar con el servidor'; break;
        case 400: message = 'Datos inválidos'; break;
        case 401: message = 'Credenciales incorrectas'; break;
        case 409: message = 'El correo ya está registrado'; break;
        case 500: message = 'Error interno del servidor'; break;
        default: message = error.error?.message || message;
      }
    }

    return throwError(() => ({
      status: error.status,
      message
    }));
  }
}

// src/app/features/auth/services/auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, tap, delay } from 'rxjs/operators';
import { Router } from '@angular/router';
import { 
  RegisterRequest, 
  LoginRequest, 
  AuthResponse, 
  User,
  ApiError, 
  UserRole
} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth'; // Ajustar según tu backend
  
  //Simula mientra no hay back
  private readonly isMockMode = true;


  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;
  
  private tokenKey = 'salesapp_token';
  private userKey = 'salesapp_user';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    const storedUser = this.getStoredUser();
    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  /**
   * Obtiene el usuario actual
   */
  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Verifica si el usuario está autenticado
   */
  public get isAuthenticated(): boolean {
    return !!this.getToken() && !!this.currentUserValue;
  }

  //===============
  //     LOGIN 
  //==============

  login(credentials: LoginRequest): Observable<AuthResponse> {
    if (this.isMockMode) {
      console.log('Modo Mock: Login simulado');
      //simular delay de red de 800ms
      return of({
        token: 'fake-jwt-token',
        user: {
          id: 1,
          name: 'Mock User',
          email: credentials.email,
          role: 'ADMIN' as UserRole
        }
      }).pipe (
        delay(800),
        tap(response => {
          this.storeAuthData(response.token, response.user);
        })
      );
    }


    //Para cuando haya backend real
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          if (response.token && response.user) {
            this.storeAuthData(response.token, response.user);
          }
        }),
        catchError(this.handleError)
      );
  }
  //===============
  //   REGISTER
  //===============
  register(data: RegisterRequest): Observable<AuthResponse> {
    if (this.isMockMode) {
      console.log('Modo Mock: Registro simulado');
      const mockUser: User = {
        id: 2, 
        name: data.fullName,
        email: data.email,
        role: 'CLIENT' as UserRole
      };
      return of({
        token: 'fake-jwt-token',
        user: mockUser
      }).pipe(
        delay(800),
        tap(response => {
          this.storeAuthData(response.token, response.user);
        })
      );
    }

    const { confirmPassword, ...registerData } = data;
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, registerData)
    .pipe(
      tap(response => {
        if (response.token && response.user) {
          this.storeAuthData(response.token, response.user);
        }
      }),
      catchError(this.handleError)
    )
  }





  /**
   * Registro de nuevo usuario
   */
  // register(data: RegisterRequest): Observable<AuthResponse> {
  //   // Remover confirmPassword antes de enviar al backend
  //   const { confirmPassword, ...registerData } = data;
    
  //   return this.http.post<AuthResponse>(`${this.apiUrl}/register`, registerData)
  //     .pipe(
  //       tap(response => {
  //         if (response.token && response.user) {
  //           this.storeAuthData(response.token, response.user);
  //         }
  //       }),
  //       catchError(this.handleError)
  //     );
  // }

  /**
   * Login de usuario
   */
  // login(credentials: LoginRequest): Observable<AuthResponse> {
  //   return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials)
  //     .pipe(
  //       tap(response => {
  //         if (response.token && response.user) {
  //           this.storeAuthData(response.token, response.user);
  //         }
  //       }),
  //       catchError(this.handleError)
  //     );
  // }

  /**
   * Logout
   */
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  /**
   * Obtener token almacenado
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Verificar email (placeholder para cuando se implemente)
   */
  verifyEmail(token: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify-email`, { token })
      .pipe(catchError(this.handleError));
  }

  /**
   * Solicitar recuperación de contraseña
   */
  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email })
      .pipe(catchError(this.handleError));
  }

  /**
   * Resetear contraseña
   */
  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, { token, newPassword })
      .pipe(catchError(this.handleError));
  }

  /**
   * Almacenar datos de autenticación
   */
  private storeAuthData(token: string, user: User): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  /**
   * Obtener usuario almacenado
   */
  private getStoredUser(): User | null {
    const userStr = localStorage.getItem(this.userKey);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Manejo de errores HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 0) {
        errorMessage = 'No se pudo conectar con el servidor';
      } else if (error.status === 400) {
        errorMessage = 'Datos inválidos';
      } else if (error.status === 401) {
        errorMessage = 'Credenciales incorrectas';
      } else if (error.status === 409) {
        errorMessage = 'El email ya está registrado';
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
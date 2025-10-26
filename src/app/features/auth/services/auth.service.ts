// src/app/features/auth/services/auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, tap, delay, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { 
  RegisterRequest, 
  LoginRequest, 
  AuthResponse, 
  User,
  ApiError, 
  UserRole
} from '../models/user.model';
import { JwtHelperService } from '@auth0/angular-jwt';

interface TokenPayload {
  id: number;
  nombre: string;
  correo: string;
  rol: UserRole;
  exp: number;
  iat: number;
}

// Interfaz para la respuesta real del backend
interface BackendLoginResponse {
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/auth';
  
  private readonly isMockMode = false;

  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;
  
  private tokenKey = 'salesapp_token';
  private userKey = 'salesapp_user';

  constructor(
    private http: HttpClient,
    private router: Router,
    private jwtHelper: JwtHelperService
  ) {
    const storedUser = this.getStoredUser();
    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public get isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.jwtHelper.isTokenExpired(token);
  }

  //===============
  //     LOGIN 
  //==============

  login(credentials: LoginRequest): Observable<AuthResponse> {
    if (this.isMockMode) {
      console.log('Modo Mock: Login simulado');
      return of({
        access_token: 'fake-jwt-token',
        user: {
          id: 1,
          nombre: 'Mock User',
          correo: credentials.email,
          rol: 'ADMIN' as UserRole
        }
      }).pipe(
        delay(800),
        tap(response => {
          this.storeAuthData(response.access_token, response.user);
        })
      );
    }

    const body = {
      correo: credentials.email,
      contraseña: credentials.password
    };

    // Petición al backend real
    return this.http.post<BackendLoginResponse>(`${this.apiUrl}/login`, body)
      .pipe(
        map(res => {
          const token = res.token;
          
          if (!token) {
            console.error('❌ No se recibió token en la respuesta');
            throw new Error('Respuesta del servidor sin token');
          }

          try {
            console.log('🔍 Token recibido del backend:', token);
            
            // Decodificar el token JWT para extraer la información del usuario
            const decodedToken = this.jwtHelper.decodeToken(token) as TokenPayload;
            
            console.log('👤 Token decodificado:', decodedToken);

            // Construir el objeto User a partir del token
            const user: User = {
              id: decodedToken.id,
              nombre: decodedToken.nombre,
              correo: decodedToken.correo,
              rol: decodedToken.rol
            };

            // Guardar token y usuario
            this.storeAuthData(token, user);

            console.log('✅ Usuario autenticado exitosamente:', user);

            // Retornar en formato AuthResponse para compatibilidad con el componente
            return {
              access_token: token,
              user: user
            } as AuthResponse;

          } catch (e) {
            console.error('❌ Error al decodificar el token:', e);
            throw new Error('Token inválido recibido del servidor');
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
        nombre: data.fullName,
        correo: data.email,
        rol: 'CLIENT' as UserRole
      };
      return of({
        access_token: 'fake-jwt-token',
        user: mockUser
      }).pipe(
        delay(800),
        tap(response => {
          this.storeAuthData(response.access_token, response.user);
        })
      );
    }


    const backenRegisterData = {
      nombre: data.fullName,
      correo: data.email,
      dirEnvio: data.company || 'No especificado',
      contraseña: data.password,
      telefono: data.phone,
      rol: 'ADMIN' as const
    };

    console.log('Datos transformados para el backend:', backenRegisterData);
    
    return this.http.post<BackendLoginResponse>(`${this.apiUrl}/register`, backenRegisterData)
      .pipe(
        map(res => {
          const token = res.token;
          
          if (!token) {
            console.error('❌ No se recibió token en la respuesta de registro');
            throw new Error('Respuesta del servidor sin token');
          }

          try {
            const decodedToken = this.jwtHelper.decodeToken(token) as TokenPayload;
            
            const user: User = {
              id: decodedToken.id,
              nombre: decodedToken.nombre,
              correo: decodedToken.correo,
              rol: decodedToken.rol
            };

            this.storeAuthData(token, user);
            
            console.log('✅ Usuario registrado exitosamente:', user);

            // Retornar en formato AuthResponse
            return {
              access_token: token,
              user: user
            } as AuthResponse;

          } catch (e) {
            console.error('❌ Error al decodificar el token:', e);
            throw new Error('Token inválido recibido del servidor');
          }
        }),
        catchError(this.handleError)
      );
  }
  
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  verifyEmail(token: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify-email`, { token })
      .pipe(catchError(this.handleError));
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email })
      .pipe(catchError(this.handleError));
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, { token, newPassword })
      .pipe(catchError(this.handleError));
  }

  private storeAuthData(token: string, user: User): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

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

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
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
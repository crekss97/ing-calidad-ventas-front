// src/app/features/auth/components/login/login.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CustomValidators } from '../../../../shared/validators/custom-validators';
import { LoginRequest, ApiError } from '../../models/user.model';
import { AuthLayout } from '../../../../shared/layouts/auth-layout/auth-layout';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    AuthLayout
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.checkIfAlreadyLoggedIn();
  }

  private initializeForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [
        Validators.required,
        CustomValidators.email()
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6)
      ]],
      rememberMe: [false]
    });
  }

  private checkIfAlreadyLoggedIn(): void {
    // Si el usuario ya está autenticado, redirigir al dashboard
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/dashboard']);
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty));
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    
    if (!field || !field.errors) return '';

    if (field.errors['required']) {
      return fieldName === 'email' ? 'El email es obligatorio' : 'La contraseña es obligatoria';
    }

    if (field.errors['invalidEmail']) {
      return 'Email inválido';
    }

    if (field.errors['minlength']) {
      return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
    }

    return 'Campo inválido';
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const loginData: LoginRequest = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    this.authService.login(loginData).subscribe({
      next: (response) => {
        console.log('Login exitoso:', response);
        
        // Si el usuario marcó "Recordarme", podríamos guardar algo adicional
        if (this.loginForm.value.rememberMe) {
          // Opcional: guardar preferencia de recordar
          localStorage.setItem('rememberMe', 'true');
        }

        // Redirigir al dashboard
        this.router.navigate(['/dashboard']);
      },
      error: (error: ApiError) => {
        console.error('Error en login:', error);
        
        // Mensajes de error personalizados según el código
        if (error.statusCode === 401) {
          this.errorMessage = 'Email o contraseña incorrectos';
        } else if (error.statusCode === 403) {
          this.errorMessage = 'Tu cuenta no está activada. Revisa tu email';
        } else if (error.statusCode === 0) {
          this.errorMessage = 'No se pudo conectar con el servidor';
        } else {
          this.errorMessage = error.message || 'Error al iniciar sesión';
        }
        
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  loginWithGoogle(): void {
    // TODO: Implementar OAuth con Google
    console.log('Login with Google - To be implemented');
    alert('Funcionalidad de Google OAuth pendiente de implementar');
  }

  loginWithGitHub(): void {
    // TODO: Implementar OAuth con GitHub
    console.log('Login with GitHub - To be implemented');
    alert('Funcionalidad de GitHub OAuth pendiente de implementar');
  }

  onForgotPassword(): void {
    // Redirigir a la página de recuperación de contraseña
    this.router.navigate(['/auth/forgot-password']);
  }
}
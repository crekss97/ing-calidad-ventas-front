// src/app/features/auth/components/register/register.component.ts

import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CustomValidators } from '../../../../shared/validators/custom-validators';
import { RegisterRequest, ApiError } from '../../models/user.model';
import { AuthLayout } from '../../../../shared/layouts/auth-layout/auth-layout';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AuthLayout
  ],
  templateUrl: './register.html',
  styleUrls: ['./register.scss']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  showPassword = signal<boolean>(false);
  showConfirmPassword = signal<boolean>(false);
  passwordStrength = signal<number>(0);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.setupPasswordStrengthCheck();
  }

  private initializeForm(): void {
    this.registerForm = this.fb.group({
      fullName: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ]],
      email: ['', [
        Validators.required,
        CustomValidators.email()
      ]],
      company: ['', [
        Validators.maxLength(100)
      ]],
      password: ['', [
        Validators.required,
        CustomValidators.strongPassword()
      ]],
      confirmPassword: ['', [
        Validators.required
      ]],
      acceptTerms: [false, [
        Validators.requiredTrue
      ]]
    }, {
      validators: CustomValidators.matchFields('password', 'confirmPassword')
    });
  }

  private setupPasswordStrengthCheck(): void {
    this.registerForm.get('password')?.valueChanges.subscribe(password => {
      this.passwordStrength.set(this.calculatePasswordStrength(password));
    });
  }

  private calculatePasswordStrength(password: string): number {
    if (!password) return 0;

    let strength = 0;
    
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 12.5;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 12.5;

    return Math.min(strength, 100);
  }

  get passwordStrengthClass(): string {
    if (this.passwordStrength() < 40) return 'bg-danger';
    if (this.passwordStrength() < 70) return 'bg-warning';
    return 'bg-success';
  }

  get passwordStrengthText(): string {
    if (this.passwordStrength() < 40) return 'Débil';
    if (this.passwordStrength() < 70) return 'Media';
    return 'Fuerte';
  }

  togglePasswordVisibility(field: 'password' | 'confirmPassword'): void {
    if (field === 'password') {
      this.showPassword.update(val => !val);
    } else {
      this.showConfirmPassword.update(val => !val);
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    
    if (!field || !field.errors) return '';

    if (field.errors['required']) {
      return this.getRequiredMessage(fieldName);
    }

    if (field.errors['minlength']) {
      return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
    }

    if (field.errors['maxlength']) {
      return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
    }

    if (field.errors['invalidEmail']) {
      return 'Email inválido';
    }

    if (field.errors['strongPassword']) {
      const errors = field.errors['strongPassword'];
      if (!errors.hasMinLength) return 'Mínimo 8 caracteres';
      if (!errors.hasUpperCase) return 'Debe incluir mayúsculas';
      if (!errors.hasLowerCase) return 'Debe incluir minúsculas';
      if (!errors.hasNumber) return 'Debe incluir números';
    }

    if (field.errors['fieldsMismatch']) {
      return 'Las contraseñas no coinciden';
    }

    return 'Campo inválido';
  }

  private getRequiredMessage(fieldName: string): string {
    const messages: { [key: string]: string } = {
      fullName: 'El nombre es obligatorio',
      email: 'El email es obligatorio',
      password: 'La contraseña es obligatoria',
      confirmPassword: 'Confirma tu contraseña',
      acceptTerms: 'Debes aceptar los términos'
    };
    return messages[fieldName] || 'Este campo es obligatorio';
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true)
    this.errorMessage.set('');

    const registerData: RegisterRequest = this.registerForm.value;
    this.authService.register(registerData)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          console.log('Registro exitoso:', response);
          this.router.navigate(['/dashboard']);
        },
        error: (error: ApiError) => {
          console.error('Error en registro:', error);
          this.errorMessage.set(error.message || 'Error al crear la cuenta');
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

  limpiarErrorMessage(){
    this.errorMessage.set('');
  }
}
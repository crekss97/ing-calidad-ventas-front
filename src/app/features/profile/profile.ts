// src/app/features/profile/profile.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';
import { User, UserRole } from '../auth/models/user.model';
import { CustomValidators } from '../../shared/validators/custom-validators';

interface ProfileFormData {
  nombre: string;
  correo: string;
  telefono: string;
  direccion?: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss']
})
export class Profile implements OnInit {
  currentUser: User | null = null;
  profileForm: FormGroup;
  passwordForm: FormGroup;
  
  isEditingProfile = false;
  isChangingPassword = false;
  isSavingProfile = false;
  isSavingPassword = false;
  
  successMessage = '';
  errorMessage = '';
  
  // Para mostrar/ocultar contraseñas
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    // Inicializar formularios en el constructor
    this.profileForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      correo: ['', [Validators.required, CustomValidators.email()]],
      telefono: [''],
      direccion: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });

    // Deshabilitar formulario de perfil por defecto
    this.profileForm.disable();
  }

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  private loadCurrentUser(): void {
    this.currentUser = this.authService.currentUserValue;
    
    if (!this.currentUser) {
      this.router.navigate(['/auth/login']);
      return;
    }

    // Cargar datos del usuario en el formulario
    this.profileForm.patchValue({
      nombre: this.currentUser.nombre,
      correo: this.currentUser.correo,
      telefono: '',
      direccion: '' // Si tienes este campo en tu modelo
    });
  }

  // Validador personalizado para confirmar contraseña
  private passwordMatchValidator(group: FormGroup): {[key: string]: boolean} | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }
    
    return null;
  }

  // Métodos para editar perfil
  enableProfileEdit(): void {
    this.isEditingProfile = true;
    this.profileForm.enable();
    this.clearMessages();
  }

  cancelProfileEdit(): void {
    this.isEditingProfile = false;
    this.profileForm.disable();
    this.loadCurrentUser(); // Recargar datos originales
    this.clearMessages();
  }

  onSaveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSavingProfile = true;
    this.clearMessages();

    const profileData: ProfileFormData = this.profileForm.value;

    // TODO: Implementar servicio de actualización de perfil
    // Simulación de guardado
    setTimeout(() => {
      console.log('Guardando perfil:', profileData);
      
      // Simular éxito
      this.successMessage = 'Perfil actualizado correctamente';
      this.isEditingProfile = false;
      this.profileForm.disable();
      this.isSavingProfile = false;

      // Actualizar usuario en el servicio
      if (this.currentUser) {
        this.currentUser.nombre = profileData.nombre;
        this.currentUser.correo = profileData.correo;
        // Actualizar en localStorage también
        localStorage.setItem('salesapp_user', JSON.stringify(this.currentUser));
      }

      // Limpiar mensaje después de 5 segundos
      setTimeout(() => this.successMessage = '', 5000);
    }, 1500);
  }

  // Métodos para cambiar contraseña
  togglePasswordChange(): void {
    this.isChangingPassword = !this.isChangingPassword;
    this.passwordForm.reset();
    this.clearMessages();
  }

  onChangePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isSavingPassword = true;
    this.clearMessages();

    const passwordData: PasswordFormData = this.passwordForm.value;

    // TODO: Implementar servicio de cambio de contraseña
    // Simulación de cambio
    setTimeout(() => {
      console.log('Cambiando contraseña');
      
      // Simular éxito
      this.successMessage = 'Contraseña actualizada correctamente';
      this.isChangingPassword = false;
      this.passwordForm.reset();
      this.isSavingPassword = false;

      // Limpiar mensaje después de 5 segundos
      setTimeout(() => this.successMessage = '', 5000);
    }, 1500);
  }

  // Helpers para validación de formularios
  isFieldInvalid(formName: 'profile' | 'password', fieldName: string): boolean {
    const form = formName === 'profile' ? this.profileForm : this.passwordForm;
    const field = form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(formName: 'profile' | 'password', fieldName: string): string {
    const form = formName === 'profile' ? this.profileForm : this.passwordForm;
    const field = form.get(fieldName);
    
    if (!field || !field.errors) return '';

    if (field.errors['required']) {
      return 'Este campo es obligatorio';
    }

    if (field.errors['minlength']) {
      const minLength = field.errors['minlength'].requiredLength;
      return `Mínimo ${minLength} caracteres`;
    }

    if (field.errors['invalidEmail']) {
      return 'Email inválido';
    }

    return 'Campo inválido';
  }

  // Getters de utilidad
  get getUserInitials(): string {
    if (!this.currentUser?.nombre) return 'U';
    
    const names = this.currentUser.nombre.trim().split(' ');
    
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    
    return this.currentUser.nombre.substring(0, 2).toUpperCase();
  }

  get getRoleLabel(): string {
    if (!this.currentUser?.rol) return 'Usuario';
    
    const roleLabels: Record<UserRole, string> = {
      'ADMIN': 'Administrador',
      'CLIENT': 'Cliente',
      'SELLER': 'Vendedor'
    };
    
    return roleLabels[this.currentUser.rol] || this.currentUser.rol;
  }

  get passwordMismatch(): boolean {
    return this.passwordForm.hasError('passwordMismatch') && 
           this.passwordForm.get('confirmPassword')?.touched || false;
  }

  // Métodos de navegación
  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  onLogout(): void {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      this.authService.logout();
    }
  }

  // Limpiar mensajes
  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  // Toggle visibilidad de contraseñas
  togglePasswordVisibility(field: 'current' | 'new' | 'confirm'): void {
    switch (field) {
      case 'current':
        this.showCurrentPassword = !this.showCurrentPassword;
        break;
      case 'new':
        this.showNewPassword = !this.showNewPassword;
        break;
      case 'confirm':
        this.showConfirmPassword = !this.showConfirmPassword;
        break;
    }
  }
}
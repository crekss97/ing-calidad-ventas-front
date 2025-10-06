// src/app/shared/validators/custom-validators.ts

import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CustomValidators {
  
  /**
   * Validador para confirmar que dos campos coincidan (ej: password y confirmPassword)
   */
  static matchFields(fieldName: string, confirmFieldName: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const field = control.get(fieldName);
      const confirmField = control.get(confirmFieldName);

      if (!field || !confirmField) {
        return null;
      }

      if (confirmField.errors && !confirmField.errors['fieldsMismatch']) {
        return null;
      }

      if (field.value !== confirmField.value) {
        confirmField.setErrors({ fieldsMismatch: true });
        return { fieldsMismatch: true };
      } else {
        confirmField.setErrors(null);
        return null;
      }
    };
  }

  /**
   * Validador de contraseña fuerte
   * Mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número
   */
  static strongPassword(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      const hasMinLength = value.length >= 8;
      const hasUpperCase = /[A-Z]/.test(value);
      const hasLowerCase = /[a-z]/.test(value);
      const hasNumber = /[0-9]/.test(value);

      const passwordValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber;

      return !passwordValid ? {
        strongPassword: {
          hasMinLength,
          hasUpperCase,
          hasLowerCase,
          hasNumber
        }
      } : null;
    };
  }

  /**
   * Validador de email mejorado
   */
  static email(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (!value) {
        return null;
      }

      // Regex más estricto para emails
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      
      return emailRegex.test(value) ? null : { invalidEmail: true };
    };
  }

  /**
   * Validador para campo requerido con mensaje personalizado
   */
  static requiredWithMessage(message: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      return !control.value ? { required: { message } } : null;
    };
  }
}
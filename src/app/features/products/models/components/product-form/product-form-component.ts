// src/app/features/products/components/product-form/product-form.component.ts

import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProductsService } from '../../services/products.service';
import { Product, ProductFormData } from '../../../models/product.models';

interface QuickCreateModal {
  type: 'brand' | 'line' | null;
  isOpen: boolean;
  name: string;
  description: string;
}

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-form-component.html',
  styleUrls: ['./product-form-component.scss'],
})
export class ProductFormComponent {
  private fb = inject(FormBuilder);
  private productsService = inject(ProductsService);
  
  // Signals
  isOpen = signal(false);
  isSubmitting = signal(false);
  selectedFiles = signal<File[]>([]);
  imagePreviews = signal<string[]>([]);
  editMode = signal(false);
  currentProductId = signal<string | null>(null);

  // Quick create modal
  quickCreateModal = signal<QuickCreateModal>({
    type: null,
    isOpen: false,
    name: '',
    description: '',
  });

  // Data from service
  brands = this.productsService.brands;
  lines = this.productsService.lines;
  loading = this.productsService.loading;

  // Form
  productForm: FormGroup;

  // Computed
  modalTitle = computed(() => (this.editMode() ? 'Editar Producto' : 'Nuevo Producto'));

  submitButtonText = computed(() =>
    this.isSubmitting()
      ? 'Guardando...'
      : this.editMode()
      ? 'Actualizar Producto'
      : 'Crear Producto'
  );

  // Líneas filtradas por marca seleccionada
  availableLines = computed(() => {
    const brandId = this.productForm?.get('brandId')?.value;
    if (!brandId) return [];
    return this.lines().filter((line) => line.brandId === brandId);
  });

  // Estado actual del producto
  productStatus = computed(() => {
    const isActive = this.productForm?.get('isActive')?.value;
    return isActive ? 'Disponible' : 'No disponible';
  });

  constructor() {
    this.productForm = this.initForm();

    // Effect para limpiar la línea cuando cambia la marca
    effect(() => {
      const brandControl = this.productForm.get('brandId');
      if (brandControl) {
        brandControl.valueChanges.subscribe(() => {
          this.productForm.get('lineId')?.setValue('');
        });
      }
    });
  }

  private initForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.required],
      sku: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]+$/)]],
      brandId: ['', Validators.required],
      lineId: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      isActive: [true], // true = disponible (1), false = no disponible (2)
    });
  }

  // Modal controls
  open(product?: Product): void {
    this.isOpen.set(true);
    document.body.style.overflow = 'hidden';

    if (product) {
      this.editMode.set(true);
      this.currentProductId.set(product.id);
      this.loadProductData(product);
    } else {
      this.editMode.set(false);
      this.currentProductId.set(null);
      this.productForm.reset({
        isActive: true,
        price: 0,
        stock: 0,
      });
      this.removeAllImages();
    }
  }

  close(): void {
    if (this.productForm.dirty && !this.isSubmitting()) {
      if (!confirm('¿Deseas cerrar sin guardar? Los cambios se perderán.')) {
        return;
      }
    }

    this.isOpen.set(false);
    document.body.style.overflow = '';
    this.productForm.reset();
    this.editMode.set(false);
    this.currentProductId.set(null);
    this.removeAllImages();
  }

  private loadProductData(product: Product): void {
    this.productForm.patchValue({
      name: product.name,
      description: product.description,
      sku: product.sku,
      brandId: product.brandId,
      lineId: product.lineId,
      price: product.price,
      stock: product.stock,
      isActive: product.isActive,
    });

    if (product.images && product.images.length > 0) {
      this.imagePreviews.set(product.images);
    }
  }

  // Image handling
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const newFiles = Array.from(input.files);

      // Validar que sean imágenes
      const validFiles = newFiles.filter((file) => file.type.startsWith('image/'));

      if (validFiles.length !== newFiles.length) {
        alert('Algunos archivos no son imágenes válidas');
      }

      // Validar tamaño (max 5MB por imagen)
      const oversizedFiles = validFiles.filter((file) => file.size > 5 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        alert('Algunas imágenes superan los 5MB');
        return;
      }

      // Agregar a la lista de archivos
      this.selectedFiles.update((files) => [...files, ...validFiles]);

      // Crear previews
      validFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
          this.imagePreviews.update((previews) => [...previews, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });

      // Limpiar input
      input.value = '';
    }
  }

  removeImage(index: number): void {
    this.imagePreviews.update((previews) => previews.filter((_, i) => i !== index));
    this.selectedFiles.update((files) => files.filter((_, i) => i !== index));
  }

  removeAllImages(): void {
    this.selectedFiles.set([]);
    this.imagePreviews.set([]);
  }

  // Quick create modals
  openQuickCreateModal(type: 'brand' | 'line'): void {
    this.quickCreateModal.set({
      type,
      isOpen: true,
      name: '',
      description: '',
    });
  }

  closeQuickCreateModal(): void {
    this.quickCreateModal.set({
      type: null,
      isOpen: false,
      name: '',
      description: '',
    });
  }

  handleQuickCreate(): void {
    const modal = this.quickCreateModal();
    if (!modal.name.trim()) return;

    if (modal.type === 'brand') {
      this.productsService
        .createBrand({
          name: modal.name,
          description: modal.description,
        })
        .subscribe({
          next: (brand) => {
            this.productForm.patchValue({ brandId: brand.id });
            this.closeQuickCreateModal();
          },
          error: (error) => {
            alert('Error al crear marca: ' + error.message);
          },
        });
    } else if (modal.type === 'line') {
      const brandId = this.productForm.get('brandId')?.value;
      if (!brandId) {
        alert('Primero debes seleccionar una marca');
        return;
      }

      this.productsService
        .createLine({
          name: modal.name,
          description: modal.description,
          brandId,
        })
        .subscribe({
          next: (line) => {
            this.productForm.patchValue({ lineId: line.id });
            this.closeQuickCreateModal();
          },
          error: (error) => {
            alert('Error al crear línea: ' + error.message);
          },
        });
    }
  }

  updateQuickCreateField(field: 'name' | 'description', value: string): void {
    this.quickCreateModal.update((modal) => ({ ...modal, [field]: value }));
  }

  // Form submission
  onSubmit(): void {
    if (this.productForm.invalid) {
      this.markFormGroupTouched(this.productForm);
      return;
    }

    this.isSubmitting.set(true);

    const formValue = this.productForm.value;
    const productData: ProductFormData = {
      name: formValue.name,
      description: formValue.description,
      sku: formValue.sku,
      brandId: formValue.brandId,
      lineId: formValue.lineId,
      price: formValue.price,
      stock: formValue.stock,
      images: this.selectedFiles(),
      isActive: formValue.isActive, // Será convertido a estadoId en el service
    };

    if (this.editMode() && this.currentProductId()) {
      // Actualizar producto
      this.productsService.updateProduct(this.currentProductId()!, productData).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.close();
          alert('Producto actualizado exitosamente');
        },
        error: (error) => {
          this.isSubmitting.set(false);
          alert('Error al actualizar producto: ' + error.message);
        },
      });
    } else {
      // Crear nuevo producto
      this.productsService.createProduct(productData).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.close();
          alert('Producto creado exitosamente');
        },
        error: (error) => {
          this.isSubmitting.set(false);
          alert('Error al crear producto: ' + error.message);
        },
      });
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.productForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  isLineButtonDisable(): boolean {
    const brandId = this.productForm.get('brandId')?.value;
    return !brandId;
  }

  getErrorMessage(fieldName: string): string {
    const control = this.productForm.get(fieldName);

    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }

    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      return `Debe tener al menos ${minLength} caracteres`;
    }

    if (control?.hasError('pattern')) {
      return 'Formato inválido (solo mayúsculas, números y guiones)';
    }

    if (control?.hasError('min')) {
      return 'El valor debe ser mayor o igual a 0';
    }

    return '';
  }

  // Click outside to close
  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close();
    }
  }

  // Obtener nombre de marca
  getBrandName(brandId: string): string {
    return this.brands().find((b) => b.id === brandId)?.name || '';
  }

  // Obtener nombre de línea
  getLineName(lineId: string): string {
    return this.lines().find((l) => l.id === lineId)?.name || '';
  }
}
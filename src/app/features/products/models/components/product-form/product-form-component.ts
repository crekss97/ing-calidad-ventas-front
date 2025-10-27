// src/app/features/products/components/product-form/product-form.component.ts

import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProductsService } from '../../services/products.service';
import { CreateProductoDto, Linea, Marca, Producto, Proveedor } from '../../../../../models/global.models';

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
  editMode = signal(false);
  currentProductId = signal<number | null>(null);
  lines = signal<Linea[]>([]);
  proveedores = signal<Proveedor[]>([]);
  brands = signal<Marca[]>([]);
  // Quick create modal
  quickCreateModal = signal<QuickCreateModal>({
    type: null,
    isOpen: false,
    name: '',
    description: '',
  });

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
    return this.lines().filter((line: Linea) => line.marcaId === brandId);
  });

  // Calcular margen de ganancia
  profitMargin = computed(() => {
    const price = this.productForm?.get('price')?.value || 0;
    const cost = this.productForm?.get('cost')?.value || 0;

    if (cost === 0) return 0;
    return ((price - cost) / cost) * 100;
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
    // Cargar proveedores
    this.productsService.getProviders().subscribe({
      next: (res: any) => this.proveedores.set(Array.isArray(res) ? res : (res?.data ?? res)),
      error: () => this.proveedores.set([]),
    });
  }

  private initForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.required],
      sku: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]+$/)]],
  brandId: ['', Validators.required],
  proveedorId: ['', Validators.required],
      lineId: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      cost: [0, [Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      minStock: [10, [Validators.min(0)]],
      isActive: [true],
    });
  }

  // Modal controls
  open(product?: Producto): void {
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
        minStock: 10,
        price: 0,
        cost: 0,
        stock: 0,
      });
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
  }

  private loadProductData(product: Producto): void {
    this.productForm.patchValue({
      name: product.nombre,
      description: product.descripcion,
      proveedorId: product.proveedorId,
      lineId: product.lineaId,
      price: product.precio,
      stock: product.stock,
      minStock: 10,
    });
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

    
    if (modal.type === 'line') {
      const brandId = this.productForm.get('brandId')?.value;
      if (!brandId) {
        alert('Primero debes seleccionar una marca');
        return;
      }

      this.productsService
        .createLine({
          nombre: modal.name,
          descripcion: modal.description,
          marcaId: brandId,
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
    const productData: CreateProductoDto = {
      nombre: formValue.name,
      descripcion: formValue.description,
      lineaId: Number(formValue.lineId),
      precio: formValue.price,
      stock: formValue.stock,
      estadoId: 1,
      proveedorId: Number(formValue.proveedorId)
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
    return !brandId; // true si no hay marca seleccionada → deshabilita el botón
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
  getBrandName(brandId: number): string {
    return this.brands().find((b: Marca) => b.id === brandId)?.nombre || '';
  }

  // Obtener nombre de línea
  getLineName(lineId: number): string {
    return this.lines().find((l: Linea) => l.id === lineId)?.nombre || '';
  }
}

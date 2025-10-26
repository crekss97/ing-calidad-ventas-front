// src/app/features/suppliers/suppliers.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { SupplierService } from './services/supplier.service';
import { Supplier, CreateSupplierRequest, UpdateSupplierRequest } from './models/supplier.model';
import { CustomValidators } from '../../shared/validators/custom-validators';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './suppliers.html',
  styleUrls: ['./suppliers.scss']
})
export class SuppliersComponent implements OnInit, OnDestroy {
  suppliers: Supplier[] = [];
  filteredSuppliers: Supplier[] = [];
  supplierForm: FormGroup;
  
  // Estados
  isLoading = false;
  isFormOpen = false;
  isEditMode = false;
  isSaving = false;
  currentSupplierId: number | null = null;
  
  // Búsqueda y filtros
  searchTerm = '';
  
  // Mensajes
  successMessage = '';
  errorMessage = '';
  
  // Para el modal de confirmación
  showDeleteModal = false;
  supplierToDelete: Supplier | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private supplierService: SupplierService,
    private router: Router
  ) {
    this.supplierForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      razonSocial: ['', [Validators.required, Validators.minLength(3)]],
      cuitRut: ['', [Validators.required, this.validateCuitRut()]],
      direccion: ['', [Validators.required]],
      telefono: ['', [Validators.required]],
      email: ['', [Validators.required, CustomValidators.email()]],
      sitioWeb: ['']
    });
  }

  ngOnInit(): void {
    this.loadSuppliers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============= Carga de datos =============

  loadSuppliers(): void {
    this.isLoading = true;
    this.supplierService.getSuppliers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.suppliers = response.suppliers;
          this.filteredSuppliers = [...this.suppliers];
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error al cargar proveedores:', error);
          this.showError('Error al cargar los proveedores');
          this.isLoading = false;
        }
      });
  }

  // ============= Búsqueda y filtros =============

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchTerm = input.value.toLowerCase();
    this.filterSuppliers();
  }

  filterSuppliers(): void {
    if (!this.searchTerm.trim()) {
      this.filteredSuppliers = [...this.suppliers];
      return;
    }

    this.filteredSuppliers = this.suppliers.filter(supplier => 
      supplier.nombre.toLowerCase().includes(this.searchTerm) ||
      supplier.razonSocial.toLowerCase().includes(this.searchTerm) ||
      supplier.cuitRut.includes(this.searchTerm) ||
      supplier.email.toLowerCase().includes(this.searchTerm)
    );
  }

  // ============= Operaciones CRUD =============

  openCreateForm(): void {
    this.isEditMode = false;
    this.currentSupplierId = null;
    this.supplierForm.reset();
    this.isFormOpen = true;
    this.clearMessages();
  }

  openEditForm(supplier: Supplier): void {
    this.isEditMode = true;
    this.currentSupplierId = supplier.id;
    this.supplierForm.patchValue({
      nombre: supplier.nombre,
      razonSocial: supplier.razonSocial,
      cuitRut: supplier.cuitRut,
      direccion: supplier.direccion,
      telefono: supplier.telefono,
      email: supplier.email,
      sitioWeb: supplier.sitioWeb || ''
    });
    this.isFormOpen = true;
    this.clearMessages();
  }

  closeForm(): void {
    this.isFormOpen = false;
    this.supplierForm.reset();
    this.clearMessages();
  }

  onSubmit(): void {
    if (this.supplierForm.invalid) {
      this.supplierForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.clearMessages();

    const formData = this.supplierForm.value;

    if (this.isEditMode && this.currentSupplierId) {
      this.updateSupplier(this.currentSupplierId, formData);
    } else {
      this.createSupplier(formData);
    }
  }

  private createSupplier(data: CreateSupplierRequest): void {
    this.supplierService.createSupplier(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (supplier) => {
          this.suppliers.unshift(supplier);
          this.filterSuppliers();
          this.showSuccess('Proveedor creado exitosamente');
          this.closeForm();
          this.isSaving = false;
        },
        error: (error) => {
          console.error('Error al crear proveedor:', error);
          this.showError(error.message || 'Error al crear el proveedor');
          this.isSaving = false;
        }
      });
  }

  private updateSupplier(id: number, data: UpdateSupplierRequest): void {
    this.supplierService.updateSupplier(id, { ...data, id })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (supplier) => {
          const index = this.suppliers.findIndex(s => s.id === id);
          if (index !== -1) {
            this.suppliers[index] = supplier;
            this.filterSuppliers();
          }
          this.showSuccess('Proveedor actualizado exitosamente');
          this.closeForm();
          this.isSaving = false;
        },
        error: (error) => {
          console.error('Error al actualizar proveedor:', error);
          this.showError(error.message || 'Error al actualizar el proveedor');
          this.isSaving = false;
        }
      });
  }

  openDeleteModal(supplier: Supplier): void {
    this.supplierToDelete = supplier;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.supplierToDelete = null;
  }

  confirmDelete(): void {
    if (!this.supplierToDelete) return;

    const supplierId = this.supplierToDelete.id;
    
    this.supplierService.deleteSupplier(supplierId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.suppliers = this.suppliers.filter(s => s.id !== supplierId);
          this.filterSuppliers();
          this.showSuccess('Proveedor eliminado exitosamente');
          this.closeDeleteModal();
        },
        error: (error) => {
          console.error('Error al eliminar proveedor:', error);
          this.showError(error.message || 'Error al eliminar el proveedor');
          this.closeDeleteModal();
        }
      });
  }

  // ============= Validaciones =============

  isFieldInvalid(fieldName: string): boolean {
    const field = this.supplierForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.supplierForm.get(fieldName);
    
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

    if (field.errors['invalidCuitRut']) {
      return 'CUIT/RUT inválido';
    }

    return 'Campo inválido';
  }

  private validateCuitRut() {
    return (control: any) => {
      if (!control.value) return null;
      
      const value = control.value.replace(/[-\s]/g, '');
      
      // Validar formato CUIT argentino (XX-XXXXXXXX-X) o RUT chileno
      const cuitPattern = /^\d{11}$/;
      const rutPattern = /^\d{7,8}$/;
      
      if (!cuitPattern.test(value) && !rutPattern.test(value)) {
        return { invalidCuitRut: true };
      }
      
      return null;
    };
  }

  // ============= Navegación =============

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  viewSupplierDetails(supplier: Supplier): void {
    // TODO: Implementar vista de detalles
    console.log('Ver detalles de:', supplier);
    alert(`Detalles de ${supplier.nombre}\n(Funcionalidad en desarrollo)`);
  }

  // ============= Utilidades =============

  formatPhone(phone: string): string {
    return phone;
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    setTimeout(() => this.successMessage = '', 5000);
  }

  private showError(message: string): void {
    this.errorMessage = message;
    setTimeout(() => this.errorMessage = '', 5000);
  }

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  // ============= Getters =============

  get totalSuppliers(): number {
    return this.suppliers.length;
  }

  get activeSuppliers(): number {
    return this.suppliers.filter(s => s.activo).length;
  }

  get hasSuppliers(): boolean {
    return this.filteredSuppliers.length > 0;
  }

  get formTitle(): string {
    return this.isEditMode ? 'Editar Proveedor' : 'Nuevo Proveedor';
  }
}
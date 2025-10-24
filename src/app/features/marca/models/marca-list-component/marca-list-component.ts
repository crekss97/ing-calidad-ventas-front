// src/app/features/brands/components/marca-list/marca-list-component.ts

import { Component, computed, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { Brand } from '../../../products/models/product.models';

import { BrandService } from '../services/brand-service/brand-service';
import { NewMarcaComponent } from '../new-marca-component/new-marca-component';
//NewBrand
@Component({
  selector: 'app-marca-list-component',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './marca-list-component.html',
  styleUrls: ['./marca-list-component.scss'],
})
export class MarcaListComponent implements OnInit {
  private brandService = inject(BrandService);
  private location = inject(Location);

  @ViewChild('brandFormModal') brandFormModal?: NewMarcaComponent;

  // Controles y filtros
  searchControl = new FormControl('');
  viewMode = signal<'grid' | 'list'>('grid');
  showFilters = signal(false);

  // Datos desde el servicio (signals públicos)
  brands = this.brandService.brands;
  loading = this.brandService.loading;
  error = this.brandService.error;

  // Computed: filtrado en memoria según búsqueda
  filteredBrands = computed(() => {
    const q = (this.searchControl.value || '').toLowerCase().trim();
    let items = this.brands();

    if (q) {
      items = items.filter((b: Brand) => {
        const name = b.name?.toLowerCase() || '';
        const desc = b.description?.toLowerCase() || '';
        return name.includes(q) || desc.includes(q);
      });
    }

    return items;
  });

  // Estadísticas
  totalBrands = computed(() => this.filteredBrands().length);
  activeCount = computed(() => this.filteredBrands().filter((b) => b.isActive).length);

  ngOnInit(): void {
    this.loadData();

    // Debounce búsqueda para rendimiento
    this.searchControl.valueChanges.pipe(debounceTime(250)).subscribe(() => {
      // la computed filteredBrands usa searchControl.value directamente
    });
  }

  undeletableBrands(): Brand[] {
  return this.brands().filter(b => b.hasProducts);
  }


  private loadData(): void {
    // Durante desarrollo podemos cargar mock data
    this.brandService.loadMockData();

    // En producción usar:
    // this.brandService.getAll().subscribe();
  }

  retryLoad(): void {
    this.loadData();
  }

  toggleFilters(): void {
    this.showFilters.update((s) => !s);
  }

  clearFilters(): void {
    this.searchControl.setValue('');
  }

  toggleView(mode?: 'grid' | 'list'): void {
    if (mode) {
      this.viewMode.set(mode);
      return;
    }
    this.viewMode.update((m) => (m === 'grid' ? 'list' : 'grid'));
  }

  // Acciones de navegación / modal
  openNewBrandModal(): void {
  this.brandFormModal?.open('create');
}


  openEditBrandModal(brand: Brand): void {
  this.brandFormModal?.open('edit', brand);
}

  onBrandCreated(brand: Brand): void {
    // Si el modal emite el nuevo brand, ya estará en el service/state. 
    // Aquí agregamos localmente si fuera necesario:
    // this.brandsState.update(b => [...b, brand]);
  }

  // Eliminación con confirmación y verificación de asociación de productos
  deleteBrand(brand: Brand, event?: Event): void {
    if (event) event.stopPropagation();

    if (brand.hasProducts) {
      alert('No se puede eliminar la marca porque tiene productos asociados.');
      return;
    }

    const confirmed = window.confirm(`¿Eliminar la marca "${brand.name}"? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    this.brandService.delete(brand.id).subscribe({
      next: () => {
        // El servicio ya actualiza su estado; si usás copia local, podrías filtrar aquí
      },
      error: (err) => {
        alert(err?.message || 'Error al eliminar la marca');
      },
    });
  }

  // Helpers
  getBrandLogo(b: Brand): string | null {
    return b.logo ?? null;
  }

  goBack(): void {
    this.location.back();
  }
}
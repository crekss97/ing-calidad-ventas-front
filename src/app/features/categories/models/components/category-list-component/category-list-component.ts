import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CategoryService } from '../../services/category.service';
import { Line } from '../../../../products/models/product.models';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { Location } from '@angular/common';
@Component({
  selector: 'app-category-list-component',
  imports: [ReactiveFormsModule],
  templateUrl: './category-list-component.html',
  styleUrl: './category-list-component.scss'
})
export class CategoryListComponent implements OnInit{
  private categoryService = inject(CategoryService);

  private location = inject(Location);

  // --- Filtros y controles
  searchControl = new FormControl('');
  selectedBrand = signal<string>('');
  viewMode = signal<'grid' | 'list'>('grid');
  showFilters = signal(false);

  // --- Datos
  lines = this.categoryService.lines;
  brands = this.categoryService.brands;
  loading = this.categoryService.loading;
  error = this.categoryService.error;

  // --- Computed
  filteredLines = computed(() => {
    const search = this.searchControl.value?.toLowerCase() || '';
    const brandId = this.selectedBrand();
    let lines = this.lines();

    if (search) {
      lines = lines.filter(
        (l: Line) =>
          l.name.toLowerCase().includes(search) ||
          l.description?.toLowerCase().includes(search)
      );
    }

    if (brandId) {
      lines = lines.filter((l) => l.brandId === brandId);
    }

    return lines;
  });

  totalLines = computed(() => this.filteredLines().length);
  activeCount = computed(() => this.filteredLines().filter((l) => l.isActive).length);

  ngOnInit(): void {
    this.loadData();

    this.searchControl.valueChanges.pipe(debounceTime(300)).subscribe(() => {
      // Los signals se actualizan automáticamente
    });
  }

  retryLoad(): void {
    this.loadData();
  }

  private loadData(): void {
    this.categoryService.loadMockData();

    // Producción:
    // this.linesService.getLines().subscribe();
    // this.linesService.getBrands().subscribe();
  }

  onBrandChange(brandId: string): void {
    this.selectedBrand.set(brandId);
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.selectedBrand.set('');
  }

  toggleViewMode(): void {
    this.viewMode.update((mode) => (mode === 'grid' ? 'list' : 'grid'));
  }

  toggleFilters(): void {
    this.showFilters.update((show) => !show);
  }

  deleteLine(line: Line, event: Event): void {
    event.stopPropagation();
    if (confirm(`¿Eliminar la línea "${line.name}"?`)) {
      this.categoryService.deleteLine(line.id).subscribe({
        next: () => console.log('Línea eliminada correctamente'),
        error: (err) => alert('Error al eliminar línea: ' + err.message),
      });
    }
  }

  getBrandName(brandId: string): string {
    return this.brands().find((b) => b.id === brandId)?.name || 'Sin marca';
  }

  goBack(): void {
    this.location.back();
  }
}

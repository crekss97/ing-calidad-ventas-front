import { Component, computed, inject, OnInit, signal, ViewChild } from '@angular/core';
import { LineService } from '../../services/line.service';
import { Linea, Marca } from '../../../../../models/global.models';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { Location } from '@angular/common';
import { NewLineComponent } from '../../new-line-component/new-line-component';
import { ProductsService } from '../../../../products/models/services/products.service';
@Component({
  selector: 'app-line-list-component',
  imports: [ReactiveFormsModule, NewLineComponent],
  templateUrl: './line-list-component.html',
  styleUrl: './line-list-component.scss'
})
export class LineListComponent implements OnInit{
  private lineService = inject(LineService);
  @ViewChild('lineFormModal') lineFormModal?: NewLineComponent;
  private location = inject(Location);
  private productsService = inject(ProductsService);

  // --- Filtros y controles
  searchControl = new FormControl('');
  selectedBrand = signal<string>('');
  viewMode = signal<'grid' | 'list'>('grid');
  showFilters = signal(false);

  // --- Datos locales (señales)
  lines = signal<Linea[]>([]);
  brands = signal<Marca[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  // --- Computed
  filteredLines = computed(() => {
    const search = this.searchControl.value?.toLowerCase() || '';
    const brandId = this.selectedBrand();
    let lines = this.lines();

    if (search) {
      lines = lines.filter((l: Linea) =>
        (l.nombre || '').toLowerCase().includes(search) ||
        (l.descripcion || '').toLowerCase().includes(search)
      );
    }

    if (brandId) {
      lines = lines.filter((l: Linea) => String(l.marcaId) === String(brandId));
    }

    return lines;
  });

  totalLines = computed(() => this.filteredLines().length);
  activeCount = computed(() => this.filteredLines().filter((l) => (l as any).isActive).length);

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
    this.loading.set(true);
    this.error.set(null);

    this.lineService.getLines().subscribe({
      next: (res) => {
        this.lines.set(res || []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message || String(err));
        this.loading.set(false);
      }
    });

    // Cargar marcas desde ProductsService
    this.productsService.getBrands().subscribe({
      next: (res: any) => this.brands.set(res || []),
      error: () => this.brands.set([]),
    });
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

  deleteLine(line: Linea, event: Event): void {
    event.stopPropagation();
  if (confirm(`¿Eliminar la línea "${(line as any).nombre || line.id}"?`)) {
      this.lineService.deleteLine((line as any).id).subscribe({
        next: () => {
          // eliminar del estado local
          this.lines.update(curr => curr.filter(l => l.id !== (line as any).id));
          console.log('Línea eliminada correctamente');
        },
        error: (err) => alert('Error al eliminar línea: ' + err.message),
      });
    }
  }

  getBrandName(brandId: string | number): string {
    return this.brands().find((b) => String(b.id) === String(brandId))?.nombre || 'Sin marca';
  }

  
  openNewLineModal(): void {
    this.lineFormModal?.open('create');
  }

  openEditLineModal(line: Linea): void {
    this.lineFormModal?.open('edit', line);
  }

  onLineCreated(lineData: any): void {
    this.lineService.createLine(lineData).subscribe({
      next: (created) => {
        // añadir al estado local
        this.lines.update(curr => [...curr, created]);
      },
      error: (err) => alert('Error al crear línea: ' + err.message),
    });
  }

  // Helpers para propiedades opcionales que no están tipadas en Linea
  hasImage(line: Linea): boolean {
    return !!(line as any).image;
  }

  getImage(line: Linea): string | undefined {
    return (line as any).image;
  }

  isLineActive(line: Linea): boolean {
    return !!(line as any).isActive;
  }

  goBack(): void {
    this.location.back();
  }
}

import { Component, computed, inject, OnInit, signal, ViewChild } from '@angular/core';
import { LineService } from '../../services/line.service';
import { Line } from '../../../../products/models/product.models';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { Location } from '@angular/common';
import { NewLineComponent } from '../../new-line-component/new-line-component';
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

  // --- Filtros y controles
  searchControl = new FormControl('');
  selectedBrand = signal<string>('');
  viewMode = signal<'grid' | 'list'>('grid');
  showFilters = signal(false);

  // --- Datos
  lines = this.lineService.lines;
  brands = this.lineService.brands;
  loading = this.lineService.loading;
  error = this.lineService.error;

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
    this.lineService.loadMockData();

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
      this.lineService.deleteLine(line.id).subscribe({
        next: () => console.log('Línea eliminada correctamente'),
        error: (err) => alert('Error al eliminar línea: ' + err.message),
      });
    }
  }

  getBrandName(brandId: string): string {
    return this.brands().find((b) => b.id === brandId)?.name || 'Sin marca';
  }

  
  openNewLineModal(): void {
    this.lineFormModal?.open('create');
  }

  openEditLineModal(line: Line): void {
    this.lineFormModal?.open('edit', line);
  }

  onLineCreated(lineData: any): void {
    this.lineService.createLine(lineData).subscribe();
  }

  goBack(): void {
    this.location.back();
  }
}

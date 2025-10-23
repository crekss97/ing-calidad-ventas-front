import {
  Component,
  OnInit,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { ProductsService } from '../../services/products.service';
import { Product, ProductFilters } from '../../../models/product.models';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './products-list-component.html',
  styleUrls: ['./products-list-component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'products-list-container',
  },
})
export class ProductsListComponent implements OnInit {
  private productsService = inject(ProductsService);

  constructor(private location: Location) {}

  searchControl = new FormControl('');
  selectedBrand = signal<string>('');
  selectedLine = signal<string>('');
  viewMode = signal<'grid' | 'list'>('grid');
  showFilters = signal(false);

  products = this.productsService.products;
  brands = this.productsService.brands;
  lines = this.productsService.lines;
  loading = this.productsService.loading;
  error = this.productsService.error;

  filteredProducts = computed(() => {
    const search = this.searchControl.value?.toLowerCase() || '';
    const brandId = this.selectedBrand();
    const lineId = this.selectedLine();
    let products = this.products();

    if (search) {
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.description?.toLowerCase().includes(search) ||
          p.sku?.toLowerCase().includes(search)
      );
    }

    if (brandId) {
      products = products.filter((p) => p.brandId === brandId);
    }

    if (lineId) {
      products = products.filter((p) => p.lineId === lineId);
    }

    return products;
  });

  availableLines = computed(() => {
    const brandId = this.selectedBrand();
    if (!brandId) return this.lines();
    return this.lines().filter((line) => line.brandId === brandId);
  });

  totalProducts = computed(() => this.filteredProducts().length);

  lowStockCount = computed(() => this.filteredProducts().filter((p) => p.stock < 10).length);

  ngOnInit(): void {
    // Cargar datos iniciales
    this.loadData();

    // Búsqueda con debounce
    this.searchControl.valueChanges.pipe(debounceTime(300)).subscribe(() => {
      // Los computed signals se actualizan automáticamente
    });
  }
  retryLoad(): void {
    this.loadData();
  }

  private loadData(): void {
    // Cargar mock data para desarrollo
    // En producción, llamar a los endpoints reales
    this.productsService.loadMockData();

    // Para producción, descomentar:
    // this.productsService.getProducts().subscribe();
    // this.productsService.getBrands().subscribe();
    // this.productsService.getLines().subscribe();
  }

  onBrandChange(brandId: string): void {
    this.selectedBrand.set(brandId);
    // Limpiar línea si la marca cambia
    if (brandId) {
      const currentLine = this.selectedLine();
      const availableLines = this.availableLines();
      if (currentLine && !availableLines.find((l) => l.id === currentLine)) {
        this.selectedLine.set('');
      }
    }
  }

  onLineChange(lineId: string): void {
    this.selectedLine.set(lineId);
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.selectedBrand.set('');
    this.selectedLine.set('');
  }

  toggleViewMode(): void {
    this.viewMode.update((mode) => (mode === 'grid' ? 'list' : 'grid'));
  }

  toggleFilters(): void {
    this.showFilters.update((show) => !show);
  }

  deleteProduct(product: Product, event: Event): void {
    event.stopPropagation();

    if (confirm(`¿Estás seguro de eliminar "${product.name}"?`)) {
      this.productsService.deleteProduct(product.id).subscribe({
        next: () => {
          console.log('Producto eliminado exitosamente');
        },
        error: (error) => {
          alert('Error al eliminar producto: ' + error.message);
        },
      });
    }
  }

  getBrandName(brandId: string): string {
    return this.brands().find((b) => b.id === brandId)?.name || 'Sin marca';
  }

  getLineName(lineId: string): string {
    return this.lines().find((l) => l.id === lineId)?.name || 'Sin línea';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(price);
  }

  getStockClass(stock: number): string {
    if (stock === 0) return 'stock-out';
    if (stock < 10) return 'stock-low';
    return 'stock-ok';
  }

  getStockText(stock: number): string {
    if (stock === 0) return 'Sin stock';
    if (stock < 10) return `Stock bajo: ${stock}`;
    return `Stock: ${stock}`;
  }

  goBack(): void {
    this.location.back();
  }
}

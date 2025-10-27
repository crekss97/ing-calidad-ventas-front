import { CommonModule, Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { Linea, Marca, Producto } from '../../../../../models/global.models';
import { ProductsService } from '../../services/products.service';
import { ProductFormComponent } from '../product-form/product-form-component';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ProductFormComponent],
  templateUrl: './products-list-component.html',
  styleUrls: ['./products-list-component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'products-list-container',
  },
})
export class ProductsListComponent implements OnInit {

  @ViewChild(ProductFormComponent) productForm!: ProductFormComponent;
  private productsService = inject(ProductsService);

  constructor(private location: Location) {}

  searchControl = new FormControl('');
  selectedBrand = signal<number>(0);
  selectedLine = signal<number>(0);
  viewMode = signal<'grid' | 'list'>('grid');
  showFilters = signal(false);

  // Local signals to hold arrays (nos subscribimos a los servicios en loadData)
  products = signal<Producto[]>([]);
  brands = signal<Marca[]>([]);
  lines = signal<Linea[]>([]);

  filteredProducts = computed<Producto[]>(() => {
    const search = this.searchControl.value?.toLowerCase() || '';
    const brandId = this.selectedBrand();
    const lineId = this.selectedLine();
    let products = this.products();

    if (search) {
      products = products.filter(
        (p: Producto) =>
          p.nombre.toLowerCase().includes(search) ||
          p.descripcion?.toLowerCase().includes(search) ||
          p.linea?.nombre.toLowerCase().includes(search));
    }

    if (lineId) {
      products = products.filter((p: Producto) => p.lineaId === +lineId);
    }

    return products;
  });

  availableLines = computed<Linea[]>(() => {
    const brandId = this.selectedBrand();
    if (!brandId) return this.lines();
    // marcaId puede venir como string o number según fuente; usar comparación laxa
    return this.lines().filter((line: Linea) => line.marcaId == brandId as any);
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
    //this.productsService.loadMockData();

    // Para producción, descomentar:
    this.productsService.getProducts().subscribe({
      next: (res: any) => {
        const items: Producto[] = Array.isArray(res) ? res : (res?.data ?? []);
        this.products.set(items);
      },
      error: () => {
        // dejar el estado vacío en caso de error
        this.products.set([]);
      }
    });

    this.productsService.getBrands().subscribe({
      next: (res: any) => this.brands.set(Array.isArray(res) ? res : (res?.data ?? [])),
      error: () => this.brands.set([])
    });

    this.productsService.getLines().subscribe({
      next: (res: any) => this.lines.set(Array.isArray(res) ? res : (res?.data ?? [])),
      error: () => this.lines.set([])
    });
  }

  onBrandChange(brandId: number): void {
    this.selectedBrand.set(brandId);
    // Limpiar línea si la marca cambia
    if (brandId) {
      const currentLine = this.selectedLine();
      const availableLines = this.availableLines();
      if (currentLine && !availableLines.find((l) => l.id === currentLine)) {
        this.selectedLine.set(0);
      }
    }
  }

  onLineChange(lineId: number): void {
    this.selectedLine.set(lineId);
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.selectedBrand.set(0);
    this.selectedLine.set(0);
  }

  openCreateModal(): void {
    this.productForm.open();
  }

  toggleViewMode(): void {
    this.viewMode.update((mode) => (mode === 'grid' ? 'list' : 'grid'));
  }

  toggleFilters(): void {
    this.showFilters.update((show) => !show);
  }

  deleteProduct(product: Producto, event: Event): void {
    event.stopPropagation();

    if (confirm(`¿Estás seguro de eliminar "${product.nombre}"?`)) {
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


  getLineName(lineId: number): string {
    return this.lines().find((l: Linea) => l.id === lineId)?.nombre || 'Sin línea';
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

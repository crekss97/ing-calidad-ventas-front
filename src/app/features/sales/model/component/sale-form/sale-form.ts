import { Component, inject, signal, computed, ChangeDetectionStrategy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SalesService, CreateVentaDto } from '../../services/sales';
import { ProductsService } from '../../../../products/models/services/products.service';
import { Producto } from '../../../../../models/global.models';

// interface Producto{
//   id: number;
//   nombre: string;
//   descripcion: string;
//   precio: number;
//   stock: number;
//   lineaId: number;
//   proveedorId: number;
// }

@Component({
  selector: 'app-registrar-venta',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl:'./sale-form.html',
  styleUrl: './sale-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegistrarVentaComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private ventasService = inject(SalesService);

  // Estado principal
  isOpen = signal(false);
  productos = signal<Producto[]>([]);
  busqueda = signal('');
  guardando = signal(false);
  procesando = signal(false);
  erroresValidacion = signal<string[]>([]);
  errorGeneral = signal<string | null>(null);

  // Modales
  mostrarModalConfirmacion = signal(false);
  mostrarModalExito = signal(false);
  mensajeExito = signal('');

  // Formulario
  ventaForm: FormGroup;

  // Computed
  productosFiltrados = computed(() => {
    const termino = this.busqueda().toLowerCase();
    if (!termino) return this.productos();

    return this.productos().filter(p =>
      p.nombre.toLowerCase().includes(termino) ||
      p.linea?.nombre.toLowerCase().includes(termino)
    );
  });

  subtotal = computed(() => {
    return this.detalles.controls.reduce((sum, detalle) => {
      return sum + (detalle.get('subtotal')?.value || 0);
    }, 0);
  });

  total = computed(() => this.subtotal());

  constructor() {
    this.ventaForm = this.fb.group({
      detalles: this.fb.array([])
    });

    this.cargarProductos();
  }

  get detalles(): FormArray {
    return this.ventaForm.get('detalles') as FormArray;
  }

  // ============================================
  // MODAL CONTROLS
  // ============================================

  open(): void {
    this.isOpen.set(true);
    document.body.style.overflow = 'hidden';
    this.cargarProductos();
  }

  close(): void {
    if (this.detalles.length > 0 && !this.guardando()) {
      if (!confirm('¿Está seguro de cancelar? Se perderán los datos ingresados.')) {
        return;
      }
    }

    this.isOpen.set(false);
    document.body.style.overflow = '';
    this.limpiarFormulario();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close();
    }
  }

  // ============================================
  // CARGA DE DATOS
  // ============================================
  private productsService = inject(ProductsService);
  cargarProductos(): void {
    let rq = {} as any;
    this.productsService.getProducts().subscribe({
      next:(data)=>{
        this.productosFiltrados
      },
      error:(err)=>{}
    })
  }

  // ============================================
  // BÚSQUEDA
  // ============================================

  onBusquedaChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.busqueda.set(input.value);
  }

  // ============================================
  // GESTIÓN DEL CARRITO
  // ============================================

  agregarProducto(producto: Producto): void {
    const index = this.detalles.controls.findIndex(
      d => d.get('productoId')?.value === producto.id
    );

    if (index !== -1) {
      this.incrementarCantidad(index);
    } else {
      const detalleGroup = this.fb.group({
        productoId: [producto.id, Validators.required],
        cantidad: [1, [Validators.required, Validators.min(1), Validators.max(producto.stock)]],
        precioUnitario: [producto.precio],
        subtotal: [producto.precio]
      });

      this.detalles.push(detalleGroup);
    }

    this.erroresValidacion.set([]);
  }

  removerProducto(index: number): void {
    this.detalles.removeAt(index);
  }

  incrementarCantidad(index: number): void {
    const detalle = this.detalles.at(index);
    const cantidadActual = detalle.get('cantidad')?.value || 0;
    const productoId = detalle.get('productoId')?.value;
    const stock = this.obtenerStockProducto(productoId);

    if (cantidadActual < stock) {
      detalle.patchValue({ cantidad: cantidadActual + 1 });
      this.actualizarSubtotal(index);
    }
  }

  decrementarCantidad(index: number): void {
    const detalle = this.detalles.at(index);
    const cantidadActual = detalle.get('cantidad')?.value || 0;

    if (cantidadActual > 1) {
      detalle.patchValue({ cantidad: cantidadActual - 1 });
      this.actualizarSubtotal(index);
    }
  }

  actualizarSubtotal(index: number): void {
    const detalle = this.detalles.at(index);
    const cantidad = detalle.get('cantidad')?.value || 0;
    const precio = detalle.get('precioUnitario')?.value || 0;
    const subtotal = cantidad * precio;

    detalle.patchValue({ subtotal });
  }

  limpiarCarrito(): void {
    if (confirm('¿Está seguro de limpiar el carrito?')) {
      this.detalles.clear();
      this.erroresValidacion.set([]);
    }
  }

  limpiarFormulario(): void {
    this.detalles.clear();
    this.erroresValidacion.set([]);
    this.errorGeneral.set(null);
    this.busqueda.set('');
  }

  // ============================================
  // HELPERS
  // ============================================

  obtenerProducto(id: number): Producto | undefined {
    return this.productos().find(p => Number(p.id) === id);
  }

  obtenerNombreProducto(id: number): string {
    return this.obtenerProducto(id)?.nombre || 'Producto desconocido';
  }

  obtenerPrecioProducto(id: number): number {
    return this.obtenerProducto(id)?.precio || 0;
  }

  obtenerStockProducto(id: number): number {
    return this.obtenerProducto(id)?.stock || 0;
  }

  // ============================================
  // CONFIRMACIÓN Y PROCESAMIENTO
  // ============================================

  confirmarVenta(): void {
    if (this.detalles.length === 0) {
      this.errorGeneral.set('Debe agregar al menos un producto');
      return;
    }

    // Validar stock
    const errores: string[] = [];
    this.detalles.controls.forEach((detalle) => {
      const productoId = detalle.get('productoId')?.value;
      const cantidad = detalle.get('cantidad')?.value;
      const stock = this.obtenerStockProducto(productoId);

      if (cantidad > stock) {
        const nombre = this.obtenerNombreProducto(productoId);
        errores.push(`${nombre}: cantidad solicitada (${cantidad}) excede el stock disponible (${stock})`);
      }
    });

    if (errores.length > 0) {
      this.erroresValidacion.set(errores);
      return;
    }

    this.erroresValidacion.set([]);
    this.mostrarModalConfirmacion.set(true);
  }

  cerrarModalConfirmacion(): void {
    this.mostrarModalConfirmacion.set(false);
  }

  async procesarVenta(): Promise<void> {
    this.procesando.set(true);
    this.errorGeneral.set(null);

    try {
      const detalles = this.detalles.value.map((d: any) => ({
        productoId: d.productoId,
        cantidad: d.cantidad,
        subtotal: d.subtotal
      }));

      const nuevaVenta: CreateVentaDto = {
        fechaHora: this.ventasService.formatearFecha(new Date()),
        usuarioId: 1, // TODO: Obtener del usuario autenticado
        detalles: detalles,
        total: this.total()
      };

      const validacion = this.ventasService.validarVenta(nuevaVenta);
      if (!validacion.valida) {
        this.erroresValidacion.set(validacion.errores);
        this.procesando.set(false);
        this.cerrarModalConfirmacion();
        return;
      }

      this.ventasService.crearVenta(nuevaVenta).subscribe({
        next: (venta) => {
          this.procesando.set(false);
          this.cerrarModalConfirmacion();
          this.mensajeExito.set(`Venta #${venta.id} registrada exitosamente por $${venta.total.toLocaleString('es-AR')}`);
          this.mostrarModalExito.set(true);
        },
        error: (err) => {
          this.procesando.set(false);
          this.errorGeneral.set(err.message);
          this.cerrarModalConfirmacion();
        }
      });
    } catch (error) {
      this.procesando.set(false);
      this.errorGeneral.set('Error inesperado al procesar la venta');
      console.error('Error al procesar venta:', error);
      this.cerrarModalConfirmacion();
    }
  }

  cerrarModalExitoYLimpiar(): void {
    this.mostrarModalExito.set(false);
    this.limpiarFormulario();
    this.close();
  }
}
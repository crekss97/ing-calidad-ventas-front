// src/app/features/dashboard/dashboard.component.ts

import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../auth/services/auth.service';
import { ProductFormComponent } from '../products/models/components/product-form/product-form-component';
import { RegistrarVentaComponent } from '../sales/model/component/sale-form/sale-form';
import { SalesService } from '../sales/model/services/sales';
import { ProductsService } from '../products/models/services/products.service';
import { Usuario } from '../../models/global.models';

interface MetricCard {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: string;
}

interface RecentSale {
  id: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  initials: string;
  avatarColor: string;
}

interface QuickAction {
  icon: string;
  label: string;
  route: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ProductFormComponent, RegistrarVentaComponent],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit {
  @ViewChild(ProductFormComponent) productForm!: ProductFormComponent
  currentUser = signal<Usuario | null>(null);
  
  // Datos dinámicos
  metrics = signal<MetricCard[]>([]);
  recentSales = signal<RecentSale[]>([]);
  quickActions = signal<QuickAction[]>([]);

  constructor(
    private authService: AuthService,
    private router: Router,
    private salesService: SalesService,
    private productsService: ProductsService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  private loadCurrentUser(): void {
    this.currentUser.set(this.authService.currentUserValue);
    
    // Si no hay usuario autenticado, redirigir a login
    if (!this.currentUser()) {
      this.router.navigate(['/auth/login']);
    }
    else {
      this.loadData();
    }
  }

  onLogout(): void {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      this.authService.logout();
    }
  }

  onQuickAction(action: QuickAction): void {
    if (action.label === 'Nuevo Producto') {
      this.productForm.open();
      return;
    }
    if (action.label === 'Nueva Venta') {
      this.registrarVenta.open();
      return;
    }
    
    this.navigateTo(action.route);
    //alert(`Funcionalidad "${action.label}" en desarrollo.\nRuta: ${action.route}`);
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  private loadData(): void {
    // Obtener ventas y productos en paralelo
    forkJoin({
      ventas: this.salesService.obtenerVentas(),
      productos: this.productsService.getProducts()
    }).subscribe({
      next: ({ ventas, productos }) => {
        // Métricas
        const totalVentas = ventas.reduce((s, v) => s + (v.total || 0), 0);
        const uniqueClients = new Set(ventas.map(v => v.usuarioId)).size;
        const productsCount = productos.length;
        const ordersCount = ventas.length;

        this.metrics.set([
          { title: 'Ventas Totales', value: this.formatCurrency(totalVentas), change: '', changeType: 'positive', icon: 'bi-currency-dollar' },
          { title: 'Clientes', value: `${uniqueClients}`, change: '', changeType: 'positive', icon: 'bi-people' },
          { title: 'Productos', value: `${productsCount}`, change: '', changeType: 'positive', icon: 'bi-box-seam' },
          { title: 'Pedidos', value: `${ordersCount}`, change: '', changeType: 'positive', icon: 'bi-cart' }
        ]);

        // Ventas recientes (las 5 más recientes)
        const recientes = ventas
          .slice()
          .sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime())
          .slice(0, 5)
          .map(v => {
            const customerId = v.usuarioId?.toString() ?? 'N/A';
            return {
              id: String(v.id),
              customerName: `Cliente #${customerId}`,
              customerEmail: '',
              amount: v.total || 0,
              initials: this.getInitialsFromId(customerId),
              avatarColor: this.getColorFromId(customerId)
            } as RecentSale;
          });

        this.recentSales.set(recientes);

        // Quick actions según rol
        const role = this.currentUser()?.rol as string | undefined;
        const actions: QuickAction[] = [
          { icon: 'bi-cart', label: 'Nueva Venta', route: '/sales/new' },
          { icon: 'bi-box', label: 'Nuevo Producto', route: '/products/new' },
          { icon: 'bi-graph-up', label: 'Ver Reportes', route: '/reports' }
        ];

        if (role === 'ADMIN') {
          actions.splice(1, 0, { icon: 'bi-people', label: 'Administrar Usuarios', route: '/users' });
        }

        this.quickActions.set(actions);
      },
      error: (err) => {
        console.error('Error cargando datos del dashboard', err);
        this.metrics.set([]);
        this.recentSales.set([]);
        this.quickActions.set([]);
      }
    });
  }

  private getInitialsFromId(id: string): string {
    return id.substring(0, 2).toUpperCase();
  }

  private getColorFromId(id: string): string {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return `#${'00000'.substring(0, 6 - c.length)}${c}`;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(amount);
  }

  get welcomeMessage(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  get userName(): string {
    return this.currentUser()?.nombre || 'Usuario';
  }

  @ViewChild(RegistrarVentaComponent) registrarVenta!: RegistrarVentaComponent;
}
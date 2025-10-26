// src/app/features/dashboard/dashboard.component.ts

import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../auth/services/auth.service';
import { User, UserRole } from '../auth/models/user.model';
import { ProductFormComponent } from '../products/models/components/product-form/product-form-component';

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
  imports: [CommonModule, ProductFormComponent],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class DashboardComponent implements OnInit {
  @ViewChild(ProductFormComponent) productForm!: ProductFormComponent;
  currentUser: User | null = null;

  // Datos de métricas (simulados)
  metrics: MetricCard[] = [
    {
      title: 'Ventas Totales',
      value: '$45,231.89',
      change: '+20% desde el mes pasado',
      changeType: 'positive',
      icon: 'bi-currency-dollar',
    },
    {
      title: 'Clientes',
      value: '+2,350',
      change: '+180 nuevos este mes',
      changeType: 'positive',
      icon: 'bi-people',
    },
    {
      title: 'Productos',
      value: '1,234',
      change: '+12 agregados esta semana',
      changeType: 'positive',
      icon: 'bi-box-seam',
    },
    {
      title: 'Pedidos',
      value: '+573',
      change: '-4% desde la semana pasada',
      changeType: 'negative',
      icon: 'bi-cart',
    },
  ];

  // Ventas recientes (simuladas)
  recentSales: RecentSale[] = [
    {
      id: '1',
      customerName: 'Olivia Martin',
      customerEmail: 'olivia.martin@email.com',
      amount: 1999.0,
      initials: 'OM',
      avatarColor: '#0066CC',
    },
    {
      id: '2',
      customerName: 'Jackson Lee',
      customerEmail: 'jackson.lee@email.com',
      amount: 39.0,
      initials: 'JL',
      avatarColor: '#10b981',
    },
    {
      id: '3',
      customerName: 'Isabella Nguyen',
      customerEmail: 'isabella.nguyen@email.com',
      amount: 299.0,
      initials: 'IN',
      avatarColor: '#f59e0b',
    },
    {
      id: '4',
      customerName: 'William Kim',
      customerEmail: 'will@email.com',
      amount: 99.0,
      initials: 'WK',
      avatarColor: '#8b5cf6',
    },
    {
      id: '5',
      customerName: 'Sofia Davis',
      customerEmail: 'sofia.davis@email.com',
      amount: 39.0,
      initials: 'SD',
      avatarColor: '#ec4899',
    },
  ];

  // Acciones rápidas
  quickActions = signal<QuickAction[]>([
    { icon: 'bi-cart', label: 'Nueva Venta', route: '/sales/new' },
    { icon: 'bi-person-plus', label: 'Agregar Cliente', route: '/clients/new' },
    { icon: 'bi-box', label: 'Nuevo Producto', route: '/products/new' },
    { icon: 'bi-graph-up', label: 'Ver Reportes', route: '/reports' },
  ]);

  constructor(private authService: AuthService, private router: Router) {}

  private loadCurrentUser(): void {
    this.currentUser = this.authService.currentUserValue;

    // Si no hay usuario autenticado, redirigir a login
    if (!this.currentUser) {
      this.router.navigate(['/auth/login']);
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

    alert(`Funcionalidad "${action.label}" en desarrollo.\nRuta: ${action.route}`);
  }

  // navigateTo(route: string): void {
  //   // Placeholder para navegación
  //   if (route === '/products') {
  //     this.router.navigate([route]);
  //   } else {
  //     alert(`Navegando a: ${route}\n(Funcionalidad en desarrollo)`);
  //   }
  // }
  navigateTo(route: string): void {
    const activeRoutes = ['/products', '/suppliers'];
    const routesInDevelopment = ['/sales', '/clients'];

    if (activeRoutes.includes(route)) {
      this.router.navigate([route]);
    } else if (routesInDevelopment.includes(route)) {
      this.showBootstrapAlert(`La sección "${route}" está en desarrollo.`, 'warning');
    } else {
      this.showBootstrapAlert(`Ruta desconocida: ${route}`, 'danger');
    }
  }

  showBootstrapAlert(message: string, type: 'success' | 'danger' | 'warning' | 'info'): void {
  const alertPlaceholder = document.getElementById('liveAlertPlaceholder');
  if (!alertPlaceholder) return;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show shadow-sm" role="alert">
      <i class="bi bi-exclamation-triangle-fill me-2"></i>${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;

  alertPlaceholder.append(wrapper);

  // Desaparece automáticamente después de 3 segundos
  setTimeout(() => {
    wrapper.classList.remove('show');
    wrapper.classList.add('fade');
    setTimeout(() => wrapper.remove(), 500);
  }, 3000);
}

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(amount);
  }

  get welcomeMessage(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }

  get userName(): string {
    return this.currentUser?.nombre || 'Usuario';
  }

  getUserInitials(): string {
    if (!this.currentUser?.nombre) return 'U';

    const names = this.currentUser.nombre.trim().split(' ');

    if (names.length >= 2) {
      return names[0][0] + names[names.length - 1][0].toUpperCase();
    }

    return this.currentUser.nombre.substring(0, 2).toUpperCase();
  }

  getRoleLabel(role: UserRole): string {
    const roleLabels: Record<UserRole, string> = {
      ADMIN: 'Administrador',
      CLIENT: 'Cliente',
      SELLER: 'Vendedor',
    };
    return roleLabels[role] || role;
  }

  showMenu = false;

  toggleMenu(): void {
    this.showMenu = !this.showMenu;
  }

  goToProfile() {
    this.showMenu = false;
    this.router.navigate(['/profile']);
  }

  closeMenuOnClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-dropdown')) {
      this.showMenu = false;
    }
  }

  ngOnInit(): void {
    this.loadCurrentUser();

    document.addEventListener('click', this.closeMenuOnClickOutside.bind(this));
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.closeMenuOnClickOutside.bind(this));
  }

  logout() {
    this.showMenu = false;
    this.authService.logout();
  }
}

// src/app/shared/components/access-denied/access-denied.component.ts

import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../features/auth/services/auth.service';
import { User } from '../../../features/auth/models/user.model';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [],
  templateUrl: './access-denied.component.html',
  styleUrls: ['./access-denied.component.scss'],
})

export class AccessDeniedComponent {
  currentUser = signal<User | null>(null);

  private readonly _authService = inject(AuthService);
  private readonly _router= inject(Router)
  constructor(
  ) {}
  
  ngOnInit() {
    this._authService.currentUser$.subscribe(user => {
      this.currentUser.set(user);
    });
  }

  private readonly roleNames: { [key: string]: string } = {
    'ADMIN': 'Administrador',
    'SELLER': 'Vendedor',
    'CLIENT': 'Cliente'
  };
  getRoleName(role: string): string {
    return this.roleNames[role] || role;
  }

  goToDashboard(): void {
    this._router.navigate(['/dashboard']);
  }

  goBack(): void {
    window.history.back();
  }
}
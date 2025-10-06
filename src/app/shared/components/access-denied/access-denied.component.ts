// src/app/shared/components/access-denied/access-denied.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../features/auth/services/auth.service';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './access-denied.component.html',
  styleUrls: ['./access-denied.component.scss'],
})

export class AccessDeniedComponent {
  currentUser: any = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}
  
  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  getRoleName(role: string): string {
    const roleNames: { [key: string]: string } = {
      'ADMIN': 'Administrador',
      'SELLER': 'Vendedor',
      'CLIENT': 'Cliente'
    };
    return roleNames[role] || role;
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  goBack(): void {
    window.history.back();
  }
}
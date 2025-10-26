// src/app/features/auth/models/user.model.ts

export interface RegisterRequest {
  fullName: string;
  email: string;
  phone: string;
  company?: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginBackendRequest {
  correo: string;
  contraseña: string
}

export interface AuthResponse {
  access_token: string;
  user: User;
  message?: string;
}

export interface User {
  id: number;
  nombre: string;
  fullName?: string;
  correo: string;
  company?: string;
  rol: UserRole;
  token?:string;
  isActive?: boolean;
  emailVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  SELLER = 'SELLER',
  CLIENT = 'CLIENT'
}

export interface ApiError {
  statusCode: number;
  message: string;
  errors?: { [key: string]: string[] };
}

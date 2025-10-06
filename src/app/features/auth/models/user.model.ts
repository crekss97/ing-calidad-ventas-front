// src/app/features/auth/models/user.model.ts

export interface RegisterRequest {
  fullName: string;
  email: string;
  company?: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message?: string;
}

export interface User {
  id: number;
  name: string;
  fullName?: string;
  email: string;
  company?: string;
  role: UserRole;
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

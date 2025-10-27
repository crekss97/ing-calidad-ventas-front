// src/app/features/suppliers/models/supplier.model.ts

export interface Supplier {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string;
  contacto?: string; 
  activo?: boolean;  
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateSupplierRequest {
  nombre: string;
  direccion: string;
  telefono: string;
  contacto: string;
}

export interface UpdateSupplierRequest {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string;
  contacto: string;
}

export interface SuppliersResponse {
  suppliers: Supplier[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  errores?: string[];
}

// Interfaces para relación Producto-Proveedor (si las necesitas después)
export interface ProductSupplier {
  id: number;
  productoId: number;
  proveedorId: number;
  precioCompra?: number;
  tiempoEntrega?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateProductSupplierRequest {
  productoId: number;
  proveedorId: number;
  precioCompra: number;
  tiempoEntrega?: number;
}

export interface UpdateProductSupplierRequest {
  precioCompra?: number;
  tiempoEntrega?: number;
}
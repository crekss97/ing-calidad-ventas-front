export interface Supplier {
    id: number;
    nombre: string;
    razonSocial: string;
    cuitRut: string;
    direccion: string;
    telefono: string;
    email: string;
    sitioWeb?: string;
    activo: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CreateSupplierRequest {
    nombre: string;
    razonSocial: string;
    cuitRut: string;
    direccion: string;
    telefono: string;
    email: string;
    sitioWeb?: string;
}

export interface UpdateSupplierRequest extends CreateSupplierRequest {
    id: number;
    activo?: boolean;
}

export interface ProductSupplier {
    id: number;
    productoId: number;
    proveedorId: number;
    codigoProveedor: string;
    precioCompra?: number;
    esPreferido: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CreateProductSupplierRequest {
    productId: number;
    proveedorId: number;
    codigoProveedor: string;
    precioCompra?: number;
    esPreferido: boolean;
}

export interface UpdateProductSupplierRequest extends CreateProductSupplierRequest {
    id: number;
}

export interface SupplierWithProducts extends Supplier {
    productos: ProductSupplier[];
    totalProductos: number;
}

export interface ProductWithSuppliers {
    id: number;
    nombre: string;
    codigo: string;
    proveedores: Array<{
        proveedor: Supplier;
        codigoProveedor: string;
        precioCompra?: number;
        esPreferido: boolean;
    }>
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
    errores?: any; 
}
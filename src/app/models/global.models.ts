export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  lineaId: number;
  proveedorId: number;
  linea?: Linea;
  proveedor?: Proveedor;
}
export interface CreateProductoDto{
  nombre: string;
  descripcion: string;
  stock: number;
  precio: number;
  lineaId: number;
  proveedorId: number;
  estadoId: number;
}

export interface Proveedor{
  id: number;
  nombre: string;
  telefono: string;
  direccion: string;
  contacto: string;
}
export interface Marca {
  id: number;
  nombre: string;
  descripcion: string;
}

export interface Linea {
  id: number;
  nombre: string;
  descripcion?: string;
  marcaId: number;
  marca?: Marca;
}

export interface Venta{
  id: number;
  fechaHora: Date;
  total: number;
  usuarioId: number;
  detalle?: DetalleVenta[];
}
export interface DetalleVenta{
  id: number;
  cantidad: number;
  productoId: number;
  ventaId: number;
  venta?: Venta;
}

export interface Usuario{
  id: number;
  correo: string;
  nombre: string;
  telefono: string;
  dirEnvio: string;
  fechaHora: Date;
  rol: Rol;
}
enum Rol {
  ADMIN = "ADMIN",
  CLIENTE = "CLIENTE",
  AUDITOR = "AUDITOR"
}


 export interface Estado{
  id: number;
  nombre:    Nombre,
  ambito: Ambito,
  
  marcas?: Marca[],
  estados?: Producto[]
}

enum Nombre {
  DISPONIBLE ="DISPONIBLE",
  NO_DISPONIBLE ="NO_DISPONIBLE",
  ELIMINADO ="ELIMINADO",
  ELIMINADA ="ELIMINADA"
}
enum Ambito {
  PRODUCTO = "PRODUCTO",
  MARCA = "MARCA"
}

export interface CreateUsuarioDTO{
  nombre: string;
  correo: string;
  dirEnvio: string;
  contraseña: string;
  telefono: string;
  rol?: Rol;
}

export interface CreateVentaDto {
  fechaHora: Date;
  usuarioId: number;
  detalles: CreateDetalleVentaDto[];
  total: number;
}

export interface CreateDetalleVentaDto {
  cantidad: number;
  subtotal: number;
  ventaId: number;
  productoId: number;
}

export interface CreateLineaDto{
  nombre: string;
  descripcion: string;
  marcaId: number;
}

export interface CreateMarcaDto {
  nombre: string;
  descripcion: string;
  estadoId: number;
}

export interface CreateProveedorDto {
  nombre: string;
  direccion: string;
  telefono: string;
  contacto: string;
}
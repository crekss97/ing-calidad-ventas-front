export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  brandId: string;
  lineId: string;
  brand?: Brand;
  line?: Line;
  images?: string[];
  sku?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Brand {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Line {
  id: string;
  name: string;
  description?: string;
  brandId: string;
  brand?: Brand;
  image?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductFilters {
  search?: string;
  brandId?: string;
  lineId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  stock: number;
  brandId: string;
  lineId: string;
  sku?: string;
  images?: File[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export type ProductSortField = 'name' | 'price' | 'stock' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

export interface ProductListState {
  products: Product[];
  loading: boolean;
  error: string | null;
  filters: ProductFilters;
  page: number;
  pageSize: number;
  total: number;
  sortField: ProductSortField;
  sortDirection: SortDirection;
}
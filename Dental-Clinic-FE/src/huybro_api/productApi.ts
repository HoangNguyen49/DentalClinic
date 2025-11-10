import axiosClient, { API_BASE_URL } from './axiosClient';

export interface Product {
  productId: number;
  sku: string;
  productName: string;
  brand: string;
  productDescription: string;
  unit: number;
  defaultRetailPrice: number;
  currency: string;
  isTaxable: boolean;
  taxCode: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  image: { imageId: number; imageUrl: string; imageOrder: number }[];
  typeNames: string[];
}

export async function fetchAllProducts(): Promise<Product[]> {
  const res = await axiosClient.get<Product[]>('/api/products');
  return res.data;
}

export async function fetchProductById(id: number | string): Promise<Product | null> {
  const res = await axiosClient.get<Product>(`/api/products/${id}`);
  return res.data ?? null;
}

export const getProductImageSrc = (path: string) => {
  const fileName = path.split('/').pop() ?? path;
  return `${API_BASE_URL}/api/products/images/${encodeURIComponent(fileName)}`;
};

export type SortKey = 'name' | 'price' | 'brand';
export type SortOrder = 'asc' | 'desc';

export interface PageResponse<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface ProductPageParams {
  page?: number;
  size?: number;
  sortBy?: SortKey;     // 'name' | 'price' | 'brand' (BE map: name->productName, price->defaultRetailPrice, brand->brand)
  order?: SortOrder;    // 'asc' | 'desc'
  keyword?: string;
  brand?: string[];     // multiple allowed: ?brand=A&brand=B
  minPrice?: number;
  maxPrice?: number;
  active?: boolean;
  types?: string[];     // multiple allowed: ?type=X&type=Y
}

function toQueryString(p: ProductPageParams): string {
  const sp = new URLSearchParams();
  if (p.page != null) sp.set('page', String(p.page));
  if (p.size != null) sp.set('size', String(p.size));
  if (p.sortBy) sp.set('sortBy', p.sortBy);
  if (p.order) sp.set('order', p.order);
  if (p.keyword) sp.set('keyword', p.keyword);
  if (p.brand && p.brand.length) p.brand.forEach(b => sp.append('brand', b));
  if (p.minPrice != null) sp.set('minPrice', String(p.minPrice));
  if (p.maxPrice != null) sp.set('maxPrice', String(p.maxPrice));
  if (p.active != null) sp.set('active', String(p.active));
  if (p.types && p.types.length) p.types.forEach(t => sp.append('type', t));
  return sp.toString();
}

export async function fetchProductsPage(params: ProductPageParams): Promise<PageResponse<Product>> {
  const defaults: Required<Pick<ProductPageParams, 'page' | 'size' | 'sortBy' | 'order'>> = {
    page: 0,
    size: 8,
    sortBy: 'name',
    order: 'asc',
  };
  const qs = toQueryString({ ...defaults, ...params });
  const res = await axiosClient.get<PageResponse<Product>>(`/api/products/page?${qs}`);
  return res.data;
}

import axiosClient from './axiosClient';

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
  imageUrls: string[];
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

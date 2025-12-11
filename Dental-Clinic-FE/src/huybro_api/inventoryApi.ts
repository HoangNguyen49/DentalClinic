import axiosClient from './axiosClient';
import type { PageResponse } from './productApi';

// --- DTOs ---

// Input nhập kho
export interface ProductStockReceiptCreateDto {
  productId: number;
  clinicId: number;
  quantityAdded: number;
  importPrice: number;
  profitMargin?: number;
  newRetailPrice?: number;
  currency?: string;
  note?: string;
}

// Output nhập kho (kết quả trả về)
export interface ProductStockReceiptDto {
  receiptId: number;
  productId: number;
  productName: string;
  clinicId: number;
  clinicName: string;
  quantityAdded: number;
  importPrice: number;
  newRetailPrice: number;
  note: string;
  createdAt: string;
}

// DTO cho Dropdown Clinic
export interface ClinicCustomDto {
  clinicId: number;
  clinicName: string;
  address?: string;
}

// --- API FUNCTIONS ---

/**
 * POST /api/inventory/import
 * Nhập kho
 */
export async function importStock(
  payload: ProductStockReceiptCreateDto
): Promise<ProductStockReceiptDto> {
  const res = await axiosClient.post<ProductStockReceiptDto>(
    '/api/inventory/import',
    payload
  );
  return res.data;
}

/**
 * GET /api/inventory/dropdown
 * Lấy danh sách kho để hiển thị select box
 */
export async function fetchClinicsForDropdown(): Promise<ClinicCustomDto[]> {
  const res = await axiosClient.get<ClinicCustomDto[]>('/api/inventory/dropdown');
  return res.data;
}

// DTO Status
export interface ClinicInventoryDto {
  clinicId: number;
  clinicName: string;
  quantity: number;
}

export interface ProductInventoryStatusDto {
  productId: number;
  productName: string;
  sku: string;
  totalQuantity: number;
  breakdown: ClinicInventoryDto[];
}

/**
 * GET /api/inventory/status/{productId}
 * Lấy chi tiết tồn kho
 */
export async function fetchProductInventoryStatus(productId: number | string): Promise<ProductInventoryStatusDto> {
  const res = await axiosClient.get<ProductInventoryStatusDto>(`/api/inventory/status/${productId}`);
  return res.data;
}
// [MỚI] DTO hiển thị danh sách kho
export interface InventoryViewDto {
  inventoryId: number;
  productId: number;
  sku: string;
  productName: string;
  image: string | null;
  clinicId: number;
  clinicName: string;
  quantity: number;
  currentRetailPrice: number;
  currency: string;
  minStockLevel: number;
  lastUpdated: string;
}

// [MỚI] DTO cập nhật (Dùng cho Modal sau này)
export interface InventoryUpdateDto {
  inventoryId: number;
  newQuantity?: number;
  newRetailPrice?: number;
  newCurrency?: string;
  newImportPrice?: number;
  newProfitMargin?: number;
  note?: string;
}

// [MỚI] Params cho việc search inventory
export interface InventoryPageParams {
  page?: number;
  size?: number;
  keyword?: string;
  clinicId?: number;
  sortBy?: 'quantity' | 'updated';
}

/**
 * GET /api/inventory/page
 * Lấy danh sách tồn kho có phân trang & lọc
 */
export async function fetchInventoryPage(params: InventoryPageParams): Promise<PageResponse<InventoryViewDto>> {
  const qs = new URLSearchParams();
  
  if (params.page !== undefined) qs.set('page', String(params.page));
  if (params.size !== undefined) qs.set('size', String(params.size));
  if (params.keyword) qs.set('keyword', params.keyword);
  if (params.clinicId) qs.set('clinicId', String(params.clinicId));
  if (params.sortBy) qs.set('sortBy', params.sortBy);

  const res = await axiosClient.get<PageResponse<InventoryViewDto>>(`/api/inventory/page?${qs}`);
  return res.data;
}

/**
 * PUT /api/inventory/update-quantity
 * Cập nhật số lượng & giá
 */
export async function updateInventory(payload: InventoryUpdateDto): Promise<InventoryViewDto> {
  const res = await axiosClient.put<InventoryViewDto>('/api/inventory/update-quantity', payload);
  return res.data;
}

/**
 * GET /api/inventory/{id}
 * Lấy chi tiết tồn kho theo ID
 */
 
export async function fetchInventoryDetail(id: number | string): Promise<InventoryViewDto> {
  const res = await axiosClient.get<InventoryViewDto>(`/api/inventory/${id}`);
  return res.data;
}

// DTO
export interface ProductStockHistoryDto {
  receiptId: number;
  clinicName: string;
  quantityAdded: number;
  importPrice: number;
  profitMargin: number;
  newRetailPrice: number;
  note: string;
  createdAt: string;
}

// Function
export async function fetchProductStockHistory(
  productId: number | string, 
  page = 0, 
  size = 8
): Promise<PageResponse<ProductStockHistoryDto>> {
  const res = await axiosClient.get<PageResponse<ProductStockHistoryDto>>(
    `/api/inventory/history/${productId}?page=${page}&size=${size}`
  );
  return res.data;
}
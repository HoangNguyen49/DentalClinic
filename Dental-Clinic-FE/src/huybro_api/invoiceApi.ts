import axiosClient from "./axiosClient";

// --- Enums & Types ---
export type InvoiceStatus = "NEW" | "CONFIRMED" | "PROCESSING" | "COMPLETED" | "CANCELLED";

// 1. DTO cho Danh sách (List)
export interface ProductInvoiceListDto {
  invoiceId: number;
  invoiceCode: string;
  invoiceDate: string;
  customerFullName: string;
  customerPhone: string;
  totalAmount: number;
  invoiceStatus: InvoiceStatus;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  currency: string;
}

// 2. Response chuẩn cho Phân trang
export interface InvoiceListResponse {
  content: ProductInvoiceListDto[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number; // Current Page
}

// 3. DTO cho Chi tiết Item (Nested)
export interface ProductInvoiceItemDto {
  invoiceItemId: number;
  productId: number;
  productNameSnapshot: string;
  skuSnapshot: string;
  quantity: number;
  unitPriceBeforeTax: number;
  lineTotalAmount: number;
  note: string;
}

// 4. DTO cho Chi tiết Hóa đơn (Detail)
export interface ProductInvoiceDetailDto {
  invoiceId: number;
  invoiceCode: string;
  invoiceDate: string;
  invoiceStatus: InvoiceStatus;
  
  // Customer
  customerFullName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: string;

  // Payment
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: number;
  currency: string;
  
  items: ProductInvoiceItemDto[];
  notes: string;
  createdAt: string;
}

// 5. Params Input
export interface InvoiceQueryParams {
  page?: number;
  size?: number;
  status?: string;
  keyword?: string;
}

export interface UpdateInvoiceStatusRequest {
  newStatus: InvoiceStatus;
  note?: string;
}

// --- API Implementation ---
export const invoiceApi = {
  // GET List 
  getInvoices: async (params: InvoiceQueryParams): Promise<InvoiceListResponse> => {
    const response = await axiosClient.get<InvoiceListResponse>("/api/invoices", { params });
    return response.data;
  },

  // GET Detail
  getInvoiceDetail: async (id: number): Promise<ProductInvoiceDetailDto> => {
    const response = await axiosClient.get<ProductInvoiceDetailDto>(`/api/invoices/${id}`);
    return response.data;
  },

  // PUT Status
  updateInvoiceStatus: async (id: number, request: UpdateInvoiceStatusRequest) => {
    const response = await axiosClient.put(`/api/invoices/${id}/status`, request);
    return response.data;
  }
};
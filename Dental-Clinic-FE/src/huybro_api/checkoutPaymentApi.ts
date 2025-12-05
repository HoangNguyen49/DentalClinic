// src/huybro_api/checkoutPaymentApi.ts
import axiosClient from "./axiosClient";
import type { CheckoutCurrency } from "./cartApi";

// ==== DTO giống BE ====

// Request dùng chung cho COD + PayPal capture
export type CheckoutCreateRequestDto = {
  paymentType: string; // "COD" | "BANK_TRANSFER"
  paymentChannel?: string | null; // "CASH_ON_DELIVERY" | "PAYPAL" | ...
  currency?: CheckoutCurrency | string | null;

  customerFullName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;

  shippingAddress: string;
  note?: string | null;
};

// Item trong invoice
export type CheckoutInvoiceItemDto = {
  productId: number | null;
  productName: string | null;
  sku: string | null;
  quantity: number;
  unitPriceBeforeTax: number;
  taxRatePercent: number | null;
  taxAmount: number;
  lineTotalAmount: number;
  remainingQuantityAfterSale: number | null;
};

// Invoice trả về sau khi tạo / capture
export type CheckoutInvoiceDto = {
  invoiceId: number;
  invoiceCode: string | null;

  subTotal: number;
  taxTotal: number;
  totalAmount: number;
  currency: string | null;

  paymentStatus: string | null;
  paymentMethod: string | null;
  paymentChannel: string | null;
  paymentCompletedAt: string | null; // ISO string

  invoiceDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;

  customerFullName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  shippingAddress: string | null;

  paymentReference: string | null;
  notes: string | null;

  items: CheckoutInvoiceItemDto[];
};

// PayPal create-order response
export type PaypalCreateOrderResponseDto = {
  orderId: string;
  approveUrl: string;
  totalAmount: number;
  currency: string;
  invoiceCode: string;
};

// =========================
// API CALLS
// =========================

// COD: tạo invoice trực tiếp từ cart
export async function createCodInvoice(
  payload: CheckoutCreateRequestDto
): Promise<CheckoutInvoiceDto> {
  const res = await axiosClient.post<CheckoutInvoiceDto>(
    "/api/checkout/invoices",
    payload
  );
  return res.data;
}

// PayPal: tạo order từ cart → redirect URL
export async function createPaypalOrderFromCart(): Promise<PaypalCreateOrderResponseDto> {
  const res = await axiosClient.post<PaypalCreateOrderResponseDto>(
    "/api/checkout/paypal/create-order"
  );
  return res.data;
}

// PayPal: capture + tạo invoice sau khi user thanh toán xong trên PayPal
export async function capturePaypalOrder(
  token: string,
  payload: CheckoutCreateRequestDto
): Promise<CheckoutInvoiceDto> {
  const res = await axiosClient.post<CheckoutInvoiceDto>(
    `/api/checkout/paypal/capture`,
    payload,
    {
      params: { token },
    }
  );
  return res.data;
}
// =========================
// VALIDATION ERROR PARSER
// =========================

export type CheckoutFieldErrors = Record<string, string[]>;
export type CheckoutGlobalErrors = string[];

export function extractCheckoutValidationErrors(
  error: any
): { fieldErrors: CheckoutFieldErrors; globalErrors: CheckoutGlobalErrors } {
  const fieldErrors: CheckoutFieldErrors = {};
  const globalErrors: CheckoutGlobalErrors = [];

  const data = error?.response?.data ?? error?.data ?? null;

  if (data) {
    // ---------------------------------------------------------
    // CASE 1: Lỗi từ Service (CheckoutValidationException)
    // Key trả về là: "fieldErrors"
    // ---------------------------------------------------------
    if (data.fieldErrors && typeof data.fieldErrors === "object") {
      Object.entries<any>(data.fieldErrors).forEach(([field, msgs]) => {
        if (Array.isArray(msgs)) {
          fieldErrors[field] = msgs.map(String);
        } else if (typeof msgs === "string") {
          fieldErrors[field] = [msgs];
        }
      });
    }

    // ---------------------------------------------------------
    // CASE 2: Lỗi từ @Valid DTO (MethodArgumentNotValidException)
    // Key trả về mặc định là: "errors" (Map<String, String>)
    // ---------------------------------------------------------
    if (data.errors && !Array.isArray(data.errors) && typeof data.errors === "object") {
       // Backend trả về dạng Map: { "email": "must be valid", "phone": "..." }
       Object.entries<any>(data.errors).forEach(([field, msg]) => {
          // Gộp vào fieldErrors nếu chưa có, hoặc thêm vào mảng nếu đã có
          if (!fieldErrors[field]) {
             fieldErrors[field] = [String(msg)];
          } else {
             fieldErrors[field].push(String(msg));
          }
       });
    }

    // ---------------------------------------------------------
    // CASE 3: Lỗi dạng mảng (ít gặp hơn nhưng đề phòng)
    // ---------------------------------------------------------
    if (Array.isArray(data.errors)) {
      data.errors.forEach((e: any) => {
        const field = e?.field;
        const message = e?.message || e?.defaultMessage || String(e);
        
        if (field) {
          if (!fieldErrors[field]) fieldErrors[field] = [];
          fieldErrors[field].push(message);
        } else {
          globalErrors.push(message);
        }
      });
    }

    // ---------------------------------------------------------
    // CASE 4: Lỗi Global Message
    // ---------------------------------------------------------
    if (data.message && typeof data.message === "string" && data.message !== "Validation failed") {
       // Chỉ lấy message nếu nó không phải câu chung chung "Validation failed"
       // Hoặc nếu không có fieldError nào thì mới lấy message này làm global
       if (Object.keys(fieldErrors).length === 0) {
          globalErrors.push(data.message);
       }
    }
  }

  // Fallback nếu không parse được gì
  if (!data && error?.message) {
    globalErrors.push(String(error.message));
  }

  return { fieldErrors, globalErrors };
}
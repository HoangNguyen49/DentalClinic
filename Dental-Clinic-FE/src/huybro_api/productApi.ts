import axiosClient, { API_BASE_URL } from './axiosClient';

// DTO con cho lịch sử mua
export interface ProductPurchaseHistoryDto {
  customerName: string;
  price: number;
  quantity: number;
  purchaseDate: string;
}
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
  latestImportPrice?: number;  
  latestProfitMargin?: number; 
  // --- NEW FIELDS ---
  soldCount: number;             // Đã bán
  discountPercentage?: number;   // % Sale
  recentPurchases?: ProductPurchaseHistoryDto[]; // Danh sách người mua
  relatedProducts?: Product[];   // Sản phẩm liên quan
  originalPrice?: number;   // Giá gốc (nếu có giảm giá)
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



// ====== DTO cho accountant create ======

export interface ProductImageCreateDto {
    imageUrl: string;
    imageOrder: number;
}

export interface ProductCreateDto {
    sku: string;
    productName: string;
    brand: string;
    productDescription: string;
    unit: number;
    defaultRetailPrice: number;
    currency: 'USD' | 'VND';
    isTaxable: boolean;
    taxCode: number;
    isActive: boolean;
    image: ProductImageCreateDto[];
    typeNames: string[];
}


type UnknownRecord = Record<string, unknown>;

interface FieldErrorLike extends UnknownRecord {
    field?: string;
    name?: string;
    message?: string;
    defaultMessage?: string;
    error?: string;
}
// Response khi BE upload-image trả lại
export type UploadImageResponse = ProductImageCreateDto;

// Chuẩn hoá lỗi validation (cố gắng lôi hết thông báo ra)
export interface ValidationErrorResult {
    fieldErrors: Record<string, string[]>;
    globalErrors: string[];
    reasonIfNotAll?: string;
    raw?: unknown;
}

export function extractValidationErrors(error: unknown): ValidationErrorResult {
  const result: ValidationErrorResult = {
    fieldErrors: {},
    globalErrors: [],
  };

  const axiosErr = error as { response?: { data?: unknown } };

  const data = axiosErr.response?.data as unknown;

  if (!data || typeof data !== 'object') {
    result.reasonIfNotAll =
      'API trả về lỗi nhưng không có JSON chi tiết (không đọc được danh sách lỗi validation).';
    return result;
  }

  const d = data as UnknownRecord;
  let foundSomething = false;

  // ---------- case 3: fieldErrors + globalErrors ----------
  const globalErrors = d.globalErrors;
  if (Array.isArray(globalErrors)) {
    globalErrors.forEach((msg) => {
      if (msg != null) {
        result.globalErrors.push(String(msg));
        foundSomething = true;
      }
    });
  }

  const fieldErrorsArr = d.fieldErrors;
  if (Array.isArray(fieldErrorsArr)) {
    fieldErrorsArr.forEach((fe) => {
      if (!fe || typeof fe !== 'object') return;
      const f = fe as FieldErrorLike;

      const field = (f.field ?? f.name) as string | undefined;
      const msg = (f.message ?? f.defaultMessage ?? f.error) as
        | string
        | undefined;

      if (field && msg) {
        if (!result.fieldErrors[field]) result.fieldErrors[field] = [];
        result.fieldErrors[field].push(msg);
        foundSomething = true;
      }
    });
  }

  // ---------- case 1 + 2: data.errors ----------
  if (!foundSomething && 'errors' in d) {
    const errors = d.errors as unknown;

    // map: { sku: ['msg'], productName: 'msg' }
    if (!Array.isArray(errors) && typeof errors === 'object' && errors !== null) {
      Object.entries(errors as UnknownRecord).forEach(([field, value]) => {
        if (Array.isArray(value)) {
          result.fieldErrors[field] = value.map((x) => String(x));
        } else {
          result.fieldErrors[field] = [String(value)];
        }
      });
      foundSomething = true;
    }

    // array of { field, message }
    if (Array.isArray(errors)) {
      errors.forEach((err) => {
        if (!err || typeof err !== 'object') return;
        const e = err as FieldErrorLike;

        const field = (e.field ?? e.name) as string | undefined;
        const msg = (e.message ?? e.defaultMessage ?? e.error) as
          | string
          | undefined;

        if (field && msg) {
          if (!result.fieldErrors[field]) result.fieldErrors[field] = [];
          result.fieldErrors[field].push(msg);
        } else if (msg) {
          result.globalErrors.push(msg);
        }
      });
      if (errors.length > 0) foundSomething = true;
    }
  }

  // ---------- fallback nếu vẫn không parse được ----------
  if (!foundSomething) {
    const message =
      (d.message as string | undefined) ??
      (d.error as string | undefined) ??
      undefined;

    if (message) {
      result.globalErrors.push(String(message));
      result.reasonIfNotAll =
        'BE không trả về cấu trúc errors/fieldErrors chuẩn, chỉ có trường message – không thể tách lỗi theo từng field DTO.';
    } else {
      result.reasonIfNotAll =
        'Không tìm thấy thuộc tính errors/fieldErrors/globalErrors trong JSON trả về – không thể map đầy đủ lỗi DTO.';
    }
  }

  result.raw = data;
  return result;
}


// ====== API dành riêng cho accountant ======

/**
 * POST /api/products/accountant
 */
export async function createProductForAccountant(
    payload: ProductCreateDto
) {
    const res = await axiosClient.post<Product>('/api/products/accountant/create', payload);
    return res.data;
}

/**
 * POST /api/products/upload-image
 * multipart/form-data: file + sku + imageOrder
 */
export async function uploadProductImage(
    file: File,
    sku: string,
    imageOrder: number
): Promise<UploadImageResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sku', sku);
    formData.append('imageOrder', String(imageOrder));

    const res = await axiosClient.post<UploadImageResponse>(
        '/api/products/upload-image',
        formData,
        {
            headers: {
                // để axios tự set boundary, chỉ cần kiểu multipart
                'Content-Type': 'multipart/form-data',
            },
        }
    );

    return res.data;
}

/**
 * POST /api/products/accountant/suggest-sku
 * Body: List<String> typeNames
 * Response: string sku gợi ý
 */
export async function suggestSkuForAccountant(
  typeNames: string[]
): Promise<string> {
  const res = await axiosClient.post<string>(
    '/api/products/accountant/suggest-sku',
    typeNames,
  );
  return res.data;
}



// ====== DTO cho AI validate/analyze images ======

export interface ProductImageBase64WithOrder {
  base64: string;
  imageOrder: number;
}

export interface ProductImageValidateRequestDto {
  images: ProductImageBase64WithOrder[];
}

export interface ProductImageAnalyzeRequestDto {
  images: ProductImageBase64WithOrder[];
  allowedTypeNames?: string[];
}

// Theo docs: FE dùng các field này để auto-fill form
export interface GeminiVisionResult {
  productName?: string;
  brand?: string;
  productDescription?: string;
  typeNames?: string[];
  needBetterImages?: boolean;
  [key: string]: unknown;
}

// ====== API AI – phân biệt rõ 2 loại: validate-only vs validate+analyze ======

/**
 * A. API validate hình ảnh bằng AI (chỉ moderation, không trả data điền form)
 * POST /api/products/ai/validate-images
 * Body: { base64Images: string[] }
 * 200 OK nếu hợp lệ, 400 với globalErrors nếu AI không chấp nhận
 */
export async function validateProductImagesAi(
  images: ProductImageBase64WithOrder[],
): Promise<void> {
  const payload: ProductImageValidateRequestDto = { images };
  await axiosClient.post<void>('/api/products/ai/validate-images', payload);
}
/**
 * B. API vừa validate vừa tự tạo các field liên quan bằng AI
 * (moderation + vision) – auto-fill form
 * POST /api/products/ai/analyze-images
 * Body: { base64Images: string[]; allowedTypeNames?: string[] }
 */
export async function analyzeProductImagesAi(
  images: ProductImageBase64WithOrder[],
  allowedTypeNames?: string[],
): Promise<GeminiVisionResult> {
  const payload: ProductImageAnalyzeRequestDto = {
    images,
    ...(allowedTypeNames && allowedTypeNames.length > 0
      ? { allowedTypeNames }
      : {}),
  };

  const res = await axiosClient.post<GeminiVisionResult>(
    '/api/products/ai/analyze-images',
    payload,
  );
  return res.data;
}

/* ====== THÊM MỚI: Update ====== */

export interface ProductImageUpdateDto extends ProductImageCreateDto {
  imageId?: number;
}

export interface ProductUpdateDto {
  sku: string;
  productName: string;
  brand: string;
  productDescription: string;
  unit: number;
  defaultRetailPrice: number;
  currency: 'USD' | 'VND';
  isTaxable: boolean;
  taxCode: number;
  isActive: boolean;
  image: ProductImageUpdateDto[];
  typeNames: string[];
}

/* ====== THÊM MỚI: PUT /api/products/accountant/{id} ====== */
export async function updateProductForAccountant(
  id: number | string,
  payload: ProductUpdateDto,
): Promise<Product> {
  const res = await axiosClient.put<Product>(
    `/api/products/accountant/update/${id}`,
    payload,
  );
  return res.data;
}

/* ================== ACCOUNTANT LIST API ================== */

export interface AccountantProductPageParams {
  page?: number;
  size?: number;
  keyword?: string;
  brand?: string[];
  minPrice?: number;
  maxPrice?: number;
  active?: boolean;
  types?: string[];
}

function toAccountantQueryString(p: AccountantProductPageParams): string {
  const sp = new URLSearchParams();
  if (p.page != null) sp.set("page", String(p.page));
  if (p.size != null) sp.set("size", String(p.size));
  if (p.keyword) sp.set("keyword", p.keyword);
  if (p.brand && p.brand.length) p.brand.forEach((b) => sp.append("brand", b));
  if (p.minPrice != null) sp.set("minPrice", String(p.minPrice));
  if (p.maxPrice != null) sp.set("maxPrice", String(p.maxPrice));
  if (p.active != null) sp.set("active", String(p.active));
  if (p.types && p.types.length) p.types.forEach((t) => sp.append("type", t));
  return sp.toString();
}

export async function fetchAllProductsForAccountant(): Promise<Product[]> {
  const res = await axiosClient.get<Product[]>("/api/products/accountant");
  return res.data ?? [];
}

export async function fetchAccountantProductsPage(
  params: AccountantProductPageParams = {}
): Promise<PageResponse<Product>> {
  const defaults: Required<Pick<AccountantProductPageParams, "page" | "size">> = {
    page: 0,
    size: 8,
  };
  const qs = toAccountantQueryString({ ...defaults, ...params });
  const res = await axiosClient.get<PageResponse<Product>>(
    `/api/products/accountant/page?${qs}`
  );
  return res.data;
}
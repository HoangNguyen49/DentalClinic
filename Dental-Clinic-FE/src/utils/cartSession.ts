// src/utils/cartSession.ts
import type { Product } from "../huybro_api/productApi";
import {
  fetchCart as fetchCartApi,
  addCartItem as addCartItemApi,
  updateCartItemQuantity as updateCartItemQuantityApi,
  removeCartItem as removeCartItemApi,
  clearCart as clearCartApi,
  type CartViewDto,
} from "../huybro_api/cartApi";

export interface CartItem {
  productId: number;
  name: string;
  sku: string;
  price: number;
  currency: string;
  quantity: number;
  thumbnailUrl?: string | null;
}

const CART_KEY = "sunshine_cart_v1";
export const CART_UPDATED_EVENT = "sunshine_cart_updated";

function getSessionStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function readRawCart(): CartItem[] {
  const storage = getSessionStorage();
  if (!storage) return [];
  const raw = storage.getItem(CART_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        typeof item.productId === "number" &&
        typeof item.name === "string" &&
        typeof item.price === "number" &&
        typeof item.currency === "string" &&
        typeof item.quantity === "number" &&
        item.quantity > 0
    );
  } catch {
    return [];
  }
}

function writeRawCart(items: CartItem[]): void {
  const storage = getSessionStorage();
  if (!storage) return;
  storage.setItem(CART_KEY, JSON.stringify(items));

  if (typeof window !== "undefined") {
    const event = new CustomEvent(CART_UPDATED_EVENT, { detail: { items } });
    window.dispatchEvent(event);
  }
}

// =====================
// Đồng bộ từ CartViewDto BE → CartItem FE (cache)
// =====================

function syncFromCartView(view: CartViewDto): void {
  const items: CartItem[] = (view.items ?? []).map((i) => ({
    productId: i.productId,
    name: i.productName,
    sku: i.sku,
    price: Number(i.unitPriceBeforeTax),
    currency: i.currency,
    quantity: i.quantity,
    thumbnailUrl: i.mainImageUrl ?? null,
  }));
  writeRawCart(items);
}

// =====================
// Public API đọc cache
// =====================

export function getCart(): CartItem[] {
  return readRawCart();
}

export function getCartItemCount(): number {
  return readRawCart().reduce((sum, item) => sum + item.quantity, 0);
}

// =====================
// Public API thao tác giỏ hàng (gọi BE + sync cache)
// =====================

export function clearCart(): void {
  clearCartApi()
    .then(() => {
      writeRawCart([]);
    })
    .catch(() => {
      // nếu BE lỗi vẫn clear local để tránh UI bị kẹt
      writeRawCart([]);
    });
}

// TỪ Product -> CartItem (tiện nếu chỗ khác vẫn dùng)
export function mapProductToCartItem(
  product: Product,
  quantity: number = 1
): CartItem {
  return {
    productId: product.productId,
    name: product.productName,
    sku: product.sku,
    price: Number(product.defaultRetailPrice),
    currency: product.currency,
    quantity: quantity > 0 ? quantity : 1,
    thumbnailUrl: product.image?.[0]?.imageUrl ?? null,
  };
}

// Thêm item vào giỏ từ CartItem (giờ là gọi BE)
export function addCartItem(item: CartItem): void {
  addCartItemApi({
    productId: item.productId,
    quantity: item.quantity,
  })
    .then((view) => {
      syncFromCartView(view);
    })
    .catch(() => {
      // có thể log nếu muốn, không ghi đè local để tránh lệch so với BE
    });
}

export function updateCartItemQuantity(
  productId: number,
  quantity: number
): void {
  updateCartItemQuantityApi({
    productId,
    quantity,
  })
    .then((view) => {
      syncFromCartView(view);
    })
    .catch(() => {
      // giữ nguyên cache cũ nếu BE lỗi
    });
}

export function removeCartItem(productId: number): void {
  removeCartItemApi(productId)
    .then((view) => {
      syncFromCartView(view);
    })
    .catch(() => {
      // giữ nguyên cache cũ nếu BE lỗi
    });
}

// Convenience: truyền Product trực tiếp (nút "Add to cart" đang dùng)
export function addProductToCart(
  product: Product,
  quantity: number = 1
): void {
  const safeQuantity = quantity > 0 ? quantity : 1;
  addCartItemApi({
    productId: product.productId,
    quantity: safeQuantity,
  })
    .then((view) => {
      syncFromCartView(view);
    })
    .catch(() => {
      // nếu muốn fallback local có thể dùng mapProductToCartItem + writeRawCart,
      // nhưng để tránh lệch so BE thì hiện tại không fallback.
    });
}

// (tuỳ chọn) Hàm này hữu ích nếu muốn sync cache với BE khi reload app
export function refreshCartFromServer(): void {
  fetchCartApi()
    .then((view) => {
      syncFromCartView(view);
    })
    .catch(() => {
      // không làm gì, giữ cache cũ
    });
}

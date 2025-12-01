// src/huybro_api/cartApi.ts
import axiosClient, { API_BASE_URL } from "./axiosClient";

export type CheckoutCurrency = "USD" | "VND";

export interface CartItemDto {
  productId: number;
  sku: string;
  productName: string;
  brand: string;
  mainImageUrl: string | null;

  quantity: number;

  unitPriceBeforeTax: number;
  taxRatePercent: number;
  taxAmount: number;
  unitPriceAfterTax: number;
  lineTotalAmount: number;

  currency: string;
}

export interface CartTotalsDto {
  subTotalBeforeTax: number;
  totalAfterTax: number;
}

export interface CartViewDto {
  items: CartItemDto[];
  totals: CartTotalsDto;
  invoiceCode: string;
  currency?: CheckoutCurrency | null;
  exchangeRateToVnd?: number | null;
}

export interface AddToCartRequestDto {
  productId: number;
  quantity: number;
}

export interface UpdateCartItemRequestDto {
  productId: number;
  quantity: number;
}

export type CartItem = CartItemDto;

export function getCartItemImageSrc(
  mainImageUrl: string | null | undefined
): string | null {
  if (!mainImageUrl) return null;

  return `${API_BASE_URL}${mainImageUrl}`;
}

export async function fetchCart(): Promise<CartViewDto> {
  const res = await axiosClient.get<CartViewDto>("/api/cart");
  return res.data;
}

export async function addCartItem(
  payload: AddToCartRequestDto
): Promise<CartViewDto> {
  const res = await axiosClient.post<CartViewDto>("/api/cart/items", payload);
  return res.data;
}

export async function updateCartItemQuantity(
  payload: UpdateCartItemRequestDto
): Promise<CartViewDto> {
  const res = await axiosClient.put<CartViewDto>("/api/cart/items", payload);
  return res.data;
}

export async function removeCartItem(
  productId: number
): Promise<CartViewDto> {
  const res = await axiosClient.delete<CartViewDto>(
    `/api/cart/items/${productId}`
  );
  return res.data;
}

export async function clearCart(): Promise<void> {
  await axiosClient.delete("/api/cart");
}

export async function fetchCheckoutPreview(
  currency: CheckoutCurrency
): Promise<CartViewDto> {
  const res = await axiosClient.get<CartViewDto>("/api/cart/checkout-preview", {
    params: { currency },
  });
  return res.data;
}
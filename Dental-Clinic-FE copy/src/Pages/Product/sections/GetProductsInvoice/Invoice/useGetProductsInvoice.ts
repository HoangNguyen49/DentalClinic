// src/Pages/Product/sections/GetProductsInvoice/useGetProductsInvoice.ts
import { useEffect, useState } from "react";
import { CART_UPDATED_EVENT } from "../../../../../utils/cartSession";
import {
  fetchCheckoutPreview,
  type CartItem as CartItemApi,
  type CheckoutCurrency,
} from "../../../../../huybro_api/cartApi";

export type InvoiceItem = CartItemApi;

export type UseGetProductsInvoiceResult = {
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string | null;
  taxRate: number;
  invoiceCode: string | null;
  checkoutCurrency: CheckoutCurrency;
  setCheckoutCurrency: (c: CheckoutCurrency) => void;
  exchangeRateToVnd: number | null;
};

export default function useGetProductsInvoice(
  defaultTaxRate: number = 0.1
): UseGetProductsInvoiceResult {
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [total, setTotal] = useState(0);
  const [currency, setCurrency] = useState<string | null>(null);
  const [taxRate, setTaxRate] = useState(defaultTaxRate);
  const [invoiceCode, setInvoiceCode] = useState<string | null>(null);

  // THÊM: state cho currency + tỷ giá
  const [checkoutCurrency, setCheckoutCurrency] =
    useState<CheckoutCurrency>("USD");
  const [exchangeRateToVnd, setExchangeRateToVnd] = useState<number | null>(
    null
  );

  useEffect(() => {
    const load = async () => {
      try {
        // dùng preview theo currency đang chọn
        const cart = await fetchCheckoutPreview(checkoutCurrency);

        const cartItems = cart.items ?? [];
        setItems(cartItems);

        const sub = Number(cart.totals?.subTotalBeforeTax ?? 0);
        const tot = Number(cart.totals?.totalAfterTax ?? 0);
        const taxAmount = tot - sub;

        setSubtotal(sub);
        setTotal(tot);
        setTax(taxAmount);

        // currency ưu tiên theo BE, fallback item đầu tiên
        setCurrency(cart.currency ?? cartItems[0]?.currency ?? null);
        setInvoiceCode(cart.invoiceCode ?? null);
        setExchangeRateToVnd(cart.exchangeRateToVnd ?? null);

        if (sub > 0 && taxAmount > 0) {
          setTaxRate(taxAmount / sub);
        } else {
          setTaxRate(0);
        }
      } catch {
        setItems([]);
        setSubtotal(0);
        setTax(0);
        setTotal(0);
        setCurrency(null);
        setInvoiceCode(null);
        setExchangeRateToVnd(null);
        setTaxRate(0);
      }
    };

    load();

    const handleCartUpdated = () => {
      // mỗi lần cart đổi (add/remove/change qty) → reload preview theo currency hiện tại
      load();
    };

    window.addEventListener(
      CART_UPDATED_EVENT,
      handleCartUpdated as EventListener
    );
    window.addEventListener("storage", handleCartUpdated);

    return () => {
      window.removeEventListener(
        CART_UPDATED_EVENT,
        handleCartUpdated as EventListener
      );
      window.removeEventListener("storage", handleCartUpdated);
    };
  }, [checkoutCurrency, defaultTaxRate]);

  return {
    items,
    subtotal,
    tax,
    total,
    currency,
    taxRate,
    invoiceCode,
    checkoutCurrency,
    setCheckoutCurrency,
    exchangeRateToVnd,
  };
}

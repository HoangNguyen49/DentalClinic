// src/Pages/Product/sections/GetProductsInvoice/usePaypal.ts
import { useState } from "react";
import { createPaypalOrderFromCart } from "../../../../../../huybro_api/checkoutPaymentApi";

export default function usePaypalPayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startPaypalCheckout = async () => {
    try {
      setError(null);
      setLoading(true);

      const res = await createPaypalOrderFromCart();

      if (!res.approveUrl) {
        setError("PayPal approve URL not found.");
        return;
      }

      window.location.href = res.approveUrl;
    } catch (err: any) {
      console.error("[usePaypal] create-order error", err);
      setError(
        err?.message || "Failed to create PayPal order. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    startPaypalCheckout,
  };
}

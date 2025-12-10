import { useState } from "react";
import { createVnpayUrl } from "../../../../../../huybro_api/checkoutPaymentApi";

export default function useVnpayPayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startVnpayCheckout = async () => {
    try {
      setError(null);
      setLoading(true);

      // Gọi BE lấy link
      const res = await createVnpayUrl();

      if (!res.paymentUrl) {
        setError("VNPay payment URL not found.");
        return;
      }

      // Redirect sang VNPay
      window.location.href = res.paymentUrl;
    } catch (err: any) {
      console.error("[useVnpayPayment] create-url error", err);
      setError(
        err?.message || "Failed to initiate VNPay payment. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    startVnpayCheckout,
  };
}
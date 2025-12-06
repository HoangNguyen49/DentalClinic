import { Loader2 } from "lucide-react";
import useVnpayPayment from "./useVnpayPayment"; 

export default function VnpayPayButton() {
  const { loading, error, startVnpayCheckout } = useVnpayPayment();

  return (
    <div className="w-full md:w-auto flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={startVnpayCheckout}
        disabled={loading}
        className="w-full md:w-auto flex items-center justify-center px-6 py-3 rounded-lg 
        border border-gray-300 bg-white hover:bg-gray-100 
        transition-colors disabled:opacity-60 disabled:cursor-not-allowed min-h-[48px]"
      >
        {loading ? (
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        ) : (
          <img
            src="https://pay.vnpay.vn/images/brands/logo-en.svg"
            alt="VNPay"
            className="h-6 w-auto object-contain"
          />
        )}
      </button>

      {error && (
        <div className="text-xs text-red-600 text-center max-w-xs">
          {error}
        </div>
      )}
    </div>
  );
}
import usePaypal from "./usePaypalPayment";

export default function PaypalPayButton() {
  const { loading, error, startPaypalCheckout } = usePaypal();

  return (
    <div className="w-full md:w-auto flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={startPaypalCheckout}
        disabled={loading}
        className="w-full md:w-auto flex items-center justify-center px-6 py-3 rounded-lg 
        border border-gray-300 bg-white hover:bg-gray-100 
        transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <img
          src="https://www.paypalobjects.com/marketing/web/logos/paypal-mark-color_new.svg"
          alt="PayPal Logo"
          className="h-6 w-auto mr-2"
        />
        <span className="text-sm font-semibold text-[#003087]">
          {loading ? "Processing..." : "PayPal"}
        </span>
      </button>

      {error && (
        <div className="text-xs text-red-600 text-center max-w-xs">
          {error}
        </div>
      )}
    </div>
  );
}

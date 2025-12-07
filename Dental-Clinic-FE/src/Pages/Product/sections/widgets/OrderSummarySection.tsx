import { Truck, CreditCard } from "lucide-react";
import { getCartItemImageSrc } from "../../../../huybro_api/cartApi";
import type { InvoiceItem } from "../GetProductsInvoice/Invoice/useGetProductsInvoice";
import { updateCartItemQuantity } from "../../../../utils/cartSession";
import type { CheckoutCurrency } from "../../../../huybro_api/cartApi";
import PaypalPayButton from "../GetProductsInvoice/Payments/paypal/PaypalPayButton";
import VnpayPayButton from "../GetProductsInvoice/Payments/vnpay/VnpayPayButton";

type PaymentMethod = "COD" | "BANK_TRANSFER";

type Props = {
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string | null;
  invoiceCode: string | null;
  checkoutCurrency: CheckoutCurrency;
  onChangeCurrency: (c: CheckoutCurrency) => void;
  formatMoney: (value: number, currency: string | null) => string;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange?: (m: PaymentMethod) => void;
};

export default function OrderSummarySection({
  items,
  subtotal,
  tax,
  total,
  currency,
  invoiceCode,
  checkoutCurrency,
  onChangeCurrency,
  formatMoney,
  paymentMethod,
  onPaymentMethodChange,
}: Props) {
  const visibleItems = items.filter((i) => i.quantity > 0);

  const handleIncrease = (item: InvoiceItem) => {
    const newQty = item.quantity + 1;
    updateCartItemQuantity(item.productId, newQty);
  };

  const handleDecrease = (item: InvoiceItem) => {
    const newQty = item.quantity - 1;

    if (newQty <= 0) {
      updateCartItemQuantity(item.productId, 0);
      return;
    }

    updateCartItemQuantity(item.productId, newQty);
  };

  const handleSelectPaymentMethod = (method: PaymentMethod) => {
    if (onPaymentMethodChange) {
      onPaymentMethodChange(method);
    }
  };

  // Logic disable nút dựa trên tiền tệ
  const paypalDisabled = checkoutCurrency !== "USD";
  const vnpayDisabled = checkoutCurrency !== "VND";

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
      <div className="p-6 md:p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Order Summary
        </h2>

        <div className="space-y-6">
          <div className="hidden sm:grid grid-cols-12 gap-4 pb-2 border-b border-gray-200">
            <div className="col-span-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Product
              </p>
            </div>
            <div className="col-span-2 text-center">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Quantity
              </p>
            </div>
            <div className="col-span-3 text-right">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Unit Price
              </p>
            </div>
            <div className="col-span-2 text-right">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Line Total
              </p>
            </div>
          </div>

          <div className="flow-root">
            <ul className="-my-6 divide-y divide-gray-200" role="list">
              {visibleItems.map((item) => {
                const priceBeforeTax = Number(item.unitPriceBeforeTax);
                const unitPriceAfterTax = Number(item.unitPriceAfterTax);
                const lineTotalAfterTax = Number(item.lineTotalAmount);
                const itemTaxRatePercent = Number(item.taxRatePercent ?? 0);
                const unitTaxAmount = unitPriceAfterTax - priceBeforeTax;

                const imageSrc = item.mainImageUrl
                  ? getCartItemImageSrc(item.mainImageUrl)
                  : null;

                return (
                  <li
                    key={item.productId}
                    className="py-6 flex flex-col sm:grid sm:grid-cols-12 sm:items-center sm:gap-4"
                  >
                    <div className="sm:col-span-5 flex items-start space-x-4">
                      <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                        {imageSrc ? (
                          <img
                            src={imageSrc}
                            alt={item.productName}
                            className="h-full w-full object-cover object-center"
                          />
                        ) : null}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {item.productName}
                        </p>
                        {item.sku && (
                          <p className="mt-1 text-sm text-gray-500">
                            SKU: {item.sku}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="sm:col-span-2 flex items-center justify-between mt-4 sm:mt-0">
                      <span className="sm:hidden text-sm text-gray-500">
                        Quantity
                      </span>
                      <div className="w-full flex items-center justify-center sm:justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDecrease(item)}
                          className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100 active:scale-95 transition"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="min-w-[32px] text-center text-gray-900 text-sm">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleIncrease(item)}
                          className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100 active:scale-95 transition"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="sm:col-span-3 flex items-center justify-between mt-2 sm:mt-0">
                      <span className="sm:hidden text-sm text-gray-500">
                        Unit Price
                      </span>
                      <div className="w-full text-right text-xs sm:text-sm">
                        <div className="text-gray-500">Before tax</div>
                        <div className="text-gray-900">
                          {formatMoney(priceBeforeTax, currency)}
                        </div>
                        {itemTaxRatePercent > 0 && (
                          <>
                            <div className="mt-1 text-gray-500">
                              Tax ({Math.round(itemTaxRatePercent)}%)
                            </div>
                            <div className="text-gray-900">
                              {formatMoney(unitTaxAmount, currency)}
                            </div>
                            <div className="mt-1 text-gray-500">
                              After tax
                            </div>
                            <div className="font-semibold text-gray-900">
                              {formatMoney(unitPriceAfterTax, currency)}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="sm:col-span-2 flex items-center justify-between mt-2 sm:mt-0">
                      <span className="sm:hidden text-sm text-gray-500">
                        Line Total
                      </span>
                      <div className="w-full text-right">
                        <div className="font-medium text-gray-900">
                          {formatMoney(lineTotalAfterTax, currency)}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <div className="w-full max-w-sm space-y-3 text-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Currency</span>
              <div className="inline-flex rounded-full border border-gray-300 overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => onChangeCurrency("USD")}
                  className={[
                    "px-3 py-1 font-medium",
                    checkoutCurrency === "USD"
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100",
                  ].join(" ")}
                >
                  USD ($)
                </button>
                <button
                  type="button"
                  onClick={() => onChangeCurrency("VND")}
                  className={[
                    "px-3 py-1 font-medium border-l border-gray-300",
                    checkoutCurrency === "VND"
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100",
                  ].join(" ")}
                >
                  VND (đ)
                </button>
              </div>
            </div>
            <div className="flex justify-between">
              <span>Subtotal (before tax)</span>
              <span>{formatMoney(subtotal, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>{formatMoney(tax, currency)}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm text-gray-500">
              <span>Invoice code</span>
              <span className="font-mono tracking-wider text-gray-900">
                {invoiceCode ?? "-"}
              </span>
            </div>
            <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200 mt-2">
              <span>Total (after tax)</span>
              <span>{formatMoney(total, currency)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 px-6 md:px-8 py-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Payment Method</h3>
        <p className="text-sm text-gray-500 mt-1">
          Select your preferred payment method.
        </p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleSelectPaymentMethod("COD")}
            className={[
              "flex items-center justify-center text-center p-4 rounded-lg transition-colors",
              paymentMethod === "COD"
                ? "border-2 border-primary bg-blue-50"
                : "border border-gray-300 bg-white hover:bg-gray-100",
            ].join(" ")}
          >
            <Truck className="w-5 h-5 mr-3 text-primary" />
            <span className="font-medium">Cash on Delivery</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectPaymentMethod("BANK_TRANSFER")}
            // [ĐÃ SỬA] justifycenter -> justify-center
            className={[
              "flex items-center justify-center text-center p-4 rounded-lg transition-colors",
              paymentMethod === "BANK_TRANSFER"
                ? "border-2 border-primary bg-blue-50"
                : "border border-gray-300 bg-white hover:bg-gray-100",
            ].join(" ")}
          >
            <CreditCard className="w-5 h-5 mr-3 text-primary" />
            <span className="font-medium text-primary">Bank Transfer</span>
          </button>
        </div>

        {paymentMethod === "BANK_TRANSFER" && (
          <div className="mt-6 p-6 bg-white rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-4 text-center">
              Choose a transfer method
            </h4>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              {/* PayPal Button */}
              <div
                className={[
                  "w-full md:w-auto flex flex-col items-center",
                  paypalDisabled ? "opacity-60 pointer-events-none" : "",
                ].join(" ")}
              >
                <PaypalPayButton />
                {paypalDisabled && (
                  <p className="mt-2 text-xs text-red-600 text-center">
                    Only available for USD
                  </p>
                )}
              </div>

              {/* VNPay Button */}
              <div
                className={[
                  "w-full md:w-auto flex flex-col items-center",
                  vnpayDisabled ? "opacity-60 pointer-events-none" : "",
                ].join(" ")}
              >
                <VnpayPayButton />
                {vnpayDisabled && (
                  <p className="mt-2 text-xs text-red-600 text-center">
                    Only available for VND
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
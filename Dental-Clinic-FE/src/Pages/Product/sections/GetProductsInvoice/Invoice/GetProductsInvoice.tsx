import { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import useGetProductsInvoice from "./useGetProductsInvoice";
import useCheckoutContactInfo from "./useCheckoutContactInfo";

import OrderSummarySection from "../../widgets/OrderSummarySection";
import ConfirmationSummarySection from "../../widgets/ConfirmationSummarySection";
import { formatMoney } from "../../../../../utils/format";
import { clearCart as clearCartUI } from "../../../../../utils/cartSession";
import {
  createCodInvoice,
  capturePaypalOrder,
  verifyAndCaptureVnpay, 
  type CheckoutInvoiceDto,
  extractCheckoutValidationErrors,
} from "../../../../../huybro_api/checkoutPaymentApi";

type PaymentMethod = "COD" | "BANK_TRANSFER";
type FieldErrors = Record<string, string[]>;

type CheckoutFormState = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  note: string;
};

export default function GetProductsInvoice() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const paypalToken = searchParams.get("token");
  const vnpSecureHash = searchParams.get("vnp_SecureHash");
  const isVnpayReturn = !!vnpSecureHash;
  const confirmationRef = useRef<HTMLDivElement>(null);

  const {
    items,
    subtotal,
    tax,
    total,
    currency,
    invoiceCode,
    checkoutCurrency,
    setCheckoutCurrency,
  } = useGetProductsInvoice(0.1);

  const { contact } = useCheckoutContactInfo();
  const isLoggedIn = !!contact;

  const isEmpty = items.filter((i) => i.quantity > 0).length === 0;

  // ------------------ Payment Method ------------------
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() => {
    // [SỬA] Nếu có token PayPal hoặc VNPay params -> set BANK_TRANSFER
    if (paypalToken || isVnpayReturn) return "BANK_TRANSFER";
    
    const saved = localStorage.getItem("checkout:paymentMethod");
    return saved === "BANK_TRANSFER" ? "BANK_TRANSFER" : "COD";
  });

  useEffect(() => {
    localStorage.setItem("checkout:paymentMethod", paymentMethod);
  }, [paymentMethod]);

  // ------------------ Form State ------------------
  const [form, setForm] = useState<CheckoutFormState>({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    note: "",
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<CheckoutInvoiceDto | null>(null);

  useEffect(() => {
    if (contact) {
      setForm((prev) => ({
        ...prev,
        fullName: contact.fullName || "",
        email: contact.email || "",
        phone: contact.phone || "",
      }));
    }
  }, [contact]);

  useEffect(() => {
    if (paypalToken || isVnpayReturn) {
      setPaymentMethod("BANK_TRANSFER");
      setTimeout(() => {
        confirmationRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 500);
    }
  }, [paypalToken, isVnpayReturn]);

  // ------------------ Computed Labels ------------------
  const paymentMethodLabel = useMemo(() => {
    if (createdInvoice) {
      return `${createdInvoice.paymentMethod} - ${createdInvoice.paymentChannel}`;
    }
    if (paypalToken) return "PayPal (Authorized)";
    if (isVnpayReturn) return "VNPay (Authorized)"; // [THÊM]
    
    return paymentMethod === "COD" ? "Cash on Delivery" : "Bank Transfer";
  }, [paymentMethod, createdInvoice, paypalToken, isVnpayReturn]);

  const effectiveTotal = createdInvoice?.totalAmount ?? total;
  const effectiveCurrency = (createdInvoice?.currency as string) || currency || "USD";

  const handleChangeField = (field: keyof CheckoutFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // ------------------ Handle Confirm ------------------
  const handleConfirmOrder = async () => {
    if (isEmpty && !paypalToken && !isVnpayReturn) return;

    setSubmitting(true);
    setGlobalError(null);
    setFieldErrors({});

    const payload = {
      paymentType: paymentMethod,
      paymentChannel: paymentMethod === "COD" ? "CASH_ON_DELIVERY" : undefined, // VNPay/PayPal tự set channel
      currency: currency || checkoutCurrency || "USD",
      customerFullName: isLoggedIn ? undefined : form.fullName || undefined,
      customerEmail: isLoggedIn ? undefined : form.email || undefined,
      customerPhone: form.phone || undefined,
      shippingAddress: form.address,
      note: form.note || undefined,
    };

    try {
      let result: CheckoutInvoiceDto;

      if (paypalToken) {
        // CASE 1: PayPal Capture
        result = await capturePaypalOrder(paypalToken, { ...payload, paymentChannel: "PAYPAL" });
        setSearchParams({});
      
      } else if (isVnpayReturn) {
        // CASE 2: VNPay Verify & Capture
        const vnpParams: Record<string, string> = {};
        searchParams.forEach((value, key) => {
           vnpParams[key] = value;
        });
        result = await verifyAndCaptureVnpay(vnpParams, { ...payload, paymentChannel: "VNPAY" });
        setSearchParams({});

      } else {
        // CASE 3: COD
        if (paymentMethod !== "COD") return;
        result = await createCodInvoice({ ...payload, paymentChannel: "CASH_ON_DELIVERY" });
      }

      setCreatedInvoice(result);
      clearCartUI();
      
    } catch (err: any) {
      const { fieldErrors: fe, globalErrors } = extractCheckoutValidationErrors(err);
      setFieldErrors(fe);
      setGlobalError(globalErrors[0] ?? "An error occurred while processing your order.");
    } finally {
      setSubmitting(false);
    }
  };

  const canConfirm = useMemo(() => {
    if (submitting || createdInvoice) return false;
    
    if (paypalToken || isVnpayReturn) return true; 

    if (paymentMethod === "COD") {
       return !isEmpty && isLoggedIn;
    }

    return false; 
  }, [submitting, createdInvoice, paypalToken, isVnpayReturn, paymentMethod, isEmpty, isLoggedIn]);


  // ======================== RENDER ==============================
  return (
    <div className="min-h-screen font-display bg-white text-gray-800">
      <main className="py-12 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            
            <div className="text-center mb-10">
              <h1 className="text-4xl md:text-5xl font-bold mb-3">Your Order</h1>
              <p className="text-lg text-gray-500">
                Please review your items and choose a payment method.
              </p>
            </div>

            {isEmpty && !createdInvoice && !paypalToken && !isVnpayReturn ? (
              <div className="bg-white rounded-lg shadow-lg border p-8 text-center">
                <p className="text-gray-600">Your cart is empty.</p>
              </div>
            ) : (
              <>
                {/* 1. Order Summary */}
                <OrderSummarySection
                  items={items}
                  subtotal={subtotal}
                  tax={tax}
                  total={total}
                  currency={currency}
                  invoiceCode={invoiceCode}
                  checkoutCurrency={checkoutCurrency}
                  onChangeCurrency={setCheckoutCurrency}
                  formatMoney={formatMoney}
                  paymentMethod={paymentMethod}
                  onPaymentMethodChange={(m) => !paypalToken && !isVnpayReturn && setPaymentMethod(m)} 
                />

                {/* 2. Confirmation Summary */}
                <div ref={confirmationRef}>
                    <ConfirmationSummarySection
                        total={effectiveTotal}
                        currency={effectiveCurrency}
                        formatMoney={formatMoney}
                        contact={createdInvoice ? {
                            fullName: createdInvoice.customerFullName || "",
                            email: createdInvoice.customerEmail || "",
                            phone: createdInvoice.customerPhone || ""
                        } : isLoggedIn ? contact : null}
                        
                        address={createdInvoice?.shippingAddress || form.address}
                        paymentMethodLabel={paymentMethodLabel}
                        paymentCompletedTime={createdInvoice?.paymentCompletedAt}
                        
                        editableForm={createdInvoice ? undefined : form}
                        isLoggedIn={isLoggedIn}
                        paymentMethod={paymentMethod}
                        
                        fieldErrors={fieldErrors}
                        globalError={globalError}
                        onChangeField={handleChangeField}
                        
                        onConfirm={handleConfirmOrder}
                        confirmDisabled={!canConfirm}
                        confirmLabel={
                            createdInvoice 
                            ? "Order Completed" 
                            : (paypalToken || isVnpayReturn)
                                ? "Confirm & Complete Payment"
                                : paymentMethod === "COD"
                                    ? isLoggedIn ? "Place Order (COD)" : "Login to Order"
                                    : "Proceed above with Payment"
                        }
                    />
                </div>

                {/* 3. Success Message */}
                {createdInvoice && (
                  <div className="mt-6 bg-green-50 border border-green-200 text-green-800 rounded-md p-6 shadow-sm">
                    <div className="flex items-center mb-2">
                        <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        <h3 className="text-lg font-bold">Order Placed Successfully!</h3>
                    </div>
                    <div className="ml-8 text-sm space-y-1">
                        <p>Invoice Code: <span className="font-mono font-bold">{createdInvoice.invoiceCode}</span></p>
                        <p>Payment Status: <span className="font-bold">{createdInvoice.paymentStatus}</span></p>
                        <p>Method: <span className="font-semibold">{createdInvoice.paymentChannel}</span></p>
                        <p>A confirmation email has been sent to {createdInvoice.customerEmail}.</p>
                        <button onClick={() => navigate("/")} className="mt-4 text-blue-600 hover:underline">
                            Return to Home
                        </button>
                    </div>
                  </div>
                )}
                
                {/* 4. Payment Return Message Block */}
                {(paypalToken || isVnpayReturn) && !createdInvoice && !globalError && (
                    <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded border border-blue-200 flex items-start">
                         <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                         <div>
                             <p className="font-semibold">
                                {isVnpayReturn ? "VNPay payment authorized!" : "PayPal payment authorized!"}
                             </p>
                             <p className="text-sm">Please verify your shipping details above and click <b>"Confirm & Complete Payment"</b> to finish.</p>
                         </div>
                    </div>
                )}

              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
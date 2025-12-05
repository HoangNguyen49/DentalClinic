import { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom"; // Thêm useSearchParams, useNavigate
import useGetProductsInvoice from "./useGetProductsInvoice";
import useCheckoutContactInfo from "./useCheckoutContactInfo";

import OrderSummarySection from "../../widgets/OrderSummarySection";
import ConfirmationSummarySection from "../../widgets/ConfirmationSummarySection";
import { formatMoney } from "../../../../../utils/format";

import type { CheckoutContactInfoDto } from "../../../../../huybro_api/checkoutApi";
import {
  createCodInvoice,
  capturePaypalOrder, // Import hàm capture
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
  const paypalToken = searchParams.get("token"); // Lấy token từ URL khi PayPal trả về

  // Ref để cuộn trang
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
    // Nếu có token PayPal -> tự động set là BANK_TRANSFER
    if (paypalToken) return "BANK_TRANSFER";
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

  // Autofill thông tin khi login
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

  // LOGIC MỚI: Xử lý khi quay lại từ PayPal
  useEffect(() => {
    if (paypalToken) {
      // 1. Set phương thức thanh toán đúng
      setPaymentMethod("BANK_TRANSFER");
      // 2. Cuộn xuống phần confirm
      setTimeout(() => {
        confirmationRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 500);
    }
  }, [paypalToken]);

  // ------------------ Computed Labels ------------------
  const paymentMethodLabel = useMemo(() => {
    if (createdInvoice) {
      return `${createdInvoice.paymentMethod} - ${createdInvoice.paymentChannel}`;
    }
    if (paypalToken) return "PayPal (Authorized)"; // Label đặc biệt khi đã về từ PayPal
    return paymentMethod === "COD" ? "Cash on Delivery" : "Bank Transfer - PayPal";
  }, [paymentMethod, createdInvoice, paypalToken]);

  const effectiveTotal = createdInvoice?.totalAmount ?? total;
  const effectiveCurrency = (createdInvoice?.currency as string) || currency || "USD";

  // ------------------ Handlers ------------------
  const handleChangeField = (field: keyof CheckoutFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // Hàm xử lý chung cho nút Confirm
  const handleConfirmOrder = async () => {
    // Validate cơ bản
    if (isEmpty && !paypalToken) return;

    setSubmitting(true);
    setGlobalError(null);
    setFieldErrors({});

    // Payload chung
    const payload = {
      paymentType: paymentMethod,
      paymentChannel: paymentMethod === "COD" ? "CASH_ON_DELIVERY" : "PAYPAL",
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
        // CASE 1: Đã đi PayPal về -> Gọi Capture
        result = await capturePaypalOrder(paypalToken, payload);
        
        // Xóa token trên URL để tránh user refresh bị lỗi hoặc capture lại
        setSearchParams({}); 
      } else {
        // CASE 2: COD (Logic cũ)
        if (paymentMethod !== "COD") return; // Should not happen logic wise
        result = await createCodInvoice(payload);
      }

      setCreatedInvoice(result);
      
      // Nếu là PayPal capture xong -> Có thể navigate đi chỗ khác hoặc hiện thông báo
      // Ở đây tôi giữ nguyên UI hiển thị Success Message bên dưới
    } catch (err: any) {
      const { fieldErrors: fe, globalErrors } = extractCheckoutValidationErrors(err);
      setFieldErrors(fe);
      setGlobalError(globalErrors[0] ?? "An error occurred while processing your order.");
    } finally {
      setSubmitting(false);
    }
  };

  // Logic enable nút Confirm
  const canConfirm = useMemo(() => {
    if (submitting || createdInvoice) return false;
    
    // Nếu là PayPal returning -> Cho phép confirm để Capture (cần điền address)
    if (paypalToken) return true; 

    // Nếu là COD -> Cần giỏ hàng có hàng + User login (nếu bắt buộc)
    if (paymentMethod === "COD") {
        return !isEmpty && isLoggedIn;
    }

    // Nếu đang chọn PayPal mà chưa đi (chưa có token) -> Nút này ẩn/disable (vì phải bấm nút vàng PayPal ở trên)
    return false; 
  }, [submitting, createdInvoice, paypalToken, paymentMethod, isEmpty, isLoggedIn]);


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

            {/* Empty cart notification (chỉ hiện khi chưa có kết quả invoice và không phải đang xử lý PayPal) */}
            {isEmpty && !createdInvoice && !paypalToken ? (
              <div className="bg-white rounded-lg shadow-lg border p-8 text-center">
                <p className="text-gray-600">Your cart is empty.</p>
              </div>
            ) : (
              <>
                {/* 1. Order Summary */}
                {/* Ẩn phần chọn payment method khi đã có token PayPal để tránh user đổi lung tung */}
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
                  onPaymentMethodChange={(m) => !paypalToken && setPaymentMethod(m)} 
                />

                {/* 2. Confirmation Summary (Form Address) */}
                <div ref={confirmationRef}>
                    <ConfirmationSummarySection
                    total={effectiveTotal}
                    currency={effectiveCurrency}
                    formatMoney={formatMoney}
                    contact={createdInvoice ? {
                        fullName: createdInvoice.customerFullName || "",
                        email: createdInvoice.customerEmail || "",
                        phone: createdInvoice.customerPhone || ""
                    } : isLoggedIn ? contact : null} // Fix logic hiển thị contact
                    
                    address={createdInvoice?.shippingAddress || form.address}
                    paymentMethodLabel={paymentMethodLabel}
                    paymentCompletedTime={createdInvoice?.paymentCompletedAt}
                    
                    // Form Mode
                    editableForm={createdInvoice ? undefined : form}
                    isLoggedIn={isLoggedIn}
                    paymentMethod={paymentMethod}
                    
                    fieldErrors={fieldErrors}
                    globalError={globalError}
                    onChangeField={handleChangeField}
                    
                    // Button Logic
                    onConfirm={handleConfirmOrder}
                    confirmDisabled={!canConfirm}
                    confirmLabel={
                        createdInvoice 
                        ? "Order Completed" 
                        : paypalToken 
                            ? "Confirm & Complete Payment" // Label cho bước Capture
                            : paymentMethod === "COD"
                                ? isLoggedIn ? "Place Order (COD)" : "Login to Order"
                                : "Proceed above with PayPal" // Fallback text
                    }
                    />
                </div>

                {/* 3. Success Message Block */}
                {createdInvoice && (
                  <div className="mt-6 bg-green-50 border border-green-200 text-green-800 rounded-md p-6 shadow-sm">
                    <div className="flex items-center mb-2">
                        <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        <h3 className="text-lg font-bold">Order Placed Successfully!</h3>
                    </div>
                    <div className="ml-8 text-sm space-y-1">
                        <p>Invoice Code: <span className="font-mono font-bold">{createdInvoice.invoiceCode}</span></p>
                        <p>Payment Status: <span className="font-bold">{createdInvoice.paymentStatus}</span></p>
                        <p>A confirmation email has been sent to {createdInvoice.customerEmail}.</p>
                        <button onClick={() => navigate("/")} className="mt-4 text-blue-600 hover:underline">
                            Return to Home
                        </button>
                    </div>
                  </div>
                )}
                
                {/* 4. PayPal Return Message Block (Trước khi capture) */}
                {paypalToken && !createdInvoice && !globalError && (
                    <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded border border-blue-200 flex items-start">
                         <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                         <div>
                             <p className="font-semibold">PayPal payment authorized!</p>
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
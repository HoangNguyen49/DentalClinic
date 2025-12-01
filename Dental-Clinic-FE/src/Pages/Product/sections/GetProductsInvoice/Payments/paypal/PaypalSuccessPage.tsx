import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  capturePaypalOrder,
  extractCheckoutValidationErrors,
  type CheckoutCreateRequestDto,
  type CheckoutInvoiceDto,
} from "../../../../../../huybro_api/checkoutPaymentApi"; 
import ConfirmationSummarySection from "../../../widgets/ConfirmationSummarySection"; 
import useCheckoutContactInfo from "../../Invoice/useCheckoutContactInfo"; 

export default function PaypalSuccessPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token"); // PayPal Order ID
  const navigate = useNavigate();

  // State form
  const { contact } = useCheckoutContactInfo(); // Nếu user login, lấy info điền sẵn
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    note: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [invoice, setInvoice] = useState<CheckoutInvoiceDto | null>(null);

  // Autofill nếu đã login
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

  // Nếu không có token -> Về trang chủ hoặc báo lỗi
  if (!token) {
    return (
      <div className="p-10 text-center text-red-600">
        Invalid Payment Token. Please return to cart.
      </div>
    );
  }

  // Handle Capture
  const handleConfirmCapture = async () => {
    setSubmitting(true);
    setError(null);
    setFieldErrors({});

    // Payload: PaymentType là BANK_TRANSFER, nhưng kèm Token PayPal
    const payload: CheckoutCreateRequestDto = {
      paymentType: "BANK_TRANSFER",
      paymentChannel: "PAYPAL",
      currency: "USD", // PayPal bắt buộc USD

      // Nếu login thì BE tự lấy info, nhưng gửi lên cũng không sao (BE ưu tiên info từ DB)
      // Nếu Guest thì bắt buộc phải có
      customerFullName: form.fullName,
      customerEmail: form.email,
      customerPhone: form.phone,
      shippingAddress: form.address,
      note: form.note,
    };

    try {
      const res = await capturePaypalOrder(token, payload);
      setInvoice(res);
      // Thành công -> Chuyển hướng hoặc hiện thông báo
      setTimeout(() => {
         navigate(`/cart?paypal_success=1&invoiceCode=${res.invoiceCode}`);
      }, 3000);
    } catch (err: any) {
      console.error("Capture Error", err);
      const { fieldErrors: fe, globalErrors } = extractCheckoutValidationErrors(err);
      setFieldErrors(fe);
      setError(globalErrors[0] || "Payment capture failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear error field khi user type
    setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
    });
  };

  // Render UI
  if (invoice) {
    return (
       <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">Invoice <b>{invoice.invoiceCode}</b> has been created.</p>
          <p className="text-sm text-gray-500">Redirecting to history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              {/* Icon info */}
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Payment authorized via PayPal. Please confirm your delivery details to complete the order.
              </p>
            </div>
          </div>
        </div>

        {/* Reuse ConfirmationSummarySection để hiện form */}
        {/* Lưu ý: Total ở đây ta không có sẵn vì không gọi API cart, 
            nhưng PayPal đã auth số tiền rồi. Có thể hiện 0 hoặc lấy từ context nếu muốn kỹ.
            Ở đây ta tập trung vào Form Address */}
        
        <ConfirmationSummarySection
            total={0} // Hoặc truyền số tiền nếu lưu ở localStorage lúc redirect
            currency="USD"
            formatMoney={(v, c) => `${c} ${v}`} // Format đơn giản
            contact={contact}
            
            // Form Mode
            editableForm={form}
            isLoggedIn={!!contact}
            paymentMethod="BANK_TRANSFER"
            paymentMethodLabel="PayPal (Authorized)"
            
            fieldErrors={fieldErrors}
            globalError={error}
            onChangeField={handleChangeField}
            
            onConfirm={handleConfirmCapture}
            confirmLabel={submitting ? "Processing..." : "Confirm & Complete Order"}
            confirmDisabled={submitting}
        />
      </div>
    </div>
  );
}
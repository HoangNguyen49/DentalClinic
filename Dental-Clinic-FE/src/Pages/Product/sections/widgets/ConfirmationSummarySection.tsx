// src/Pages/Product/widgets/ConfirmationSummarySection.tsx
import { Lock } from "lucide-react";
import type { CheckoutContactInfoDto } from "../../../../huybro_api/checkoutApi";
import AddressAutocompleteInput from "./AddressAutocompleteInput";

type CheckoutFormView = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  note: string;
};

type Props = {
  total: number;
  currency: string | null;
  formatMoney: (value: number, currency: string | null) => string;
  contact?: CheckoutContactInfoDto | null;

  // Dùng cho cả COD + PayPal
  address?: string | null;
  paymentMethodLabel?: string | null;
  paymentCompletedTime?: string | null;

  // Nút confirm
  onConfirm?: () => void;
  confirmLabel?: string;
  confirmDisabled?: boolean;

  // ====== MODE FORM (Checkout page) ======
  // Có 2 mode:
  //  - Nếu KHÔNG truyền editableForm/onChangeField => giữ UI cũ (read-only)
  //  - Nếu CÓ => hiển thị form Contact & Shipping
  editableForm?: CheckoutFormView;
  isLoggedIn?: boolean;
  paymentMethod?: "COD" | "BANK_TRANSFER";
  fieldErrors?: Record<string, string[]>;
  globalError?: string | null;
  onChangeField?: (field: keyof CheckoutFormView, value: string) => void;
};

export default function ConfirmationSummarySection({
  total,
  currency,
  formatMoney,
  contact,
  address,
  paymentMethodLabel,
  paymentCompletedTime,
  onConfirm,
  confirmLabel,
  confirmDisabled,

  editableForm,
  isLoggedIn = false,
  fieldErrors,
  globalError,
  onChangeField,
}: Props) {
  const hasEditableForm = !!editableForm && !!onChangeField;

  const fullName = contact?.fullName ?? "";
  const email = contact?.email ?? "";
  const phone = contact?.phone ?? "";

  const displayAddress =
    address || editableForm?.address || "123 ABC Street, Ward 4, District 5, Ho Chi Minh City";

  const displayPaymentMethod =
    paymentMethodLabel || "Bank Transfer - VNPay";

  const displayCompletedTime = paymentCompletedTime || "-";

  const renderFieldError = (field: string) =>
    fieldErrors?.[field]?.map((msg) => (
      <div key={msg} className="mt-1 text-xs text-red-600">
        {msg}
      </div>
    ));

  // ========== MODE CŨ: READ-ONLY (PayPalSuccessPage, v.v.) ==========
  if (!hasEditableForm) {
    return (
      <>
        <div className="mt-8 bg-white rounded-lg shadow-lg border border-gray-200 p-6 md:p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Confirmation Summary
          </h2>
          <div className="space-y-4 text-gray-700">
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-gray-500">Payment Completion Time</span>
              <span className="font-medium text-gray-900">
                {displayCompletedTime}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 ">
              <span className="text-gray-500">Full Name</span>
              <span className="font-medium text-gray-900">{fullName}</span>
            </div>

            <div className="flex justify-between items-center py-2 ">
              <span className="text-gray-500">Email</span>
              <span className="font-medium text-gray-900">{email}</span>
            </div>

            <div className="flex justify-between items-center py-2 ">
              <span className="text-gray-500">Phone</span>
              <span className="font-medium text-gray-900">{phone}</span>
            </div>

            <div className="flex justify-between items-start py-2 ">
              <span className="text-gray-500 flex-shrink-0 mr-4">
                Address
              </span>
              <span className="font-medium text-gray-900 text-right">
                {displayAddress}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 ">
              <span className="text-gray-500">Payment Method</span>
              <span className="font-medium text-gray-900">
                {displayPaymentMethod}
              </span>
            </div>

            <div className="flex justify-between items-center pt-4 mt-2">
              <span className="text-lg text-gray-500">Amount to be paid</span>
              <span className="text-2xl font-bold text-primary">
                {formatMoney(total, currency)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmDisabled}
            className="flex items-center justify-center w-full sm:w-auto space-x-2 bg-primary text-white px-8 py-3.5 rounded-lg text-base font-semibold hover:bg-blue-600 transition-all duration-300 shadow-lg shadow-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/50 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Lock className="w-5 h-5" />
            <span>{confirmLabel || "Complete Payment"}</span>
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="mt-8 bg-white rounded-lg shadow-lg border border-gray-200 p-6 md:p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Confirmation Summary
        </h2>

        <div className="space-y-4 text-gray-700">
          {/* Payment time */}
          <div className="flex justify-between items-center py-2 ">
            <span className="text-gray-500">Payment Completion Time</span>
            <span className="font-medium text-gray-900">
              {displayCompletedTime}
            </span>
          </div>

          {/* FullName */}
          <div className="py-2 ">
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-500">Full Name</span>
              {!isLoggedIn && (
                <span className="text-xs text-red-500 ml-2">*</span>
              )}
            </div>
            {isLoggedIn ? (
              <div className="px-3 py-2 text-sm rounded-md bg-gray-50 border border-gray-200 text-gray-700">
                {contact?.fullName || "-"}
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={editableForm.fullName}
                  onChange={(e) => onChangeField("fullName", e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full border-b border-gray-300 rounded-none px-0 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-0 bg-transparent placeholder:text-gray-400 transition-colors"
                />
                {renderFieldError("customerFullName")}
              </>
            )}
          </div>

          {/* Email */}
          <div className="py-2 ">
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-500">Email</span>
              {!isLoggedIn && (
                <span className="text-xs text-red-500 ml-2">*</span>
              )}
            </div>
            {isLoggedIn ? (
              <div className="px-3 py-2 text-sm rounded-md bg-gray-50 border border-gray-200 text-gray-700">
                {contact?.email || "-"}
              </div>
            ) : (
              <>
                <input
                  type="email"
                  value={editableForm.email}
                  onChange={(e) => onChangeField("email", e.target.value)}
                  placeholder="Enter your email"
                  className="w-full border-b border-gray-300 rounded-none px-0 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-0 bg-transparent placeholder:text-gray-400 transition-colors"
                />
                {renderFieldError("customerEmail")}
              </>
            )}
          </div>

          {/* Phone */}
          <div className="py-2 ">
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-500">Phone</span>
              {!isLoggedIn && (
                <span className="text-xs text-red-500 ml-2">*</span>
              )}
            </div>
            <input
              type="text"
              value={editableForm.phone}
              onChange={(e) => onChangeField("phone", e.target.value)}
              placeholder="Enter phone number"
              className="w-full border-b border-gray-300 rounded-none px-0 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-0 bg-transparent placeholder:text-gray-400 transition-colors"
            />
            {renderFieldError("customerPhone")}
          </div>
          
          {/* Address */}
          <div className="py-2">
            <AddressAutocompleteInput 
              value={editableForm?.address || ""} 
              onChange={(val) => onChangeField?.("address", val)} 
              error={renderFieldError("shippingAddress")}
            />
          </div>

          {/* Note */}
          <div className="py-2 ">
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-500">Note</span>
              <span className="text-xs text-gray-400 ml-2">(optional)</span>
            </div>
            <textarea
              value={editableForm.note}
              onChange={(e) => onChangeField("note", e.target.value)}
              rows={3}
              placeholder="Any additional notes for your order..."
              className="w-full border-b border-gray-300 rounded-none px-0 py-2 text-sm focus:outline-none focus:border-blue-600 focus:ring-0 bg-transparent placeholder:text-gray-400 transition-colors"
            />
            {renderFieldError("note")}
          </div>

          {/* Payment method */}
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-gray-500">Payment Method</span>
            <span className="font-medium text-gray-900">
              {displayPaymentMethod}
            </span>
          </div>

          {/* Amount */}
          <div className="flex justify-between items-center pt-4 mt-2">
            <span className="text-lg text-gray-500">Amount to be paid</span>
            <span className="text-2xl font-bold text-primary">
              {formatMoney(total, currency)}
            </span>
          </div>

          {/* Global error (bên phải) */}
          {globalError && (
            <div className="pt-2 flex justify-end">
              <div className="text-sm text-red-600 text-right max-w-sm">
                {globalError}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={onConfirm}
          disabled={confirmDisabled}
          className="flex items-center justify-center w-full sm:w-auto space-x-2 bg-primary text-white px-8 py-3.5 rounded-lg text-base font-semibold hover:bg-blue-600 transition-all duration-300 shadow-lg shadow-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/50 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Lock className="w-5 h-5" />
          <span>{confirmLabel || "Complete Payment"}</span>
        </button>
      </div>
    </>
  );
}

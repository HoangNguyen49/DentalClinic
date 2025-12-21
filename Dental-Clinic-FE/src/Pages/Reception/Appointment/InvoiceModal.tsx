import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Printer, CheckCircle, CreditCard, Building2, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import { type BillInvoice } from "../receptionApi";

// --- CẤU HÌNH NGÂN HÀNG (DUMMY DATA CHO DEMO) ---
const BANK_INFO = {
  BANK_ID: "MB",
  ACCOUNT_NO: "0334808386",
  TEMPLATE: "compact",
  ACCOUNT_NAME: "Sunshine Dental Clinic",
};

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: BillInvoice | null;
  onConfirm: () => void;
  loadingConfirm?: boolean;
}

export default function InvoiceModal({
  isOpen,
  onClose,
  data,
  onConfirm,
  loadingConfirm,
}: InvoiceModalProps) {
  const { t } = useTranslation("reception");

  useEffect(() => {
    if (!isOpen) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  // ✅ After hooks, it's safe to return early
  if (!isOpen || !data) return null;

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  const handlePrint = () => window.print();

  const isFullyPaid = data.remainingBalance <= 0;

  const getRankColor = (rank: string) => {
    switch (rank?.toUpperCase()) {
      case "DIAMOND":
        return "text-purple-700 bg-purple-100 border-purple-300";
      case "GOLD":
        return "text-yellow-700 bg-yellow-100 border-yellow-300";
      case "SILVER":
        return "text-gray-700 bg-gray-100 border-gray-300";
      default:
        return "text-blue-700 bg-blue-100 border-blue-300";
    }
  };

  const modalUI = (
    <div
      className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm animate-fadeIn
                 flex items-start justify-center overflow-y-auto
                 p-4 sm:p-6
                 print:bg-white print:absolute print:inset-0"
      onMouseDown={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl
                   flex flex-col overflow-hidden
                   max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)]
                   my-auto
                   print:shadow-none print:w-full print:max-w-none print:h-auto print:rounded-none
                   animate-fadeInScale"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* HEADER (Ẩn khi in) */}
        <div className="flex justify-between items-center p-4 border-b bg-gray-50 print:hidden shrink-0">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            {t("invoice.title")}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* CONTENT */}
        <div
          className="flex-1 overflow-y-auto p-8 min-h-0
                     print:p-0 print:overflow-visible"
          id="invoice-content"
        >
          {/* 1. Header Phòng Khám */}
          <div className="flex justify-between items-start border-b border-gray-200 pb-6 mb-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold uppercase text-blue-700 tracking-wide flex items-center gap-2">
                <Building2 className="w-6 h-6" /> {data.clinicName}
              </h1>
              <p className="text-sm text-gray-500 max-w-md">{data.clinicAddress}</p>
              <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                <Phone className="w-3 h-3" /> Hotline: 1900 xxxx
              </p>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-extrabold text-gray-800 tracking-tighter">
                {t("invoice.invoiceHeader")}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {t("invoice.invoiceId")}:{" "}
                <span className="font-mono font-bold text-black">{data.invoiceId}</span>
              </p>
              <p className="text-sm text-gray-500">
                {t("invoice.date")}: {new Date(data.createdDate).toLocaleDateString("vi-VN")}
              </p>
            </div>
          </div>

          {/* 2. Thông tin Khách hàng */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                {t("invoice.customer")}
              </h3>
              <p className="font-bold text-lg text-gray-800">{data.patientName}</p>
              <p className="text-sm text-gray-600">SĐT: {data.patientPhone}</p>
              <p className="text-sm text-gray-600 font-mono">Mã BN: {data.patientCode}</p>
            </div>
            <div className="text-right">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                {t("invoice.rank")}
              </h3>
              <div className="flex justify-end">
                <span
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold border ${getRankColor(
                    data.membershipRank
                  )} shadow-sm`}
                >
                  {data.membershipRank || "MEMBER"}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2 italic">
                {data.membershipRank === "DIAMOND"
                  ? "(Discount 15%)"
                  : data.membershipRank === "GOLD"
                  ? "(Discount 10%)"
                  : data.membershipRank === "SILVER"
                  ? "(Discount 5%)"
                  : ""}
              </p>
            </div>
          </div>

          {/* 3. Bảng Dịch Vụ */}
          <table className="w-full mb-8 border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase border-y border-gray-200">
                <th className="text-left py-3 px-2 font-semibold">{t("invoice.tableService")}</th>
                <th className="text-center py-3 px-2 font-semibold">{t("invoice.tableQty")}</th>
                <th className="text-right py-3 px-2 font-semibold">{t("invoice.tablePrice")}</th>
                <th className="text-right py-3 px-2 font-semibold">{t("invoice.tableTotal")}</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 text-sm">
              {data.services.map((item, index) => (
                <tr key={index} className="border-b border-gray-100 last:border-0">
                  <td className="py-3 px-2 font-medium">{item.serviceName}</td>
                  <td className="text-center py-3 px-2">{item.quantity}</td>
                  <td className="text-right py-3 px-2 text-gray-500">{formatMoney(item.unitPrice)}</td>
                  <td className="text-right py-3 px-2 font-semibold">{formatMoney(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 4. Tổng Kết & QR */}
          <div className="flex flex-col md:flex-row gap-6 mt-6 pt-6 border-t border-gray-100">
            {!isFullyPaid && (
              <div className="flex-1 flex flex-col items-center justify-center bg-blue-50 rounded-xl p-4 border border-blue-100 print:hidden">
                <p className="text-sm font-bold text-blue-800 mb-2 uppercase">{t("invoice.scanQr")}</p>
                <img
                  src={`https://img.vietqr.io/image/${BANK_INFO.BANK_ID}-${BANK_INFO.ACCOUNT_NO}-${BANK_INFO.TEMPLATE}.png?amount=${data.remainingBalance}&addInfo=THANHTOAN ${data.invoiceId}&accountName=${BANK_INFO.ACCOUNT_NAME}`}
                  alt="Mã QR Thanh Toán"
                  className="w-48 h-48 object-contain border-4 border-white rounded-lg shadow-sm bg-white"
                />
                <div className="mt-3 text-center space-y-1">
                  <p className="text-xs text-gray-500">
                    {t("invoice.bank")}: <span className="font-bold text-gray-700">MB Bank</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {t("invoice.accountNo")}:{" "}
                    <span className="font-bold text-gray-700">{BANK_INFO.ACCOUNT_NO}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {t("invoice.content")}:{" "}
                    <span className="font-mono font-bold text-blue-600">THANHTOAN {data.invoiceId}</span>
                  </p>
                </div>
              </div>
            )}

            <div className="flex-1 bg-gray-50 p-6 rounded-lg print:bg-transparent print:p-0">
              <div className="flex justify-between mb-2 text-sm">
                <span className="text-gray-600">{t("invoice.subTotal")}:</span>
                <span className="font-semibold text-gray-800">{formatMoney(data.subTotal)}</span>
              </div>

              {data.discountAmount > 0 && (
                <div className="flex justify-between mb-2 text-sm text-green-600">
                  <span>{t("invoice.discount", { rank: data.membershipRank })}:</span>
                  <span className="font-bold">- {formatMoney(data.discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between mb-2 text-sm border-b border-gray-200 pb-2">
                <span className="text-gray-600">{t("invoice.bookingFee", { type: data.appointmentType })}:</span>
                <span className="font-semibold text-gray-800">{formatMoney(data.bookingFee)}</span>
              </div>

              <div className="flex justify-between items-center mb-4">
                <span className="text-base font-bold text-gray-800">{t("invoice.grandTotal")}:</span>
                <span className="text-xl font-extrabold text-blue-700">{formatMoney(data.totalAmount)}</span>
              </div>

              <div className="flex justify-between mb-2 text-sm text-gray-500 italic">
                <span>{t("invoice.paidDeposit")}:</span>
                <span>{formatMoney(data.totalPaid)}</span>
              </div>

              <div
                className={`flex justify-between items-center p-3 rounded border ${
                  isFullyPaid
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}
              >
                <span className="font-bold text-sm uppercase">{t("invoice.remaining")}:</span>
                <span className="text-lg font-bold">{formatMoney(data.remainingBalance)}</span>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center text-xs text-gray-400 hidden print:block">
            <p className="mb-1">{t("invoice.thankYou", { clinic: data.clinicName })}</p>
            <p>{t("invoice.footerNote")}</p>
            <p className="mt-4">________________________________</p>
            <p>{t("invoice.sign")}</p>
          </div>
        </div>

        {/* FOOTER ACTIONS (Ẩn khi in) */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 print:hidden shrink-0 sticky bottom-0 z-10">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 hover:text-black transition-all shadow-sm font-medium"
          >
            <Printer size={18} /> {t("invoice.btnPrint")}
          </button>

          {!isFullyPaid ? (
            <button
              onClick={onConfirm}
              disabled={loadingConfirm}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 hover:shadow-lg active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loadingConfirm ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle size={18} />
              )}
              {t("invoice.btnConfirm")}
            </button>
          ) : (
            <div className="flex items-center gap-2 px-6 py-2.5 bg-green-100 text-green-700 rounded-lg font-bold border border-green-200 cursor-default">
              <CheckCircle size={18} /> {t("invoice.paidBadge")}
            </div>
          )}
        </div>

        {/* CSS print */}
        <style>{`
          @media print {
            @page { margin: 0; size: auto; }
            body { visibility: hidden; }
            #invoice-content, #invoice-content * { visibility: visible; }
            #invoice-content { 
              position: absolute; 
              left: 0; 
              top: 0; 
              width: 100%; 
              padding: 20px;
              background: white;
            }
          }
        `}</style>
      </div>
    </div>
  );

  return createPortal(modalUI, document.body);
}

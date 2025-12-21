import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Timer, XCircle } from 'lucide-react'; 
import { useTranslation } from 'react-i18next'; // 1. Import i18n
import { getVnpayUrl, createPaypalOrder } from '../DepositService/paymentApi';

interface StepProps {
  data: any;
  onConfirm: () => Promise<any>;
  onPrev: () => void;
  loading?: boolean;
}

// --- MODAL HẾT GIỜ THANH TOÁN ---
const ExpiredModal = ({ isOpen, onRedirect }: { isOpen: boolean; onRedirect: () => void }) => {
  const { t } = useTranslation("booking"); 
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl scale-100 transform transition-all">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">{t("stepSummary.expiredModal.title")}</h3>
        <p className="text-gray-500 mb-6 text-sm">
           {t("stepSummary.expiredModal.message")}
        </p>
        <button
          onClick={onRedirect}
          className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-red-200"
        >
          {t("stepSummary.expiredModal.btnHome")}
        </button>
      </div>
    </div>
  );
};

export default function StepSummary({ data, onConfirm, onPrev, loading }: StepProps) {
  const { t } = useTranslation("booking"); // 2. Khởi tạo hook
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);

  // --- LOGIC ĐẾM NGƯỢC (10 PHÚT) ---
  const [timeLeft, setTimeLeft] = useState(0); 

  useEffect(() => {
    if (data.appointmentType !== 'VIP') return;

    const calculateDeadline = () => {
      const storedDeadline = sessionStorage.getItem('bookingDeadline');
      if (storedDeadline) {
        return parseInt(storedDeadline, 10);
      } else {
        const newDeadline = Date.now() + 600000;
        sessionStorage.setItem('bookingDeadline', newDeadline.toString());
        return newDeadline;
      }
    };

    const deadline = calculateDeadline();

    const timer = setInterval(() =>{
      const secondsLeft = Math.round((deadline - Date.now()) / 1000);
      if (secondsLeft <= 0) {
        clearInterval(timer);
        setTimeLeft(0);
        setShowExpiredModal(true);
        sessionStorage.removeItem('bookingDeadline');
      } else {
        setTimeLeft(secondsLeft);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [data.appointmentType]);

  // Format giây thành mm:ss
  const formatTime = (seconds: number) => {
const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- FORMAT DATA ---
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // --- TÍNH TOÁN CHI PHÍ ---
  const servicesTotal = (data.selectedServices || []).reduce((acc: number, s: any) => acc + (s.price || 0), 0);
  const bookingFee = data.bookingFee || 0;
  const grandTotal = servicesTotal + bookingFee;
  const totalDuration = (data.selectedServices || []).reduce((acc: number, s: any) => acc + (s.defaultDuration || 0), 0);
  const uniqueCategories = Array.from(new Set((data.selectedServices || []).map((s: any) => s.category)));


  // --- XỬ LÝ THANH TOÁN ( ĐỒNG BỘ VỚI RACE CONDITION) ---
  const handlePayment = async (method: 'VNPAY' | 'PAYPAL') => {
    try {
      setIsProcessing(true);
      
      sessionStorage.setItem('bookingRetryData', JSON.stringify(data));

      // 1. Gọi onConfirm (hàm này ở BookingPage sẽ check SLOT_ALREADY_BOOKED)
      const newAppointment = await onConfirm();

      if (!newAppointment || !newAppointment.id) {
        throw new Error(t("common.error"));
      }

      const currentRetryData = JSON.parse(sessionStorage.getItem('bookingRetryData') || '{}');
      currentRetryData.appointmentId = newAppointment.id;
      sessionStorage.setItem('bookingRetryData', JSON.stringify(currentRetryData));

      // 2. Tiếp tục luồng thanh toán
      if (method === 'VNPAY') {
        const paymentUrl = await getVnpayUrl(newAppointment.id);
        window.location.href = paymentUrl;
      }
      else if (method === 'PAYPAL') {
        const res = await createPaypalOrder(newAppointment.id) as any;
        const approveUrl = res.approveUrl || res.data?.approveUrl || res; 
        if (typeof approveUrl === 'string') {
             window.location.href = approveUrl;
        } else {
             throw new Error("PayPal Error");
        }
      }

    } catch (error: any) {
      console.error("Payment Error:", error);
      setIsProcessing(false);

      const errorData = error.response?.data;
      const errorMsg = typeof errorData === 'string' ? errorData : (errorData?.message || "");

      if (errorMsg === "SLOT_ALREADY_BOOKED") {
          return; 
      }

      // Xử lý các lỗi đặc thù khác (Hết hạn, Hủy...)
      if (errorMsg.includes("BOOKING_EXPIRED") || errorMsg.includes("hủy") || errorMsg.includes("cancelled")) {
          setShowExpiredModal(true); 
      } else {
          // Chỉ hiện Toast nếu lỗi đó chưa được xử lý ở BookingPage
          toast.error(errorMsg || "Payment Error");
      }
    }
  };

  const handleRebook = () => {
      sessionStorage.removeItem("bookingRetryData"); 
      sessionStorage.removeItem("pendingBooking");
      navigate("/booking"); 
      window.location.reload(); 
  };

  return (
    <div className="space-y-8 animate-fadeIn relative">

      {/* 🔔 MODAL HẾT GIỜ */}
<ExpiredModal isOpen={showExpiredModal} onRedirect={handleRebook} />

      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-800">{t("stepSummary.title")}</h3>
        <p className="text-gray-500 mt-1">{t("stepSummary.subtitle")}</p>
      </div>

      {/* ⚠️ BANNER ĐẾM NGƯỢC (VIP) */}
      {data.appointmentType === 'VIP' && !showExpiredModal && (
        <div className="max-w-md mx-auto bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between shadow-sm animate-pulse">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-full">
                 <Timer className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-left">
                 <p className="text-sm font-bold text-orange-800">{t("stepSummary.timer")}</p>
                 <p className="text-xs text-orange-600">{t("stepSummary.paymentWarning")}</p>
              </div>
           </div>
           <div className="text-2xl font-mono font-bold text-orange-600 tracking-wider">
              {formatTime(timeLeft)}
           </div>
        </div>
      )}

      {/* TICKET CARD */}
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#AACCFF] via-[#6699FF] to-[#3366FF] p-6 text-white relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/20 rounded-full blur-xl"></div>
            <div className="absolute -left-6 -bottom-6 w-20 h-20 bg-white/20 rounded-full blur-xl"></div>

            <div className="flex justify-between items-start relative z-10">
                <div>
                    <h4 className="text-lg font-bold opacity-90">{t("stepSummary.ticketTitle")}</h4>
                    <div className="text-blue-100 font-medium text-sm mt-1">{formatDate(data.date)}</div>
                </div>
                <div className="text-right">
                    <div className="text-4xl font-bold tracking-tight">{data.time?.substring(0,5)}</div>
                    <div className="text-xs bg-white/20 px-2 py-0.5 rounded inline-block mt-1 backdrop-blur-sm">
                        {t("stepSummary.duration", { min: totalDuration })}
                    </div>
                </div>
            </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">

            {/* 1. Bác sĩ */}
            {data.doctorName && (
                <>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center border-2 border-blue-100 shrink-0 overflow-hidden">
                            {data.doctorAvatar ? (
                                <img src={data.doctorAvatar} alt={data.doctorName} className="w-full h-full object-cover" />
) : (
                                <svg className="h-8 w-8 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                        <div className="text-left">
                            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">{t("stepSummary.labels.doctor")}</p>
                            <p className="font-bold text-gray-800 text-lg">{data.doctorName}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {uniqueCategories.map((cat: any, index) => (
                                    <span key={index} className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                        {cat}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-dashed border-gray-200"></div>
                </>
            )}

            {/* 2. Chi tiết thanh toán */}
            <div>
                <div className="flex justify-between items-center mb-3">
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider flex items-center gap-2">
                        <span>{t("stepSummary.serviceDetails")}</span>
                    </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 space-y-3 border border-gray-100">
                    {/* Danh sách dịch vụ */}
                    <div className="max-h-40 overflow-y-auto custom-scrollbar pr-1 space-y-2">
                        {(data.selectedServices || []).map((service: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-start text-sm group border-b border-gray-200/50 pb-2 last:border-0 last:pb-0">
                                <div className="flex items-start gap-2 overflow-hidden text-left">
                                    <span className="text-blue-500 mt-1 text-[10px] shrink-0">●</span>
                                    <span className="font-medium text-gray-700 truncate" title={service.serviceName}>
                                        {service.serviceName}
                                    </span>
                                </div>
                                <div className="text-right shrink-0 ml-2">
                                    <div className="font-bold text-gray-900">{formatCurrency(service.price)}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Phí đặt lịch */}
<div className="flex justify-between items-center text-sm pt-2 border-t border-dashed border-gray-200 mt-2">
                        <span className="text-gray-600">
                            {t("stepSummary.labels.bookingFee")} ({data.appointmentType === 'VIP' ? t("stepType.vip.title") : t("stepType.standard.title")})
                        </span>
                        <span className="font-bold text-gray-800">{formatCurrency(bookingFee)}</span>
                    </div>

                    {/* Tổng cộng */}
                    <div className="border-t border-gray-200 pt-3 mt-2 flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-600">{t("stepSummary.total")}</span>
                        <span className="text-xl font-extrabold text-[#3366FF]">{formatCurrency(grandTotal)}</span>
                    </div>
                </div>

                {/* Cảnh báo đặt cọc */}
                {data.appointmentType === 'VIP' && (
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex gap-3 items-start text-left">
                    <div className="text-yellow-600 text-lg mt-0.5">⚠️</div>
                    <div>
                      <p className="text-sm font-bold text-yellow-800">{t("stepSummary.paymentHeader")}</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        {t("stepSummary.depositMsg", { amount: formatCurrency(bookingFee) })}
                      </p>
                    </div>
                  </div>
                )}
            </div>

            <div className="border-t border-dashed border-gray-200"></div>

            {/* 3. Địa điểm */}
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-xl shadow-sm border border-blue-100 shrink-0">
                    📍
                </div>
                <div className="text-left">
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">{t("stepSummary.labels.clinic")}</p>
                    <p className="font-bold text-gray-800">{data.clinicName}</p>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">{data.clinicAddress}</p>
                </div>
            </div>

        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
            <p className="text-xs text-gray-500 italic">
                {t("stepSummary.footerNote")}
            </p>
        </div>
      </div>

      {/* Buttons */}
      <div className="pt-6 mt-8 border-t border-gray-100">

        <div className="flex justify-center mb-4">
           <button
              onClick={onPrev}
              disabled={loading || isProcessing}
className="px-6 py-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition font-medium text-sm"
          >
              ← {t("common.back")}
          </button>
        </div>

        {data.appointmentType === 'VIP' ? (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => handlePayment('VNPAY')}
                disabled={loading || isProcessing}
                className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                 {isProcessing ? (
                    <>
                       <span className="animate-spin text-xl">↻</span>
                       {t("stepSummary.processing")}
                    </>
                 ) : (
                    t("stepSummary.btnPayVNPay")
                 )}
              </button>

              <button
                onClick={() => handlePayment('PAYPAL')}
                disabled={loading || isProcessing}
                className="py-3 px-4 rounded-xl bg-[#003087] hover:bg-[#00256b] text-white font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                 {isProcessing ? (
                    <>
                       <span className="animate-spin text-xl">↻</span>
                       {t("stepSummary.processing")}
                    </>
                 ) : (
                    t("stepSummary.btnPayPaypal")
                 )}
              </button>
           </div>
        ) : (
           <button
            onClick={onConfirm}
            disabled={loading}
            className="w-full py-4 rounded-full bg-gradient-to-r from-[#6699FF] to-[#3366FF] text-white font-bold text-lg shadow-xl shadow-blue-200 hover:shadow-2xl hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300 flex items-center justify-center gap-2"
          >
              {loading ? (
                  <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {t("stepSummary.processing")}
                  </>
              ) : (
                  t("stepSummary.btnConfirm")
              )}
          </button>
        )}
      </div>
    </div>
  );
}

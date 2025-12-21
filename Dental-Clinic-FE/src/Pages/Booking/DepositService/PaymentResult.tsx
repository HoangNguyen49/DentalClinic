import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { verifyVnpay, capturePaypalOrder } from '../DepositService/paymentApi'; 
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next'; // 1. Import i18n

const PaymentResult = () => {
  const { t } = useTranslation("booking"); // 2. Khởi tạo hook
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'LOADING' | 'SUCCESS' | 'FAILED'>('LOADING');

  const clearBookingSession = () => {
  
    sessionStorage.removeItem("pendingBooking");
    sessionStorage.removeItem("bookingRetryData");

    localStorage.removeItem("bookingTimer"); 
    localStorage.removeItem("bookingStep");
    localStorage.removeItem("activeStep");
  };

  useEffect(() => {
    const processPayment = async () => {
      try {
        let isSuccess = false;

        // --- XỬ LÝ VNPAY ---
        if (searchParams.get('vnp_Amount')) {
          const vnpParams = Object.fromEntries(searchParams.entries());
          await verifyVnpay(vnpParams);
          isSuccess = true;
        } 
        
        // --- XỬ LÝ PAYPAL ---
        else if (searchParams.get('token')) {
            const orderId = searchParams.get('token');
            const appointmentId = searchParams.get('appointmentId'); 

            if (orderId && appointmentId) {
                await capturePaypalOrder(orderId, Number(appointmentId));
                isSuccess = true;
            } else {
                setStatus('FAILED');
            }
        } else {
          setStatus('FAILED');
        }

        if (isSuccess) {
            setStatus('SUCCESS');
            clearBookingSession(); 
        }

      } catch (error) {
        console.error("Lỗi xử lý thanh toán:", error);
        setStatus('FAILED');
      }
    };

    if (searchParams.toString()) {
        processPayment();
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
        
        {status === 'LOADING' && (
          <div className="space-y-4">
            <Loader className="w-16 h-16 text-blue-500 animate-spin mx-auto" />
            <h2 className="text-xl font-semibold text-gray-700">{t("paymentResult.loading.title")}</h2>
          </div>
        )}

        {status === 'SUCCESS' && (
          <div className="space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-800">{t("paymentResult.success.title")}</h2>
            <p className="text-gray-600">{t("paymentResult.success.message")}</p>
            
            <button 
              onClick={() => {
                  clearBookingSession(); 
                  navigate('/my-appointments');
              }}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full"
            >
              {t("paymentResult.success.btnView")}
            </button>
            
            <button
                onClick={() => {
                    clearBookingSession(); 
                    navigate('/booking'); 
                }}
                className="mt-2 text-sm text-blue-600 hover:underline block w-full"
            >
                {t("paymentResult.success.btnNew")}
            </button>
          </div>
        )}

        {status === 'FAILED' && (
           <div className="space-y-4">
            <XCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-800">{t("paymentResult.failed.title")}</h2>
            <button 
                onClick={() => {
                    navigate('/booking'); 
                }} 
                className="mt-4 px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 w-full"
            >
                {t("paymentResult.failed.btnRetry")}
            </button>
           </div>
        )}

      </div>
    </div>
  );
};

export default PaymentResult;
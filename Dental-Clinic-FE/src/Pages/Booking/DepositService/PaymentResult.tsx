import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { verifyVnpay } from '../DepositService/paymentApi';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'LOADING' | 'SUCCESS' | 'FAILED'>('LOADING');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // --- XỬ LÝ VNPAY ---
        if (searchParams.get('vnp_Amount')) {
          // Chuyển searchParams thành object để gửi về BE
          const vnpParams = Object.fromEntries(searchParams.entries());
          await verifyVnpay(vnpParams);
          setStatus('SUCCESS');
        } 
        
        // --- XỬ LÝ PAYPAL ---
        else if (searchParams.get('token')) { 
           setStatus('SUCCESS');
        } 
        
        else {
          setStatus('FAILED');
        }
      } catch (error) {
        console.error(error);
        setStatus('FAILED');
      }
    };

    verifyPayment();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
        
        {status === 'LOADING' && (
          <div className="space-y-4">
            <Loader className="w-16 h-16 text-blue-500 animate-spin mx-auto" />
            <h2 className="text-xl font-semibold text-gray-700">Đang xử lý thanh toán...</h2>
            <p className="text-gray-500">Vui lòng không tắt trình duyệt.</p>
          </div>
        )}

        {status === 'SUCCESS' && (
          <div className="space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-800">Thanh toán thành công!</h2>
            <p className="text-gray-600">Lịch hẹn VIP của bạn đã được xác nhận.</p>
            <button 
              onClick={() => navigate('/patient/appointments')}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Xem lịch hẹn của tôi
            </button>
          </div>
        )}

        {status === 'FAILED' && (
          <div className="space-y-4">
            <XCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-800">Thanh toán chưa hoàn tất</h2>
            <p className="text-gray-600">Bạn đã hủy giao dịch hoặc có lỗi xảy ra.</p>
            
            {/* SỬA NÚT NÀY */}
            <button 
              onClick={() => navigate('/booking')} // Quay lại trang booking
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
            >
              Chọn phương thức thanh toán khác
            </button>
            
            <div className="mt-2">
                <button 
                  onClick={() => navigate('/')}
                  className="text-sm text-gray-500 hover:underline"
                >
                  Về trang chủ
                </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PaymentResult;
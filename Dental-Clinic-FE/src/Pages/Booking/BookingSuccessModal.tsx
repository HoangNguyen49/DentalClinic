import { useEffect, useState } from 'react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void; // Hàm này sẽ gọi navigate('/')
}

export default function BookingSuccessModal({ isOpen, onClose }: SuccessModalProps) {
  const [countdown, setCountdown] = useState(5); // Đếm ngược 5 giây

  useEffect(() => {
    if (isOpen) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center transform transition-all scale-100">
        
        {/* Icon Check*/}
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
          <svg className="h-10 w-10 text-green-600 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h3 className="text-2xl font-bold text-gray-900 mb-2">Đặt Lịch Thành Công!</h3>
        <p className="text-gray-500 mb-6">
          Cảm ơn bạn đã tin tưởng Sunshine Dental. Chúng tôi sẽ liên hệ với bạn sớm nhất có thể.
        </p>

        {/* Nút về trang chủ */}
        <button
          onClick={onClose}
          className="w-full py-3 px-4 bg-gradient-to-r from-[#6699FF] to-[#3366FF] text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
        >
          Về Trang Chủ Ngay
        </button>

        {/* Dòng đếm ngược */}
        <p className="text-xs text-gray-400 mt-4">
          Tự động chuyển hướng sau <span className="font-bold text-blue-600">{countdown}</span> giây...
        </p>
      </div>
    </div>
  );
}
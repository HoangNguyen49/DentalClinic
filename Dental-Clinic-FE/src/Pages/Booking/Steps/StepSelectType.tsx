import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader } from 'lucide-react'; // Import thêm Loader để làm hiệu ứng chờ

interface StepProps {
  updateData: (data: any) => void;
  onNext: () => void;
}

// URL API Backend (Lấy từ biến môi trường hoặc mặc định localhost)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Helper format tiền
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export default function StepSelectType({ updateData, onNext }: StepProps) {
  const [loading, setLoading] = useState(true);
  
  // 1. State lưu giá tiền (Mặc định giữ giá cũ để fallback nếu API lỗi)
  const [prices, setPrices] = useState({
    standard: 500000,
    vip: 1000000
  });

  // 2. Gọi API lấy giá mới nhất từ Admin khi vào trang
  useEffect(() => {
        const fetchPrices = async () => {
            try {
                const res = await axios.get<Record<string, string>>(`${API_BASE_URL}/api/public/configs`);
                
                const configs = res.data; 
                setPrices(prev => ({
                    ...prev,
                    standard: configs['STANDARD_BOOKING_FEE'] ? Number(configs['STANDARD_BOOKING_FEE']) : prev.standard,
                    vip: configs['VIP_DEPOSIT_FEE'] ? Number(configs['VIP_DEPOSIT_FEE']) : prev.vip
                }));
            } catch (error) {
                console.error("Lỗi tải bảng giá, dùng giá mặc định:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPrices();
    }, []);

  const handleSelect = (type: 'STANDARD' | 'VIP') => {
    // 3. Lấy giá từ state (đã được cập nhật từ DB)
    const selectedFee = type === 'VIP' ? prices.vip : prices.standard;

    updateData({ 
        appointmentType: type, 
        bookingFee: selectedFee // <--- Gửi giá động này đi
    });
    onNext();
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 animate-fadeIn">
        <Loader className="w-10 h-10 text-blue-500 animate-spin mb-4"/>
        <p className="text-gray-500">Đang cập nhật bảng giá mới nhất...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-800">Chọn Hình Thức Đặt Lịch</h3>
        <p className="text-gray-500 mt-2">Vui lòng chọn gói dịch vụ phù hợp với nhu cầu của bạn</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* GÓI STANDARD */}
        <div 
            onClick={() => handleSelect('STANDARD')} // Không truyền số cứng nữa
            className="border-2 border-gray-100 hover:border-blue-500 bg-white p-8 rounded-2xl cursor-pointer transition-all hover:shadow-xl group relative flex flex-col h-full"
        >
            <div className="absolute top-0 right-0 bg-blue-100 text-blue-700 px-3 py-1 rounded-bl-xl text-xs font-bold">PHỔ BIẾN</div>
            <div className="text-center mb-6">
                <div className="text-5xl mb-2">⚡</div>
                <h4 className="text-2xl font-bold text-gray-800 group-hover:text-blue-600">Tiêu Chuẩn</h4>
                
                {/* 👇 HIỂN THỊ GIÁ TỪ STATE (prices.standard) */}
                <div className="text-3xl font-extrabold text-[#3366FF] mt-2">
                    {formatCurrency(prices.standard)}
                    <span className="text-sm text-gray-400 font-normal">/lượt</span>
                </div>
            </div>
            <ul className="space-y-3 text-sm text-gray-600 flex-grow">
                <li className="flex items-start gap-2"><span className="text-green-500">✔</span> <span>Chọn Cơ sở & Dịch vụ</span></li>
                <li className="flex items-start gap-2"><span className="text-green-500">✔</span> <span>Chọn Ngày & Buổi (Sáng/Chiều)</span></li>
                <li className="flex items-start gap-2"><span className="text-orange-500">⚠️</span> <span>Bác sĩ được chỉ định ngẫu nhiên</span></li>
            </ul>
            <button className="w-full mt-6 py-3 rounded-xl bg-blue-50 text-blue-600 font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                Chọn Gói Này
            </button>
        </div>

        {/* GÓI VIP */}
        <div 
            onClick={() => handleSelect('VIP')} // Không truyền số cứng nữa
            className="border-2 border-gray-100 hover:border-purple-500 bg-white p-8 rounded-2xl cursor-pointer transition-all hover:shadow-xl group relative overflow-hidden flex flex-col h-full"
        >
            <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-4 py-1 rounded-bl-xl">CAO CẤP</div>
            <div className="text-center mb-6">
                <div className="text-5xl mb-2">💎</div>
                <h4 className="text-2xl font-bold text-gray-800 group-hover:text-purple-600">Chuyên Gia (VIP)</h4>
                
                {/* 👇 HIỂN THỊ GIÁ TỪ STATE (prices.vip) */}
                <div className="text-3xl font-extrabold text-purple-600 mt-2">
                    {formatCurrency(prices.vip)}
                    <span className="text-sm text-gray-400 font-normal">/lượt</span>
                </div>
            </div>
            <ul className="space-y-3 text-sm text-gray-600 flex-grow">
                <li className="flex items-start gap-2"><span className="text-purple-500">💎</span> <span><b>Chọn Bác sĩ Trưởng khoa/Chuyên gia</b></span></li>
                <li className="flex items-start gap-2"><span className="text-purple-500">💎</span> <span><b>Chọn Giờ chính xác từng phút</b></span></li>
                <li className="flex items-start gap-2"><span className="text-green-500">✔</span> <span>Ưu tiên check-in không cần chờ</span></li>
            </ul>
            <button className="w-full mt-6 py-3 rounded-xl bg-purple-50 text-purple-600 font-bold group-hover:bg-purple-600 group-hover:text-white transition-colors">
                Chọn Gói VIP
            </button>
        </div>

      </div>
    </div>
  );
}
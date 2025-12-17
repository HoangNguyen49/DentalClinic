import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next'; // 1. Import i18n

interface StepProps {
  currentType?: string; 
  updateData: (data: any) => void;
  onNext: () => void;
}

// URL API Backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Helper format tiền
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export default function StepSelectType({ currentType, updateData, onNext }: StepProps) { 
  const { t } = useTranslation("booking"); // 2. Khởi tạo hook
  const [loading, setLoading] = useState(true);
  
  // 1. State lưu giá tiền
  const [prices, setPrices] = useState({
    standard: 500000,
    vip: 1000000
  });

  // 2. Gọi API lấy giá mới nhất
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
    const selectedFee = type === 'VIP' ? prices.vip : prices.standard;

    updateData({ 
        appointmentType: type, 
        bookingFee: selectedFee 
    });
    onNext();
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 animate-fadeIn">
        <Loader className="w-10 h-10 text-blue-500 animate-spin mb-4"/>
        <p className="text-gray-500">{t("common.loading")}</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-800">{t("stepType.title")}</h3>
        <p className="text-gray-500 mt-2">Please choose the package that suits your needs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* GÓI STANDARD */}
        <div 
            onClick={() => handleSelect('STANDARD')} 
            className={`
                border-2 p-8 rounded-2xl cursor-pointer transition-all hover:shadow-xl group relative flex flex-col h-full
                ${currentType === 'STANDARD' 
                    ? 'border-[#3366FF] bg-blue-50 ring-2 ring-blue-200' 
                    : 'border-gray-100 hover:border-blue-500 bg-white'}
            `}
        >
            <div className="absolute top-0 right-0 bg-blue-100 text-blue-700 px-3 py-1 rounded-bl-xl text-xs font-bold">
                {t("stepType.standard.badge")}
            </div>
            <div className="text-center mb-6">
                <div className="text-5xl mb-2">⚡</div>
                <h4 className="text-2xl font-bold text-gray-800 group-hover:text-blue-600">
                    {t("stepType.standard.title")}
                </h4>
                
                <div className="text-3xl font-extrabold text-[#3366FF] mt-2">
                    {formatCurrency(prices.standard)}
                    <span className="text-sm text-gray-400 font-normal">{t("stepType.perVisit")}</span>
                </div>
            </div>
            
            <ul className="space-y-3 text-sm text-gray-600 flex-grow">
                {/* Feature 1: Bác sĩ ngẫu nhiên */}
                <li className="flex items-start gap-2">
                    <span className="text-orange-500">⚠️</span> 
                    <span>{t("stepType.standard.feature1")}</span>
                </li>
                {/* Feature 2: Chọn buổi */}
                <li className="flex items-start gap-2">
                    <span className="text-green-500">✔</span> 
                    <span>{t("stepType.standard.feature2")}</span>
                </li>
                {/* Feature 3: Tiết kiệm */}
                <li className="flex items-start gap-2">
                    <span className="text-green-500">✔</span> 
                    <span>{t("stepType.standard.feature3")}</span>
                </li>
                 {/* Feature 4: Phù hợp... */}
                 <li className="flex items-start gap-2">
                    <span className="text-green-500">✔</span> 
                    <span>{t("stepType.standard.feature4")}</span>
                </li>
            </ul>

            <button className="w-full mt-6 py-3 rounded-xl bg-blue-50 text-blue-600 font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                {t("stepType.selectBtn")}
            </button>
        </div>

        {/* GÓI VIP */}
        <div 
            onClick={() => handleSelect('VIP')}
            className={`
                border-2 p-8 rounded-2xl cursor-pointer transition-all hover:shadow-xl group relative overflow-hidden flex flex-col h-full
                ${currentType === 'VIP' 
                    ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200' 
                    : 'border-gray-100 hover:border-purple-500 bg-white'}
            `}
        >
            <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-4 py-1 rounded-bl-xl">
                {t("stepType.vip.badge")}
            </div>
            <div className="text-center mb-6">
                <div className="text-5xl mb-2">💎</div>
                <h4 className="text-2xl font-bold text-gray-800 group-hover:text-purple-600">
                    {t("stepType.vip.title")}
                </h4>
                
                <div className="text-3xl font-extrabold text-purple-600 mt-2">
                    {formatCurrency(prices.vip)}
                    <span className="text-sm text-gray-400 font-normal">{t("stepType.perVisit")}</span>
                </div>
            </div>
            <ul className="space-y-3 text-sm text-gray-600 flex-grow">
                {/* Feature 1: Bác sĩ trưởng khoa */}
                <li className="flex items-start gap-2">
                    <span className="text-purple-500">💎</span> 
                    <span className="font-bold">{t("stepType.vip.feature1")}</span>
                </li>
                {/* Feature 2: Chọn giờ chính xác */}
                <li className="flex items-start gap-2">
                    <span className="text-purple-500">💎</span> 
                    <span className="font-bold">{t("stepType.vip.feature2")}</span>
                </li>
                {/* Feature 3: Ưu tiên check-in */}
                <li className="flex items-start gap-2">
                    <span className="text-green-500">✔</span> 
                    <span>{t("stepType.vip.feature3")}</span>
                </li>
            </ul>
            <button className="w-full mt-6 py-3 rounded-xl bg-purple-50 text-purple-600 font-bold group-hover:bg-purple-600 group-hover:text-white transition-colors">
                {t("stepType.selectBtn")}
            </button>
        </div>

      </div>
    </div>
  );
}
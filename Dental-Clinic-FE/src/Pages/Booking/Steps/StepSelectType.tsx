import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader, Shield, Crown, Clock, Armchair, CheckCircle2, Zap, Tv } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface StepProps {
  currentType?: string; 
  updateData: (data: any) => void;
  onNext: () => void;
}

// URL API Backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Helper format tiền
const formatCurrency = (amount: number, language: string) => {
  if (language === 'en') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND' }).format(amount);
  }
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export default function StepSelectType({ currentType, updateData, onNext }: StepProps) { 
  const { t, i18n } = useTranslation("booking");
  const [loading, setLoading] = useState(true);
  
  // State lưu giá tiền
  const [prices, setPrices] = useState({
    standard: 500000,
    vip: 1000000
  });

  // --- [DYNAMIC DATA] QUYỀN LỢI DỊCH VỤ ---
  const benefitsStandard = [
    { icon: <Shield size={16} />, text: t("stepType.standard.feature1") }, // Random Doctor
    { icon: <Clock size={16} />, text: t("stepType.standard.feature2") },  // Session
    { icon: <CheckCircle2 size={16} />, text: t("stepType.standard.feature3") }, // Cost
    { icon: <Armchair size={16} />, text: t("stepType.standard.feature4") } // General
  ];

  const benefitsVIP = [
    { icon: <Crown size={16} />, text: t("stepType.vip.feature1") }, // Head Doctor
    { icon: <Clock size={16} />, text: t("stepType.vip.feature2") }, // Exact Time
    { icon: <Zap size={16} />, text: t("stepType.vip.feature3") },   // Priority
    { icon: <Tv size={16} />, text: t("stepType.vip.feature4") }     // Luxury Room (MỚI THÊM)
  ];

  // Gọi API lấy giá mới nhất
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
        bookingFee: selectedFee,
        ...(type === 'STANDARD' ? { doctorId: null, doctorName: null } : {})
    });
    
    setTimeout(() => onNext(), 200);
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
        <p className="text-gray-500 mt-2">{i18n.language === 'vi' ? 'Vui lòng chọn gói dịch vụ phù hợp với nhu cầu của bạn' : 'Please choose the package that suits your needs'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        
        {/* --- GÓI STANDARD --- */}
        <div 
            onClick={() => handleSelect('STANDARD')} 
            className={`
                border-2 p-8 rounded-2xl cursor-pointer transition-all hover:shadow-xl group relative flex flex-col h-full bg-white
                ${currentType === 'STANDARD' 
                    ? 'border-blue-500 ring-4 ring-blue-50/50 scale-[1.02]' 
                    : 'border-gray-100 hover:border-blue-300'}
            `}
        >
            <div className="absolute top-0 right-0 bg-gray-100 text-gray-600 px-3 py-1 rounded-bl-xl text-[10px] font-bold uppercase tracking-wider">
                {t("stepType.standard.badge")}
            </div>
            
            <div className="text-center mb-6 border-b border-dashed border-gray-200 pb-6">
                <div className="w-16 h-16 mx-auto bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3 text-2xl shadow-sm">
                    ⚡
                </div>
                <h4 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                    {t("stepType.standard.title")}
                </h4>
                
                <div className="text-3xl font-extrabold text-blue-600 mt-2">
                    {formatCurrency(prices.standard, i18n.language)}
                </div>
                <p className="text-xs text-gray-400 mt-1">{t("stepType.perVisit")}</p>
            </div>
            
            {/* List Benefits Standard */}
            <div className="space-y-4 flex-grow">
                {benefitsStandard.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm text-gray-600">
                        <span className="text-blue-400 mt-0.5 shrink-0">{item.icon}</span> 
                        <span>{item.text}</span>
                    </div>
                ))}
            </div>

            <button className={`w-full mt-8 py-3 rounded-xl font-bold transition-all
                ${currentType === 'STANDARD' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-50 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600'}`}>
                {t("stepType.selectBtn")}
            </button>
        </div>

        {/* --- GÓI VIP --- */}
        <div 
            onClick={() => handleSelect('VIP')}
            className={`
                border-2 p-8 rounded-2xl cursor-pointer transition-all hover:shadow-2xl group relative overflow-hidden flex flex-col h-full bg-white
                ${currentType === 'VIP' 
                    ? 'border-orange-400 ring-4 ring-orange-50/50 scale-[1.02]' 
                    : 'border-gray-100 hover:border-orange-300'}
            `}
        >
            {/* Background Decor */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-orange-100 rounded-full blur-3xl opacity-40 pointer-events-none"></div>

            <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-[10px] font-bold px-4 py-1 rounded-bl-xl uppercase tracking-wider shadow-sm z-10">
                {t("stepType.vip.badge")}
            </div>
            
            <div className="text-center mb-6 border-b border-dashed border-gray-200 pb-6 relative z-10">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-orange-100 to-yellow-50 text-orange-600 rounded-full flex items-center justify-center mb-3 text-2xl shadow-sm">
                    👑
                </div>
                <h4 className="text-xl font-bold text-gray-800 group-hover:text-orange-600 transition-colors">
                    {t("stepType.vip.title")}
                </h4>
                
                <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-yellow-600 mt-2">
                    {formatCurrency(prices.vip, i18n.language)}
                </div>
                <p className="text-xs text-gray-400 mt-1">{t("stepType.perVisit")}</p>
            </div>
            
            {/* List Benefits VIP */}
            <div className="space-y-4 flex-grow relative z-10">
                {benefitsVIP.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm text-gray-800 font-medium">
                        <span className="text-orange-500 mt-0.5 shrink-0">{item.icon}</span> 
                        <span>{item.text}</span>
                    </div>
                ))}
            </div>

            <button className={`w-full mt-8 py-3 rounded-xl font-bold transition-all relative z-10
                ${currentType === 'VIP' 
                    ? 'bg-gradient-to-r from-orange-500 to-yellow-500 text-white shadow-lg shadow-orange-200' 
                    : 'bg-orange-50 text-orange-600 group-hover:bg-orange-500 group-hover:text-white'}`}>
                {t("stepType.selectBtn")}
            </button>
        </div>

      </div>
    </div>
  );
}
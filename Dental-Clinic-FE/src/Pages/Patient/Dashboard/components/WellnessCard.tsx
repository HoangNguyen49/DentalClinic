import React from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
    status: 'Excellent' | 'Warning' | 'Overdue' | 'New';
    message: string;
    daysSince: number;
}

const WellnessCard: React.FC<Props> = ({ status, message, daysSince }) => {
    const { t } = useTranslation(["patient-dashboard"]);
    
    const getConfig = () => {
        switch (status) {
            case 'Excellent': // < 6 tháng
                return { color: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-700', icon: '🛡️', title: t('wellness.excellent') };
            case 'Warning':   // 6-12 tháng
                return { color: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-700', icon: '⚠️', title: t('wellness.warning') };
            case 'Overdue':   // > 1 năm
                return { color: 'bg-red-500', light: 'bg-red-50', text: 'text-red-700', icon: '❗', title: t('wellness.overdue') };
            default:          // New User
                return { color: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-700', icon: '👋', title: t('wellness.new') };
        }
    };
    const config = getConfig();

    return (
        <div className="h-full bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden">
            {/* Thanh màu trạng thái bên trái */}
            <div className={`absolute top-0 left-0 w-2 h-full ${config.color}`}></div>
            
            <div className="flex justify-between items-start">
                <div>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3 ${config.light}`}>
                        {config.icon}
                    </div>
                    <h3 className={`text-xl font-bold ${config.text}`}>{config.title}</h3>
                </div>
                {/* Chỉ hiện số ngày nếu không phải người mới */}
                {daysSince >= 0 && (
                    <div className="text-right">
                        <span className="text-3xl font-bold text-gray-800">{daysSince}</span>
                        <p className="text-xs text-gray-400">{t('wellness.daysSuffix')}</p>
                    </div>
                )}
            </div>

            <div className={`mt-4 p-4 rounded-xl ${config.light}`}>
                {/* message từ Backend, có thể hiển thị trực tiếp */}
                <p className={`text-sm font-semibold ${config.text}`}>"{message}"</p>
                
                {(status === 'Warning' || status === 'Overdue' || status === 'New') && (
                    <button 
                        onClick={() => window.location.href='/booking'} 
                        className={`mt-3 w-full py-2 rounded-lg text-xs font-bold text-white shadow-md ${config.color} hover:opacity-90 transition`}
                    >
                        {t('wellness.btnBook')}
                    </button>
                )}
            </div>
        </div>
    );
};
export default WellnessCard;
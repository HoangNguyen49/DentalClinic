import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next'; // 1. Import i18n
import { Sun, Sunset, CheckCircle2 } from 'lucide-react'; 

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// --- TYPE CHO API RESPONSE ---
interface AvailabilityResponse {
  morningAvailable: boolean;
  afternoonAvailable: boolean;
  message?: string;
}

interface StepProps {
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function StepDateTimeStandard({ data, updateData, onNext, onPrev }: StepProps) {
  const { t } = useTranslation("booking"); // 2. Khởi tạo hook
  const today = new Date().toISOString().split('T')[0];
  
  const [availability, setAvailability] = useState({ morning: false, afternoon: false });
  const [loading, setLoading] = useState(false);

  // --- CHECK AVAILABILITY KHI ĐỔI NGÀY ---
  useEffect(() => {
      if (!data.date || !data.clinicId) return;

      const checkDate = async () => {
    setLoading(true);
    updateData({ ...data, time: '' }); // Reset lựa chọn cũ

    try {
        const token = localStorage.getItem("accessToken");
        
        const res = await axios.get<AvailabilityResponse>(`${API_BASE_URL}/api/booking/availability`, {
            params: { clinicId: data.clinicId, date: data.date },
            headers: { Authorization: `Bearer ${token}` }
        });

        let isMorningValid = res.data.morningAvailable;
        let isAfternoonValid = res.data.afternoonAvailable;

        const now = new Date();
        const selectedDate = data.date; 
        const todayStr = now.toLocaleDateString('en-CA');

        // Chỉ xử lý nếu ngày chọn là ngày hôm nay
        if (selectedDate === todayStr) {
            const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
            
            // 1. Mốc 10h (10 * 60 = 600 phút)
            if (currentTotalMinutes >= 600) {
                isMorningValid = false; 
            }

            // 2. Mốc 16:30 (16 * 60 + 30 = 990 phút)
            if (currentTotalMinutes >= 990) {
                isAfternoonValid = false;
            }
        }

        setAvailability({
            morning: isMorningValid,
            afternoon: isAfternoonValid
        });
        
        if (res.data.message) {
            toast.warn(res.data.message);
        }

        if (selectedDate === todayStr && !isMorningValid && !isAfternoonValid) {
            toast.info("Hiện đã quá giờ đặt lịch cho hôm nay. Vui lòng chọn ngày tiếp theo!");
        }

    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
    }
};

      checkDate();
  }, [data.date, data.clinicId]);

  const handleSelectSession = (session: 'MORNING' | 'AFTERNOON') => {
    const time = session === 'MORNING' ? '08:00' : '13:00';
    // Dùng text hiển thị cho user từ i18n
    const morningLabel = `${t("stepDateStandard.morning")} (08:00 - 11:00)`;
    const afternoonLabel = `${t("stepDateStandard.afternoon")} (13:00 - 18:00)`;

    updateData({ 
        ...data, 
        time: time, 
        sessionLabel: session === 'MORNING' ? morningLabel : afternoonLabel 
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn text-center">
       <div>
          <h3 className="text-2xl font-bold text-gray-800">{t("stepDateStandard.title")}</h3>
          {/* 👇 ĐÃ SỬA DÒNG NÀY */}
          <p className="text-gray-500 mt-1">{t("stepDateStandard.subtitle")}</p>
       </div>

       <div className="max-w-xs mx-auto">
         <label className="block text-sm font-bold text-gray-700 mb-2 text-left">{t("stepDateStandard.dateLabel")}</label>
         <input 
           type="date" 
           className="w-full p-3 border border-gray-300 rounded-xl text-center font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm cursor-pointer"
           min={today}
           value={data.date}
           onChange={(e) => updateData({ ...data, date: e.target.value })}
         />
       </div>

       {/* Session Selection */}
       {data.date && (
           <div className="grid grid-cols-2 gap-6 max-w-lg mx-auto mt-8">
               
               {/* NÚT BUỔI SÁNG */}
               <button
                 onClick={() => handleSelectSession('MORNING')}
                 disabled={!availability.morning || loading}
                 className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-4
                   ${!availability.morning || loading 
                       ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed' 
                       : data.time === '08:00' 
                           ? 'border-orange-400 bg-orange-50 ring-1 ring-orange-400 shadow-lg scale-[1.02]' 
                           : 'border-gray-200 hover:border-orange-300 bg-white hover:shadow-lg hover:-translate-y-1'
                   }`}
               >
                   <div className={`p-4 rounded-full transition-colors duration-300
                        ${data.time === '08:00' 
                            ? 'bg-orange-100 text-orange-600' 
                            : 'bg-gray-100 text-gray-400 group-hover:bg-orange-50 group-hover:text-orange-500'
                        }
                   `}>
                       <Sun className="w-8 h-8" strokeWidth={1.5} />
                   </div>

                   <div>
                       <span className={`font-bold block text-lg transition-colors ${data.time === '08:00' ? 'text-orange-700' : 'text-gray-700'}`}>
                           {t("stepDateStandard.morning")}
                       </span>
                       <span className="text-xs font-medium text-gray-500">08:00 - 11:00</span>
                   </div>

                   {data.time === '08:00' && (
                       <div className="absolute top-3 right-3 text-orange-500 animate-scaleIn">
                           <CheckCircle2 className="w-5 h-5" />
                       </div>
                   )}

                   {(!availability.morning && !loading) && (
                       <span className="absolute top-3 right-3 text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                           {t("stepDateStandard.full")}
                       </span>
                   )}
               </button>

               {/* NÚT BUỔI CHIỀU */}
               <button
                 onClick={() => handleSelectSession('AFTERNOON')}
                 disabled={!availability.afternoon || loading}
                 className={`group relative p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-4
                   ${!availability.afternoon || loading 
                       ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed' 
                       : data.time === '13:00' 
                           ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500 shadow-lg scale-[1.02]' 
                           : 'border-gray-200 hover:border-blue-300 bg-white hover:shadow-lg hover:-translate-y-1'
                   }`}
               >
                   <div className={`p-4 rounded-full transition-colors duration-300
                        ${data.time === '13:00' 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-gray-100 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500'
                        }
                   `}>
                       <Sunset className="w-8 h-8" strokeWidth={1.5} />
                   </div>

                   <div>
                        <span className={`font-bold block text-lg transition-colors ${data.time === '13:00' ? 'text-blue-700' : 'text-gray-700'}`}>
                            {t("stepDateStandard.afternoon")}
                        </span>
                        <span className="text-xs font-medium text-gray-500">13:00 - 18:00</span>
                   </div>

                   {data.time === '13:00' && (
                       <div className="absolute top-3 right-3 text-blue-600 animate-scaleIn">
                           <CheckCircle2 className="w-5 h-5" />
                       </div>
                   )}

                   {(!availability.afternoon && !loading) && (
                       <span className="absolute top-3 right-3 text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                           {t("stepDateStandard.full")}
                       </span>
                   )}
               </button>
           </div>
       )}

       {/* Nav */}
       <div className="flex justify-between pt-6 mt-10 border-t border-gray-100">
          <button onClick={onPrev} className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-full transition font-medium">
              {t("common.back")}
          </button>
          <button 
            onClick={onNext} 
            disabled={!data.time} 
            className="px-10 py-3 rounded-full bg-gradient-to-r from-[#6699FF] to-[#3366FF] text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300 flex items-center gap-2"
          >
            {t("common.next")}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
               <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
       </div>
    </div>
  );
}
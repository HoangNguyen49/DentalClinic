import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

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
              
              // --- FIX LỖI Ở ĐÂY: Thêm <AvailabilityResponse> ---
              const res = await axios.get<AvailabilityResponse>(`${API_BASE_URL}/api/booking/availability`, {
                  params: { clinicId: data.clinicId, date: data.date },
                  headers: { Authorization: `Bearer ${token}` }
              });

              // Bây giờ res.data đã được hiểu là kiểu AvailabilityResponse
              setAvailability({
                  morning: res.data.morningAvailable,
                  afternoon: res.data.afternoonAvailable
              });
              
              if (res.data.message) {
                  toast.warn(res.data.message);
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
    updateData({ 
        ...data, 
        time: time, 
        sessionLabel: session === 'MORNING' ? 'Buổi Sáng (08:00 - 12:00)' : 'Buổi Chiều (13:00 - 17:00)' 
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn text-center">
       <div>
          <h3 className="text-2xl font-bold text-gray-800">Chọn Thời Gian Khám</h3>
          <p className="text-gray-500 mt-1">Lễ tân sẽ liên hệ để chốt giờ cụ thể sau</p>
       </div>

       <div className="max-w-xs mx-auto">
         <label className="block text-sm font-bold text-gray-700 mb-2 text-left">Ngày mong muốn</label>
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
                 className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 relative
                    ${!availability.morning || loading 
                        ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed' 
                        : data.time === '08:00' 
                            ? 'border-orange-400 bg-orange-50 ring-1 ring-orange-400 shadow-md' 
                            : 'border-gray-200 hover:border-orange-300 bg-white hover:shadow-lg'
                    }`}
               >
                   <span className="text-5xl filter drop-shadow-sm">☀️</span>
                   <div>
                       <span className="font-bold block text-lg">Buổi Sáng</span>
                       <span className="text-xs font-medium">08:00 - 12:00</span>
                   </div>
                   {(!availability.morning && !loading) && (
                       <span className="absolute top-2 right-2 text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded">Full/Đóng</span>
                   )}
               </button>

               {/* NÚT BUỔI CHIỀU */}
               <button
                 onClick={() => handleSelectSession('AFTERNOON')}
                 disabled={!availability.afternoon || loading}
                 className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 relative
                    ${!availability.afternoon || loading 
                        ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed' 
                        : data.time === '13:00' 
                            ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500 shadow-md' 
                            : 'border-gray-200 hover:border-blue-300 bg-white hover:shadow-lg'
                    }`}
               >
                   <span className="text-5xl filter drop-shadow-sm">🌤️</span>
                   <div>
                        <span className="font-bold block text-lg">Buổi Chiều</span>
                        <span className="text-xs font-medium">13:00 - 17:00</span>
                   </div>
                   {(!availability.afternoon && !loading) && (
                       <span className="absolute top-2 right-2 text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded">Full/Đóng</span>
                   )}
               </button>
           </div>
       )}

       {/* Nav */}
       <div className="flex justify-between pt-6 mt-10 border-t border-gray-100">
          <button onClick={onPrev} className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-full transition font-medium">Quay Lại</button>
          <button 
            onClick={onNext} 
            disabled={!data.time} 
            className="px-10 py-3 rounded-full bg-gradient-to-r from-[#6699FF] to-[#3366FF] text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300"
          >
            Tiếp Theo
          </button>
       </div>
    </div>
  );
}
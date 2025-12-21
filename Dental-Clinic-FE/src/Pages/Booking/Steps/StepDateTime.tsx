import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next'; // 1. Import i18n

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

interface StepProps {
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

interface TimeSlot {
  time: string;       // "08:00:00"
  available: boolean;
}

export default function StepDateTime({ data, updateData, onNext, onPrev }: StepProps) {
  const { t } = useTranslation("booking"); // 2. Khởi tạo hook
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mặc định chọn ngày hôm nay nếu chưa có ngày
  const today = new Date().toISOString().split('T')[0];
  const selectedDate = data.date || today;

  // Tự động gọi API khi các tham số thay đổi
  useEffect(() => {
    if (data.clinicId && data.doctorId && data.selectedServices.length > 0 && selectedDate) {
      fetchSlots();
    }
  }, [selectedDate, data.clinicId, data.doctorId, data.selectedServices]);

  const fetchSlots = async () => {
    setLoading(true);
    setError(null);
    setSlots([]); 

    try {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        setError(t("stepDateVIP.errors.login")); // Dịch lỗi chưa đăng nhập
        setLoading(false);
        return;
      }

      console.log(`Fetching slots for Date: ${selectedDate}, Doctor: ${data.doctorId}`);
      const serviceIds = data.selectedServices.map((s: any) => s.id || s.serviceId).join(',');
      const response = await axios.get<TimeSlot[]>(
        `${API_BASE_URL}/api/booking/slots`,
        {
          params: {
            clinicId: data.clinicId,
            doctorId: data.doctorId,
            serviceIds: serviceIds,
            date: selectedDate
          },
          headers: {
            'Authorization': `Bearer ${token}`
          },
          withCredentials: true 
        }
      );
      
      setSlots(response.data);

    } catch (err: any) {
      console.error("Error fetching slots:", err);
      if (err.response && err.response.status === 401) {
         setError(t("stepDateVIP.errors.session")); // Dịch lỗi hết session
      } else {
         setError(t("stepDateVIP.errors.load")); // Dịch lỗi connection
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Khi đổi ngày, reset giờ đã chọn
    updateData({ ...data, date: e.target.value, time: '' });
  };

  const handleSelectTime = (time: string) => {
    updateData({ ...data, date: selectedDate, time: time });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
       
       {/* Header Step */}
       <div className="text-center">
          <h3 className="text-xl font-bold text-gray-800">{t("stepDateVIP.title")}</h3>
          <p className="text-sm text-gray-500 mt-1">
             {/* 👇 ĐÃ SỬA DÒNG NÀY: Dùng t() + tên bác sĩ */}
             {t("stepDateVIP.slotsFor")} <span className="font-bold text-[#3366FF]">{data.doctorName}</span>
          </p>
       </div>
       
       {/* 1. DATE PICKER */}
       <div className="max-w-xs mx-auto">
         <label className="block text-sm font-medium text-gray-600 mb-2 text-center">{t("stepDateVIP.dateLabel")}</label>
         <input 
           type="date" 
           className="w-full p-3 border border-gray-300 rounded-full text-center font-bold text-gray-700 focus:ring-2 focus:ring-[#3366FF] focus:border-[#3366FF] outline-none shadow-sm cursor-pointer"
           min={today}
           value={selectedDate}
           onChange={handleDateChange}
         />
       </div>

       {/* 2. TIME GRID (Lưới giờ) */}
       <div className="mt-6">
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#3366FF] mb-2"></div>
                    <p className="text-gray-500">{t("common.loading")}</p>
                </div>
            ) : error ? (
                <div className="text-center py-8 text-red-500 bg-red-50 rounded-xl border border-red-100">
                    {error}
                </div>
            ) : slots.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500 font-medium">{t("stepDateVIP.empty.title")}</p>
                    <p className="text-sm text-gray-400 mt-1">{t("stepDateVIP.empty.desc")}</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {slots.map((slot, index) => {
                            // Cắt chuỗi "08:00:00" lấy "08:00"
                            const displayTime = slot.time.substring(0, 5);
                            const isSelected = data.time === slot.time;
                            
                            return (
                                <button
                                    key={index}
                                    disabled={!slot.available}
                                    onClick={() => handleSelectTime(slot.time)}
                                    className={`
                                        py-3 rounded-full text-sm font-bold transition-all duration-200 border
                                        ${!slot.available 
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-transparent decoration-gray-400' // Bận
                                            : isSelected
                                                ? 'bg-[#3366FF] text-white border-[#3366FF] shadow-md scale-105 ring-2 ring-offset-2 ring-[#3366FF]' // Đang chọn
                                                : 'bg-white text-gray-700 border-gray-200 hover:border-[#3366FF] hover:text-[#3366FF] hover:shadow-sm' // Trống
                                        }
                                    `}
                                >
                                    {displayTime}
                                </button>
                            );
                        })}
                    </div>
                    
                    {/* Chú thích trạng thái */}
                    <div className="flex justify-center gap-6 mt-8 text-xs text-gray-500 font-medium">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border border-gray-200 bg-white rounded"></div> 
                            {t("stepDateVIP.legend.available")}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-[#3366FF] rounded shadow-sm"></div> 
                            {t("stepDateVIP.legend.selected")}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gray-100 rounded"></div> 
                            {t("stepDateVIP.legend.busy")}
                        </div>
                    </div>
                </>
            )}
       </div>

       {/* Navigation Buttons */}
       <div className="flex justify-between pt-6 mt-8 border-t border-gray-100">
          <button 
            onClick={onPrev} 
            className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-full transition font-medium"
          >
            {t("common.back")}
          </button>
          <button 
            onClick={onNext} 
            disabled={!data.time}
            className="px-8 py-3 rounded-full bg-gradient-to-r from-[#6699FF] to-[#3366FF] text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300"
          >
            {t("common.next")}
          </button>
       </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

interface StepProps {
  data: {
    clinicId: number | null;
    clinicName: string;
    selectedServices: any[];
    doctorId: number | null;
    [key: string]: any;
  };
  updateData: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

interface Doctor {
  id: number;
  fullName: string;
  specialties: string[];
  avatarUrl: string | null;
}

export default function StepDoctor({ data, updateData, onNext, onPrev }: StepProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tính toán danh sách chuyên khoa từ các dịch vụ đã chọn
  const uniqueCategories = Array.from(new Set((data.selectedServices || []).map((s: any) => s.category)));

  useEffect(() => {
    if (data.clinicId && uniqueCategories.length > 0) {
      fetchDoctors();
    }
  }, [data.clinicId, data.selectedServices]);

  const fetchDoctors = async () => {
    setLoading(true);
    setError(null);
    try {
      // Chuyển mảng category thành chuỗi gửi API (VD: "Preventive,Implant")
      const specialtyParam = uniqueCategories.join(',');

      console.log(`Fetching doctors for Clinic: ${data.clinicId}, Specialties: ${specialtyParam}`);
      
      const response = await axios.get(`${API_BASE_URL}/api/public/doctors`, {
        params: {
          clinicId: data.clinicId,
          specialty: specialtyParam 
        }
      });

      setDoctors(response.data as Doctor[]);
      
    } catch (err) {
      console.error("Error fetching doctors:", err);
      setError("Không thể tải danh sách bác sĩ. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDoctor = (doctor: Doctor) => {
    updateData({
      ...data,
      doctorId: doctor.id,
      doctorName: doctor.fullName,
      doctorAvatar: doctor.avatarUrl, // Lưu key này để StepSummary dùng
      doctorSpecialties: doctor.specialties // Lưu list này để StepSummary hiện Tags
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">Chọn Bác Sĩ</h3>
        <p className="text-sm text-gray-500">
           Chuyên khoa: <span className="font-semibold text-[#3366FF]">{uniqueCategories.join(', ')}</span> 
           {' '} tại {data.clinicName}
        </p>
      </div>

      {loading ? (
         <div className="text-center py-10 text-gray-500">Đang tìm kiếm bác sĩ phù hợp...</div>
      ) : error ? (
         <div className="text-center py-10 text-red-500">{error}</div>
      ) : doctors.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500 font-medium">Chưa có bác sĩ nào phụ trách (các) chuyên khoa này tại cơ sở đã chọn.</p>
          <p className="text-sm text-gray-400 mt-2">Vui lòng quay lại và thử chọn cơ sở khác.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {doctors.map((doctor) => (
            <div
              key={doctor.id}
              onClick={() => handleSelectDoctor(doctor)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-center gap-4 group
                ${data.doctorId === doctor.id
                  ? 'border-[#3366FF] bg-blue-50 shadow-md ring-1 ring-[#3366FF]'
                  : 'border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm'
                }`}
            >
              <img 
                src={doctor.avatarUrl || "https://res.cloudinary.com/dchzko3lj/image/upload/v1762616672/default-avatar_brvdfn.png"} 
                alt={doctor.fullName} 
                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm group-hover:scale-105 transition-transform"
              />
              <div className="flex-1">
                <div className="font-bold text-gray-800 text-lg">{doctor.fullName}</div>
                
                {/* Hiển thị Tags chuyên khoa */}
                <div className="flex flex-wrap gap-1 mt-1">
                    {doctor.specialties && doctor.specialties.map((spec, idx) => (
                        <span 
                            key={idx} 
                            className="text-[10px] font-bold text-[#3366FF] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100"
                        >
                            {spec}
                        </span>
                    ))}
                </div>
              </div>
              
              {/* Icon check khi được chọn */}
              {data.doctorId === doctor.id && (
                <div className="bg-[#3366FF] text-white rounded-full p-1 shadow-sm animate-scaleIn">
                   <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 mt-8 border-t border-gray-100">
        <button 
            onClick={onPrev} 
            className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-full transition font-medium"
        >
            Quay Lại
        </button>
        <button
          onClick={onNext}
          disabled={!data.doctorId}
          className="px-8 py-3 rounded-full bg-gradient-to-r from-[#6699FF] to-[#3366FF] text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300"
        >
          Tiếp Theo
        </button>
      </div>
    </div>
  );
}
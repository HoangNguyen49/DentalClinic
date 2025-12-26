import { useState, useEffect } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { Star, Award, ShieldCheck } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

interface StepProps {
  data: {
    clinicId: number | null;
    clinicName: string;
    selectedServices: any[];
    doctorId: number | null;
    appointmentType?: string;
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
  const { t } = useTranslation("booking");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const specialtyParam = uniqueCategories.join(',');
      
      const response = await axios.get(`${API_BASE_URL}/api/public/doctors`, {
        params: {
          clinicId: data.clinicId,
          specialty: specialtyParam 
        }
      });

      setDoctors(response.data as Doctor[]);
      
    } catch (err) {
      console.error("Error fetching doctors:", err);
      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDoctor = (doctor: Doctor) => {
    const mockInfo = getDoctorTitle(doctor.id, data.appointmentType);

    updateData({
      ...data,
      doctorId: doctor.id,
      doctorName: doctor.fullName,
      doctorAvatar: doctor.avatarUrl,
      doctorSpecialties: doctor.specialties,
      doctorTitle: mockInfo.title 
    });
  };

  // --- [MOCK LOGIC] TẠO DANH HIỆU BÁC SĨ (CÓ I18N) ---
  const getDoctorTitle = (docId: number, type?: string) => {
    // Nếu khách chọn gói STANDARD
    if (type !== 'VIP') {
        return {
            title: t("stepDoctor.mock.titleStandard"),
            exp: t("stepDoctor.mock.expYears", { count: 3 + (docId % 4) }),
            badgeColor: "bg-blue-50 text-blue-600 border-blue-100",
            icon: <ShieldCheck size={12} className="text-blue-500" />
        };
    }

    // Nếu khách chọn gói VIP
    const isHead = docId % 2 === 0; 
    return {
        title: isHead ? t("stepDoctor.mock.titleHead") : t("stepDoctor.mock.titleExpert"),
        exp: t("stepDoctor.mock.expYears", { count: isHead ? 15 : 10 }),
        badgeColor: isHead 
            ? "bg-yellow-50 text-yellow-700 border-yellow-200" 
            : "bg-orange-50 text-orange-700 border-orange-200",
        icon: isHead 
            ? <Award size={12} className="text-yellow-600" /> 
            : <Star size={12} className="text-orange-500" />
    };
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">{t("stepDoctor.title")}</h3>
        <p className="text-sm text-gray-500">
           {uniqueCategories.join(', ')} @ {data.clinicName}
        </p>
        
        {/* Nhắc khéo khách VIP */}
        {data.appointmentType === 'VIP' && (
            <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold border border-orange-200">
                <Star size={12} fill="currentColor" /> {t("stepDoctor.vipWarning")}
            </div>
        )}
      </div>

      {loading ? (
         <div className="text-center py-10 text-gray-500">{t("stepDoctor.loading")}</div>
      ) : error ? (
         <div className="text-center py-10 text-red-500">{error}</div>
      ) : doctors.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500 font-medium">{t("stepDoctor.notFound")}</p>
          <p className="text-sm text-gray-400 mt-2">{t("stepDoctor.subNotFound")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {doctors.map((doctor) => {
            const mockInfo = getDoctorTitle(doctor.id, data.appointmentType);

            return (
                <div
                  key={doctor.id}
                  onClick={() => handleSelectDoctor(doctor)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-start gap-4 group
                    ${data.doctorId === doctor.id
                      ? 'border-[#3366FF] bg-blue-50 shadow-md ring-1 ring-[#3366FF]'
                      : 'border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm'
                    }`}
                >
                  <div className="relative">
                      <img 
                        src={doctor.avatarUrl || "https://res.cloudinary.com/dchzko3lj/image/upload/v1762616672/default-avatar_brvdfn.png"} 
                        alt={doctor.fullName} 
                        className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm group-hover:scale-105 transition-transform"
                      />
                      {data.appointmentType === 'VIP' && (doctor.id % 2 === 0) && (
                          <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-white p-1 rounded-full border-2 border-white" title="Top Rated">
                             <Star size={10} fill="currentColor"/>
                          </div>
                      )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex flex-col items-start gap-1">
                        <div className="font-bold text-gray-800 text-lg leading-tight">
                            {doctor.fullName}
                        </div>
                        
                        {/* Danh hiệu (Đã dịch) */}
                        <div className={`flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${mockInfo.badgeColor}`}>
                            {mockInfo.icon}
                            {mockInfo.title}
                        </div>
                    </div>
                    
                    {/* Kinh nghiệm (Đã dịch) */}
                    <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <span>🎓 {mockInfo.exp}</span>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                        {doctor.specialties && doctor.specialties.slice(0, 2).map((spec, idx) => (
                            <span key={idx} className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                {spec}
                            </span>
                        ))}
                        {(doctor.specialties?.length || 0) > 2 && (
                            <span className="text-[10px] text-gray-400">+{(doctor.specialties?.length || 0) - 2}</span>
                        )}
                    </div>
                  </div>
                  
                  {data.doctorId === doctor.id && (
                    <div className="bg-[#3366FF] text-white rounded-full p-1 shadow-sm animate-scaleIn shrink-0 self-center">
                       <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                       </svg>
                    </div>
                  )}
                </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-between pt-6 mt-8 border-t border-gray-100">
        <button 
            onClick={onPrev} 
            className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-full transition font-medium"
        >
            {t("common.back")}
        </button>
        <button
          onClick={onNext}
          disabled={!data.doctorId}
          className="px-8 py-3 rounded-full bg-gradient-to-r from-[#6699FF] to-[#3366FF] text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300"
        >
          {t("common.next")}
        </button>
      </div>
    </div>
  );
}
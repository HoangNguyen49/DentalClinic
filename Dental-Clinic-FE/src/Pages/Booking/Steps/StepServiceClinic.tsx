import { useEffect, useState } from 'react';
import axios from 'axios';
import { FaTooth, FaShieldAlt, FaMagic, FaBaby, FaSyringe, FaScrewdriver } from 'react-icons/fa';
import { GiBracers } from 'react-icons/gi';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

interface StepProps {
  data: {
    clinicId: number | null;
    selectedServices: any[]; // Mảng các dịch vụ đã chọn
    [key: string]: any;
  };
  updateData: (data: any) => void;
  onNext: () => void;
}

// Mapping Icon
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Preventive Care": <FaShieldAlt className="text-blue-500" />,
  "Dental Implants": <FaScrewdriver className="text-gray-500" />, 
  "Orthodontics": <GiBracers className="text-purple-500" />,
  "Cosmetic Dentistry": <FaMagic className="text-yellow-500" />,
  "Oral Surgery": <FaSyringe className="text-red-500" />,
  "Pediatric Dentistry": <FaBaby className="text-pink-500" />,
};

export default function StepServiceClinic({ data, updateData, onNext }: StepProps) {
  
  const [clinics, setClinics] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [clinicsRes, servicesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/public/clinics`), 
          axios.get(`${API_BASE_URL}/api/public/services`)
        ]);
        setClinics(clinicsRes.data as any[]);
        setServices(servicesRes.data as any[]);
      } catch (error) {
        console.error("API Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 1. Xử lý chọn Clinic
  const handleSelectClinic = (clinic: any) => {
    updateData({ 
      ...data, 
      clinicId: clinic.id || clinic.clinicId, 
      clinicName: clinic.clinicName,
      clinicAddress: clinic.address 
    });
  };

  // 2. Xử lý chọn Service (Multi-select)
  const handleToggleService = (service: any) => {
    const currentSelected = data.selectedServices || [];
    const serviceId = service.id || service.serviceId;
    
    const exists = currentSelected.find((s: any) => (s.id || s.serviceId) === serviceId);

    let newSelected;
    if (exists) {
      newSelected = currentSelected.filter((s: any) => (s.id || s.serviceId) !== serviceId);
    } else {
      newSelected = [...currentSelected, service];
    }

    const primaryCategory = newSelected.length > 0 ? newSelected[0].category : '';

    updateData({ 
        ...data, 
        selectedServices: newSelected,
        serviceCategory: primaryCategory
    });
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Đang tải dữ liệu...</div>;

  return (
    <div className="space-y-10 animate-fadeIn">
      
      {/* PHẦN 1: CHỌN CƠ SỞ */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
          Chọn Cơ Sở
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 ml-0 md:ml-11">
          {clinics.map((clinic) => (
            <div
              key={clinic.id || clinic.clinicId}
              onClick={() => handleSelectClinic(clinic)}
              className={`p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex flex-col hover:shadow-lg relative group
                ${data.clinicId === (clinic.id || clinic.clinicId)
                  ? 'border-[#3366FF] bg-blue-50/50 ring-1 ring-[#3366FF]'
                  : 'border-gray-100 bg-white hover:border-blue-200'
                }`}
            >
              <span className="font-bold text-gray-900 text-lg group-hover:text-[#3366FF] transition-colors">{clinic.clinicName}</span>
              <span className="text-sm text-gray-500 mt-2 flex items-start gap-2">
                <span className="text-lg">📍</span> {clinic.address || 'TP.HCM'}
              </span>
              
              {/* Radio Indicator */}
              <div className={`absolute top-5 right-5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                 ${data.clinicId === (clinic.id || clinic.clinicId) ? 'border-[#3366FF]' : 'border-gray-300'}`}>
                 {data.clinicId === (clinic.id || clinic.clinicId) && <div className="w-2.5 h-2.5 bg-[#3366FF] rounded-full" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PHẦN 2: CHỌN DỊCH VỤ (REDESIGNED CARD) */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
          Chọn Dịch Vụ <span className="ml-3 text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-md">chọn 1 hoặc nhiều dịch vụ</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 ml-0 md:ml-11">
          {services.map((service: any) => {
            const isSelected = (data.selectedServices || []).some((s: any) => 
                (s.id || s.serviceId) === (service.id || service.serviceId)
            );

            return (
                <div
                    key={service.id || service.serviceId}
                    onClick={() => handleToggleService(service)}
                    className={`
                        relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 group select-none
                        flex flex-col justify-between min-h-[160px]
                        ${isSelected
                        ? 'border-[#3366FF] bg-blue-50 shadow-lg scale-[1.02]' 
                        : 'border-gray-100 bg-white hover:border-blue-200 hover:shadow-md' 
                        }
                    `}
                >
                    {/* HEADER: Icon */}
                    <div className="mb-3 text-4xl flex justify-center items-center h-16 w-16 bg-blue-50 rounded-full mx-auto">
    {CATEGORY_ICONS[service.category] || <FaTooth className="text-blue-400"/>}
</div>
                    
                    {/* BODY: Tên dịch vụ */}
                    <div className="flex-grow">
                        <div className={`font-bold text-sm leading-snug mb-1 transition-colors ${isSelected ? 'text-[#3366FF]' : 'text-gray-800'}`}>
                            {service.serviceName}
                        </div>
                        <div className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                            {service.category}
                        </div>
                    </div>

                    {/* FOOTER: Duration Badge */}
                    <div className="mt-4 pt-3 border-t border-gray-100/50 flex items-center">
                        <div className={`text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1.5 transition-colors
                            ${isSelected ? 'bg-[#3366FF] text-white' : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {service.defaultDuration ? `${service.defaultDuration} phút` : '60 phút'}
                        </div>
                    </div>

                    {/* CHECKMARK: Góc trên phải (Ribbon Style) */}
                    {isSelected && (
                        <div className="absolute -top-[2px] -right-[2px] w-10 h-10 bg-[#3366FF] rounded-bl-2xl rounded-tr-lg flex items-center justify-center shadow-sm z-10">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white mb-1 ml-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </div>
                    )}
                </div>
            );
          })}
        </div>
      </div>

      {/* NÚT TIẾP THEO */}
      <div className="flex justify-end pt-6 border-t border-gray-100 mt-8">
        <button
          onClick={onNext}
          disabled={!data.clinicId || (data.selectedServices || []).length === 0}
          className="px-10 py-3.5 rounded-full bg-gradient-to-r from-[#6699FF] to-[#3366FF] text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300 flex items-center gap-2"
        >
          Tiếp Theo
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}
import { useEffect, useState } from 'react';
import axios from 'axios';
import { FaTooth, FaShieldAlt, FaMagic, FaBaby, FaSyringe, FaScrewdriver } from 'react-icons/fa';
import { GiBracers } from 'react-icons/gi';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// --- TYPES ---
interface ServiceVariant {
  variantId: number;
  variantName: string;
  duration: number;
  price: number;
  description?: string;
}

interface Service {
  id: number;
  serviceName: string;
  category: string;
  description?: string;
  defaultDuration?: number;
  price?: number;
  variants: ServiceVariant[];
}

interface StepProps {
  data: {
    clinicId: number | null;
    selectedServices: any[];
    prefilledServiceId?: number | null; 
    [key: string]: any;
  };
  updateData: (data: any) => void;
  onNext: () => void;
  onPrev: () => void; 
}

// --- ICONS ---
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Preventive Care": <FaShieldAlt className="text-blue-500" />,
  "Dental Implants": <FaScrewdriver className="text-gray-500" />,
  "Orthodontics": <GiBracers className="text-purple-500" />,
  "Cosmetic Dentistry": <FaMagic className="text-yellow-500" />,
  "Oral Surgery": <FaSyringe className="text-red-500" />,
  "Pediatric Dentistry": <FaBaby className="text-pink-500" />,
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export default function StepServiceClinic({ data, updateData, onNext, onPrev }: StepProps) {
  
  const [clinics, setClinics] = useState<any[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedServiceId, setExpandedServiceId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [clinicsRes, servicesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/public/clinics`), 
          axios.get(`${API_BASE_URL}/api/public/services`)
        ]);
        setClinics(clinicsRes.data as any[]);
        setServices(servicesRes.data as Service[]);
      } catch (error) {
        console.error("API Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- [FIXED] LOGIC TỰ ĐỘNG CHỌN DỊCH VỤ TỪ AI ---
  useEffect(() => {
    // Chỉ chạy khi đã tải xong services và có ID từ AI gửi sang
    if (services.length > 0 && data.prefilledServiceId) {
        let found = false;

        // Duyệt qua từng Service Cha
        for (const service of services) {
            // Tìm xem ID mà AI gửi (prefilledServiceId) có khớp với Variant nào trong service này không
            const targetVariant = service.variants.find(v => v.variantId === data.prefilledServiceId);

            if (targetVariant) {
                // 1. Mở Dropdown của Service Cha
                setExpandedServiceId(service.id);

                // 2. Tạo object Variant để lưu vào state
                const variantItem = {
                    id: targetVariant.variantId,             
                    serviceName: targetVariant.variantName,  
                    parentName: service.serviceName,   
                    category: service.category,        
                    price: targetVariant.price,
                    defaultDuration: targetVariant.duration,
                    description: targetVariant.description
                };

                // 3. Cập nhật thẳng vào data (Thay vì giả lập click)
                // Lưu ý: Logic này đang Replace (chọn 1). Nếu muốn chọn thêm thì dùng [...data.selectedServices, variantItem]
                updateData({ 
                    ...data,
                    selectedServices: [variantItem], 
                    serviceCategory: service.category,
                    prefilledServiceId: null // Xóa ID để không bị chạy lại loop này
                });

                found = true;
                break; // Tìm thấy rồi thì thoát vòng lặp
            }
        }

        // Trường hợp phụ: Nếu AI gửi ID của Service Cha (không phải Variant)
        if (!found) {
            const parentService = services.find(s => s.id === data.prefilledServiceId);
            if (parentService) {
                setExpandedServiceId(parentService.id);
                // Có thể tự chọn variant đầu tiên nếu muốn, hoặc chỉ mở ra để khách chọn
                updateData({ ...data, prefilledServiceId: null });
            }
        }
    }
  }, [services, data.prefilledServiceId]); 
  // --- END FIX ---

  const handleSelectClinic = (clinic: any) => {
    updateData({ 
      ...data, 
      clinicId: clinic.id || clinic.clinicId, 
      clinicName: clinic.clinicName,
      clinicAddress: clinic.address 
    });
  };

  const toggleExpand = (serviceId: number) => {
    if (expandedServiceId === serviceId) {
        setExpandedServiceId(null);
    } else {
        setExpandedServiceId(serviceId);
    }
  };

  const handleToggleVariant = (e: React.MouseEvent, service: Service, variant: ServiceVariant) => {
    e.stopPropagation();
    
    const currentSelected = data.selectedServices || [];
    const exists = currentSelected.find((s: any) => s.id === variant.variantId);

    let newSelected;
    if (exists) {
      newSelected = currentSelected.filter((s: any) => s.id !== variant.variantId);
    } else {
      const variantItem = {
          id: variant.variantId,             
          serviceName: variant.variantName,  
          parentName: service.serviceName,   
          category: service.category,        
          price: variant.price,
          defaultDuration: variant.duration,
          description: variant.description
      };
      newSelected = [...currentSelected, variantItem];
    }

    const primaryCategory = newSelected.length > 0 ? newSelected[0].category : '';

    updateData({ 
        ...data, 
        selectedServices: newSelected,
        serviceCategory: primaryCategory,
        prefilledServiceId: null 
    });
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Đang tải dữ liệu...</div>;

  return (
    <div className="space-y-10 animate-fadeIn">
      
      {/* 1. CHỌN CƠ SỞ */}
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
              <div className={`absolute top-5 right-5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                  ${data.clinicId === (clinic.id || clinic.clinicId) ? 'border-[#3366FF]' : 'border-gray-300'}`}>
                  {data.clinicId === (clinic.id || clinic.clinicId) && <div className="w-2.5 h-2.5 bg-[#3366FF] rounded-full" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. CHỌN DỊCH VỤ */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
          Chọn Dịch Vụ
        </h3>

        <div className="grid grid-cols-1 gap-4 ml-0 md:ml-11">
          {services.map((service) => {
            const isExpanded = expandedServiceId === service.id;
            // Kiểm tra xem có variant nào của service này đang được chọn không
            const hasSelection = (data.selectedServices || []).some((s: any) => s.category === service.category && s.parentName === service.serviceName);

            return (
                <div key={service.id} className={`border rounded-2xl transition-all duration-300 bg-white overflow-hidden ${hasSelection ? 'border-blue-300 ring-1 ring-blue-100 shadow-sm' : 'border-gray-200'}`}>
                    
                    <div 
                        onClick={() => toggleExpand(service.id)}
                        className={`p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-gray-50/80' : ''}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center shrink-0 border border-blue-100 text-2xl">
                                {CATEGORY_ICONS[service.category] || <FaTooth className="text-gray-400"/>}
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-gray-900">{service.serviceName}</h4>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase tracking-wide">
                                        {service.category}
                                    </span>
                                    {service.price !== undefined && service.price > 0 && (
                                        <span className="text-xs text-gray-500 font-medium">
                                            Từ <span className="text-gray-900 font-bold">{formatCurrency(service.price)}</span>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className={`text-gray-400 text-2xl transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>

                    {isExpanded && (
                        <div className="px-5 pb-5 pt-2 animate-fadeIn">
                            <div className="h-[1px] bg-gray-100 w-full mb-4"></div>
                            
                            {service.variants && service.variants.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {service.variants.map((variant) => {
                                        // Kiểm tra xem variant này có nằm trong selectedServices không
                                        const isSelected = (data.selectedServices || []).some((s: any) => s.id === variant.variantId);
                                        
                                        return (
                                            <div 
                                                key={variant.variantId}
                                                onClick={(e) => handleToggleVariant(e, service, variant)}
                                                className={`
                                                    relative p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between min-h-[80px] group
                                                    ${isSelected 
                                                        ? 'border-[#3366FF] bg-blue-50/40 shadow-sm' 
                                                        : 'border-gray-100 hover:border-blue-300 hover:bg-white hover:shadow-sm'}
                                                `}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className={`font-bold text-sm leading-tight ${isSelected ? 'text-[#3366FF]' : 'text-gray-700'}`}>
                                                        {variant.variantName}
                                                    </span>
                                                    {isSelected && (
                                                        <span className="bg-[#3366FF] text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center shrink-0 ml-2">✓</span>
                                                    )}
                                                </div>
                                                
                                                <div className="flex justify-between items-end mt-auto pt-2 border-t border-gray-100/50 border-dashed">
                                                    <span className="text-xs font-bold text-gray-900">
                                                        {formatCurrency(variant.price)}
                                                    </span>
                                                    <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-mono flex items-center gap-1">
                                                        🕒 {variant.duration}p
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-4 text-gray-400 italic text-sm">
                                    Đang cập nhật gói dịch vụ...
                                </div>
                            )}
                        </div>
                    )}
                </div>
            );
          })}
        </div>
      </div>

      {/* NAVIGATION */}
      <div className="flex justify-between pt-6 border-t border-gray-100 mt-8">
        <button
          onClick={onPrev}
          className="px-8 py-3.5 rounded-full bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-all duration-300"
        >
          Quay Lại
        </button>

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
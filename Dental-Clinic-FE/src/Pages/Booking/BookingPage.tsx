import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom'; // [AI ADDITION] Thêm useSearchParams
import axios from 'axios';
import { toast } from 'react-toastify';
import StepSelectType from './Steps/StepSelectType';
import StepServiceClinic from './Steps/StepServiceClinic';
import StepDoctor from './Steps/StepDoctor';
import StepDateTime from './Steps/StepDateTime';
import StepDateTimeStandard from './Steps/StepDateTimeStandard';
import StepSummary from './Steps/StepSummary';
import BookingSuccessModal from './BookingSuccessModal';
import Headers from '../../widgets/Header/Header';
import Footer from '../../widgets/Footer/Footer';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function BookingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // [AI ADDITION] Hook lấy tham số

  // Bắt đầu từ bước 0 (Chọn Loại)
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [bookingData, setBookingData] = useState({
    appointmentType: 'STANDARD', // 'STANDARD' | 'VIP'
    bookingFee: 0,
    sessionLabel: '',

    clinicId: null as number | null,
    clinicName: '',
    clinicAddress: '',
    selectedServices: [] as any[],
    serviceCategory: '',
    doctorId: null as number | null,
    doctorName: '',
    doctorAvatar: '',
    doctorSpecialties: [] as string[],
    date: '',
    time: '',
    
    // [AI ADDITION] Lưu ID dịch vụ từ AI để Step 1 tự động chọn
    prefilledServiceId: null as number | null 
  });

  // --- [AI ADDITION] START: Xử lý dữ liệu từ Chatbot ---
  useEffect(() => {
    const typeParam = searchParams.get('type'); 
    const doctorIdParam = searchParams.get('prefillDoctor');
    const serviceIdParam = searchParams.get('prefillService');

    let shouldSkipStep0 = false; // Cờ để kiểm tra xem có nên nhảy bước không

    // 1. Nếu có type=VIP hoặc đã chọn bác sĩ -> Set type là VIP
    if (typeParam === 'VIP' || doctorIdParam) {
      setBookingData(prev => ({ ...prev, appointmentType: 'VIP' }));
      shouldSkipStep0 = true;
    }

    // 2. Nếu AI gửi ID bác sĩ -> Lưu vào state
    if (doctorIdParam) {
      setBookingData(prev => ({ 
        ...prev, 
        appointmentType: 'VIP', 
        doctorId: Number(doctorIdParam) 
      }));
    }

    // 3. Nếu AI gửi ID dịch vụ -> Lưu tạm để StepServiceClinic tự động chọn
    if (serviceIdParam) {
      setBookingData(prev => ({
        ...prev,
        prefilledServiceId: Number(serviceIdParam)
      }));
      shouldSkipStep0 = true; // Đã có dịch vụ thì cũng nên nhảy qua bước chọn loại
    }

    // 4. LOGIC NHẢY BƯỚC:
    // Nếu AI đã gửi thông tin (VIP hoặc Dịch vụ), ta nhảy thẳng vào Step 1 (Chọn Cơ sở & Dịch vụ)
    // Người dùng không cần chọn lại Loại khám nữa.
    if (shouldSkipStep0) {
        setCurrentStep(1);
    }

  }, [searchParams]);
  // --- [AI ADDITION] END ---

  // --- 1. KHÔI PHỤC DỮ LIỆU SAU LOGIN (CODE GỐC) ---
  useEffect(() => {
      const pending = sessionStorage.getItem("pendingBooking");
      if (pending) {
          try {
            const parsed = JSON.parse(pending);
            setBookingData(parsed);
            
            const summaryStep = parsed.appointmentType === 'STANDARD' ? 3 : 4;
            setCurrentStep(summaryStep); 
            
            sessionStorage.removeItem("pendingBooking");
            toast.info("👋 Chào mừng quay lại! Vui lòng xác nhận đặt lịch.");
          } catch (e) {
            console.error("Lỗi khôi phục data:", e);
          }
      }
  }, []);

  const nextStep = () => setCurrentStep((prev) => prev + 1);
  const prevStep = () => setCurrentStep((prev) => prev - 1);

  const handleRedirectHome = () => {
    navigate("/");
  };

  // --- 2. XỬ LÝ CONFIRM (CODE GỐC) ---
  const handleConfirmBooking = async () => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");

    if (!storedUser || !token) {
        sessionStorage.setItem("pendingBooking", JSON.stringify(bookingData));
        toast.info("🔒 Vui lòng Đăng nhập để hoàn tất!");
        navigate("/login", { state: { from: "/booking" } });
        return;
    }

    setIsSubmitting(true);

    try {
        // 1. Chuẩn bị dữ liệu DateTime chuẩn ISO (2025-12-09T09:00:00Z)
        const timeString = bookingData.time.length === 5 ? `${bookingData.time}:00` : bookingData.time;
        const startDateTime = new Date(`${bookingData.date}T${timeString}`);

        // 2. Chuẩn bị Payload khớp với DTO BookingRequest mới
        const payload = {
            clinicId: bookingData.clinicId,
            doctorId: bookingData.appointmentType === 'VIP' ? bookingData.doctorId : 22, // Nếu Standard thì có thể cần logic chọn bác sĩ ngẫu nhiên hoặc mặc định (Backend sẽ xử lý nếu null, nhưng DTO yêu cầu NotNull nên tạm để ID bác sĩ mặc định hoặc lấy từ clinic)
            // LƯU Ý: Nếu là Standard, backend cần cơ chế auto-assign doctor. 
            // Tạm thời để test, bạn cứ chọn đại 1 bác sĩ nếu user không chọn.
            
            startDateTime: startDateTime.toISOString(),
            serviceIds: bookingData.selectedServices.map((s: any) => s.id),
            note: `Booking Online (${bookingData.appointmentType})`
        };

        // Nếu là Standard mà không có doctorId, hãy nhắc user hoặc set mặc định
        if (!payload.doctorId) {
             // Logic tạm: Nếu chưa chọn bác sĩ, hệ thống có thể báo lỗi hoặc tự gán.
             // Ở đây mình giả định bạn đã chọn bác sĩ ở các bước trước.
             // Nếu Standard bỏ qua bước chọn bác sĩ, bạn cần sửa lại DTO Backend để doctorId không bắt buộc @NotNull.
             console.warn("Chưa chọn bác sĩ, API có thể lỗi 400 nếu doctorId là null");
        }

        console.log("Sending Payload to NEW API:", payload);

        // 3. GỌI API MỚI (QUAN TRỌNG NHẤT)
        // Đổi đường dẫn từ /api/booking/appointments thành /api/patient/appointments
        await axios.post(`${API_BASE_URL}/api/patient/appointments`, payload, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // 4. Thành công -> Hiện Modal
        setShowSuccessModal(true);

    } catch (error: any) {
        console.error("Booking Error:", error);
        const msg = error.response?.data || "Đặt lịch thất bại. Vui lòng thử lại."; // Backend trả String lỗi trực tiếp
        toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
        setIsSubmitting(false);
    }
};

  // --- 3. RENDER STEP CONTENT ---
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Chọn Loại
        return <StepSelectType 
                  currentType={bookingData.appointmentType} // Truyền xuống để highlight (nếu người dùng quay lại)
                  updateData={(d: any) => setBookingData({...bookingData, ...d})} 
                  onNext={nextStep} 
               />;
        
      case 1: // Chọn Dịch vụ & Cơ sở
        return <StepServiceClinic data={bookingData} updateData={setBookingData} onNext={nextStep} onPrev={prevStep} />;
        
      case 2: // RẼ NHÁNH
        if (bookingData.appointmentType === 'STANDARD') {
            return <StepDateTimeStandard data={bookingData} updateData={setBookingData} onNext={nextStep} onPrev={prevStep} />;
        }
        return <StepDoctor data={bookingData} updateData={setBookingData} onNext={nextStep} onPrev={prevStep} />;

      case 3: // RẼ NHÁNH
        if (bookingData.appointmentType === 'STANDARD') {
             return <StepSummary data={bookingData} onConfirm={handleConfirmBooking} onPrev={prevStep} loading={isSubmitting} />;
        }
        return <StepDateTime data={bookingData} updateData={setBookingData} onNext={nextStep} onPrev={prevStep} />;

      case 4: // VIP: Summary
        return <StepSummary data={bookingData} onConfirm={handleConfirmBooking} onPrev={prevStep} loading={isSubmitting} />;
        
      default:
        return null;
    }
  };

  // --- 4. STEPPER DYNAMIC (CODE GỐC) ---
  const maxStepIndex = bookingData.appointmentType === 'STANDARD' ? 3 : 4;
  const stepsArray = Array.from({ length: maxStepIndex + 1 }, (_, i) => i);

  return (
    <>
      <Headers />
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-instrument">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden min-h-[600px] flex flex-col">
          
          {/* HEADER */}
          <div className="bg-gradient-to-r from-[#AACCFF] via-[#6699FF] to-[#3366FF] p-8 text-center relative shrink-0">
            <h2 className="text-3xl font-bold text-white mb-2">Đặt Lịch Khám</h2>
            <p className="text-blue-100">Hoàn tất các bước để chăm sóc nụ cười của bạn</p>
  
            {/* STEPPER CLEAN & DYNAMIC */}
             <div className="flex justify-center items-center mt-8 gap-2 sm:gap-4">
                {stepsArray.map((stepIdx) => (
                    <div key={stepIdx} className="flex items-center">
                        <div 
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-300
                            ${currentStep >= stepIdx 
                                ? 'bg-white text-[#3366FF] border-white scale-110 shadow-lg' 
                                : 'bg-transparent text-blue-200 border-blue-300'}`}
                        >
                            {stepIdx + 1}
                        </div>
                        {stepIdx < maxStepIndex && (
                            <div className={`w-8 sm:w-16 h-1 mx-1 sm:mx-2 rounded-full transition-all duration-500 
                            ${currentStep > stepIdx ? 'bg-white' : 'bg-blue-400/40'}`}>
                            </div>
                        )}
                    </div>
                ))}
             </div>
          </div>
  
          {/* BODY */}
          <div className="p-6 md:p-10 flex-1 flex flex-col justify-center animate-fadeIn">
              {renderStepContent()}
          </div>
  
        </div>
      </div>
      
      <BookingSuccessModal 
        isOpen={showSuccessModal} 
        onClose={handleRedirectHome} 
      />
      
      <Footer />
    </>
  );
}
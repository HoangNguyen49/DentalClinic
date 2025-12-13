import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  
  // Bắt đầu từ bước 0 (Chọn Loại)
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [bookingData, setBookingData] = useState({
    appointmentId: null as number | null, // Lưu ID lịch hẹn sau khi tạo
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
    time: ''
  });

  // --- 1. KHÔI PHỤC DỮ LIỆU SAU LOGIN HOẶC QUAY LẠI TỪ THANH TOÁN ---
  useEffect(() => {
      const pending = sessionStorage.getItem("pendingBooking");
      const retryData = sessionStorage.getItem("bookingRetryData");

      // Trường hợp 1: Quay lại sau khi Login
      if (pending) {
          try {
            const parsed = JSON.parse(pending);
            setBookingData(parsed);
            
            const summaryStep = parsed.appointmentType === 'STANDARD' ? 3 : 4;
            setCurrentStep(summaryStep); 
            
            toast.warning("Giao dịch chưa hoàn tất. Vui lòng chọn phương thức thanh toán khác.");
          } catch (e) {
            console.error("Lỗi khôi phục data pending:", e);
          }
      } 
      // Trường hợp 2: Quay lại sau khi Hủy/Lỗi thanh toán (MỚI THÊM)
      else if (retryData) {
          try {
            const parsed = JSON.parse(retryData);
            setBookingData(parsed);
            
            // Vì chỉ VIP mới thanh toán nên thường là bước 4, 
            // nhưng cứ để logic check type cho chắc chắn
            const summaryStep = parsed.appointmentType === 'STANDARD' ? 3 : 4;
            setCurrentStep(summaryStep); 
            
            sessionStorage.removeItem("bookingRetryData");
            toast.warning("Giao dịch chưa hoàn tất. Vui lòng chọn phương thức thanh toán khác.");
          } catch (e) {
            console.error("Lỗi khôi phục data retry:", e);
          }
      }
  }, []);

  const nextStep = () => setCurrentStep((prev) => prev + 1);
  const prevStep = () => setCurrentStep((prev) => prev - 1);

  const handleRedirectHome = () => {
    navigate("/");
  };

  // --- 2. XỬ LÝ CONFIRM ---
  const handleConfirmBooking = async () => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");

    if (!storedUser || !token) {
        sessionStorage.setItem("pendingBooking", JSON.stringify(bookingData));
        toast.info("🔒 Vui lòng Đăng nhập (hoặc Đăng ký) để hoàn tất!");
        navigate("/login", { state: { from: "/booking" } });
        return; // Dừng lại, không trả về gì
    }

    if (bookingData.appointmentId) {
        console.log("♻️ Tái sử dụng lịch hẹn cũ:", bookingData.appointmentId);
        return { id: bookingData.appointmentId }; 
    }

    const currentUser = JSON.parse(storedUser);
    const patientId = currentUser.patientId || 0; 
    
    setIsSubmitting(true);

    try {
      const timeString = bookingData.time.length === 5 ? `${bookingData.time}:00` : bookingData.time;
      const startDateTime = new Date(`${bookingData.date}T${timeString}`);

      const payload = {
        appointmentType: bookingData.appointmentType,
        bookingFee: bookingData.bookingFee,
        clinicId: bookingData.clinicId,
        patientId: patientId,
        doctorId: bookingData.appointmentType === 'VIP' ? bookingData.doctorId : null,
        roomId: null,
        startDateTime: startDateTime.toISOString(),
        status: bookingData.appointmentType === 'VIP' ? "AWAITING_PAYMENT" : "PENDING",
        paymentStatus: "UNPAID",
        channel: "WEB_BOOKING",
        note: `Booking Online (${bookingData.appointmentType})`,
        services: bookingData.selectedServices.map((s: any) => ({
            serviceId: s.id,
            quantity: 1,
        }))
      };

      // 1. GỌI API TẠO LỊCH
      const response = await axios.post(`${API_BASE_URL}/api/booking/appointments`, payload, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
      });

      const resData = response.data as any; 
      setBookingData((prev: any) => ({ ...prev, appointmentId: resData.id }));

      // 2. PHÂN LUỒNG XỬ LÝ
      // Nếu là VIP: Trả về data để StepSummary lo việc redirect thanh toán. KHÔNG hiện modal success.
      if (bookingData.appointmentType === 'VIP') {
          return response.data; 
      }

      // Nếu là STANDARD: Hiện modal thành công luôn (vì không cần thanh toán)
      setShowSuccessModal(true);
      return response.data;

    } catch (error: any) {
      console.error("Booking Error:", error);
      const msg = error.response?.data?.message || "Đặt lịch thất bại. Vui lòng thử lại.";
      toast.error(msg);
      throw error; // Ném lỗi để StepSummary biết mà dừng loading
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 3. RENDER STEP CONTENT ---
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Chọn Loại
        return <StepSelectType updateData={(d: any) => setBookingData({...bookingData, ...d})} onNext={nextStep} />;
        
      case 1: // Chọn Dịch vụ & Cơ sở
        return <StepServiceClinic data={bookingData} updateData={setBookingData} onNext={nextStep} onPrev={prevStep} />;
        
      case 2: // RẼ NHÁNH
        if (bookingData.appointmentType === 'STANDARD') {
            // Standard: Chọn Buổi (Sáng/Chiều) -> Next sang bước 3 (Summary)
            return <StepDateTimeStandard data={bookingData} updateData={setBookingData} onNext={nextStep} onPrev={prevStep} />;
        }
        // VIP: Chọn Bác sĩ
        return <StepDoctor data={bookingData} updateData={setBookingData} onNext={nextStep} onPrev={prevStep} />;

      case 3: // RẼ NHÁNH
        if (bookingData.appointmentType === 'STANDARD') {
             // Standard: Summary
             return <StepSummary data={bookingData} onConfirm={handleConfirmBooking} onPrev={prevStep} loading={isSubmitting} />;
        }
        // VIP: Chọn Giờ chi tiết
        return <StepDateTime data={bookingData} updateData={setBookingData} onNext={nextStep} onPrev={prevStep} />;

      case 4: // VIP: Summary
        return <StepSummary data={bookingData} onConfirm={handleConfirmBooking} onPrev={prevStep} loading={isSubmitting} />;
        
      default:
        return null;
    }
  };

  // --- 4. STEPPER DYNAMIC ---
  // Xác định tổng số bước (Index cuối cùng)
  // Standard: 0, 1, 2, 3 (Tổng 4 bước)
  // VIP: 0, 1, 2, 3, 4 (Tổng 5 bước)
  const maxStepIndex = bookingData.appointmentType === 'STANDARD' ? 3 : 4;

  // Tạo mảng bước để map: [0, 1, 2, 3] hoặc [0, 1, 2, 3, 4]
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
                        {/* Vòng tròn số */}
                        <div 
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all duration-300
                            ${currentStep >= stepIdx 
                                ? 'bg-white text-[#3366FF] border-white scale-110 shadow-lg' 
                                : 'bg-transparent text-blue-200 border-blue-300'}`}
                        >
                            {stepIdx + 1}
                        </div>
                        
                        {/* Đường kẻ nối (Chỉ vẽ nếu không phải bước cuối) */}
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
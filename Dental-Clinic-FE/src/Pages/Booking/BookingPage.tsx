import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom'; 
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next'; // 1. Import i18n

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
  const { t } = useTranslation("booking"); // 2. Khởi tạo hook
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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
    time: '',
    
    // [AI ADDITION] Lưu ID dịch vụ từ AI để Step 1 tự động chọn
    prefilledServiceId: null as number | null 
  });

  // --- [AI ADDITION] START: Xử lý dữ liệu từ Chatbot ---
  useEffect(() => {
    const typeParam = searchParams.get('type'); 
    const doctorIdParam = searchParams.get('prefillDoctor');
    const serviceIdParam = searchParams.get('prefillService');

    let shouldSkipStep0 = false; 

    // 1. Xử lý VIP (Do AI gửi type VIP hoặc có chọn bác sĩ)
    if (typeParam === 'VIP' || doctorIdParam) {
      setBookingData(prev => ({ 
          ...prev, 
          appointmentType: 'VIP',
          bookingFee: 1000000 // [FIX] Set cứng phí VIP để không bị 0đ
      }));
      shouldSkipStep0 = true;
    } 
    // 2. Xử lý Standard (Nếu AI gửi service mà không phải VIP)
    else if (serviceIdParam) {
        setBookingData(prev => ({ 
            ...prev, 
            appointmentType: 'STANDARD',
            bookingFee: 500000 // [FIX] Set cứng phí Standard
        }));
        shouldSkipStep0 = true;
    }

    // 3. Nếu AI gửi ID bác sĩ -> Lưu vào state
    if (doctorIdParam) {
      setBookingData(prev => ({ 
        ...prev, 
        appointmentType: 'VIP', 
        bookingFee: 1000000, 
        doctorId: Number(doctorIdParam) 
      }));
    }

    // 4. Nếu AI gửi ID dịch vụ -> Lưu tạm
    if (serviceIdParam) {
      setBookingData(prev => ({
        ...prev,
        prefilledServiceId: Number(serviceIdParam)
      }));
    }

    // 5. Logic nhảy bước: Bỏ qua bước 0 (Chọn loại) nếu AI đã định hướng
    if (shouldSkipStep0) {
        setCurrentStep(1);
    }

  }, [searchParams]);
  // --- [AI ADDITION] END ---

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
            
            toast.warning(t("stepSummary.expiredModal.message")); // Dùng message tạm hoặc tạo key mới
          } catch (e) {
            console.error("Lỗi khôi phục data pending:", e);
          }
      } 
      // Trường hợp 2: Quay lại sau khi Hủy/Lỗi thanh toán
      else if (retryData) {
          try {
            const parsed = JSON.parse(retryData);
            setBookingData(parsed);
            
            const summaryStep = parsed.appointmentType === 'STANDARD' ? 3 : 4;
            setCurrentStep(summaryStep); 
            
            sessionStorage.removeItem("bookingRetryData");
            toast.warning(t("paymentResult.failed.message")); // Dùng message lỗi thanh toán
          } catch (e) {
            console.error("Lỗi khôi phục data retry:", e);
          }
      }
  }, [t]);

  const nextStep = () => setCurrentStep((prev) => prev + 1);
  const prevStep = () => setCurrentStep((prev) => prev - 1);

  const handleRedirectHome = () => {
    navigate("/");
  };

  // --- 2. XỬ LÝ CONFIRM (CHỐNG RACE CONDITION) ---
  const handleConfirmBooking = async () => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");

    if (!storedUser || !token) {
        sessionStorage.setItem("pendingBooking", JSON.stringify(bookingData));
        toast.info("🔒 " + t("stepDateVIP.errors.login")); 
        navigate("/login", { state: { from: "/booking" } });
        return; 
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

      // Payload gửi lên Backend
      const payload = {
        clinicId: bookingData.clinicId,
        patientId: patientId,
        appointmentType: bookingData.appointmentType,
        bookingFee: bookingData.bookingFee,
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

      console.log("Sending Payload:", payload);

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
      if (bookingData.appointmentType === 'VIP') {
          return response.data; 
      }

      setShowSuccessModal(true);
      return response.data;

    } catch (error: any) {
      console.error("Booking Error:", error);

      // LẤY MESSAGE LỖI TỪ BACKEND
      const errorData = error.response?.data;
      const errorMsg = typeof errorData === 'string' ? errorData : (errorData?.message || "");

      // XỬ LÝ LỖI TRÙNG LỊCH (SLOT_ALREADY_BOOKED)
      if (errorMsg === "SLOT_ALREADY_BOOKED") {
          // Hiện thông báo lỗi từ i18n
          toast.error(t("stepDateTime.errors.slotTaken") || "Khung giờ này vừa có người khác đặt mất rồi, vui lòng chọn lại!");
          
          // Tự động đẩy khách về bước chọn giờ
          // Standard: Case 2 | VIP: Case 3
          const timeStep = bookingData.appointmentType === 'STANDARD' ? 2 : 3;
          setCurrentStep(timeStep); 
      } else {
          const msg = errorMsg || t("common.error");
          toast.error(msg);
      }

      throw error; 
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 3. RENDER STEP CONTENT ---
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Chọn Loại
        return <StepSelectType 
                  currentType={bookingData.appointmentType} 
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

  // --- 4. STEPPER DYNAMIC ---
  const maxStepIndex = bookingData.appointmentType === 'STANDARD' ? 3 : 4;
  const stepsArray = Array.from({ length: maxStepIndex + 1 }, (_, i) => i);

  return (
    <>
      <Headers />
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-instrument">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden min-h-[600px] flex flex-col">
          
          {/* HEADER */}
          <div className="bg-gradient-to-r from-[#AACCFF] via-[#6699FF] to-[#3366FF] p-8 text-center relative shrink-0">
            <h2 className="text-3xl font-bold text-white mb-2">{t("title")}</h2>
            <p className="text-blue-100">{t("stepType.title")}</p> {/* Có thể đổi key subtitle khác nếu muốn */}
  
            {/* STEPPER */}
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
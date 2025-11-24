import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import StepServiceClinic from './Steps/StepServiceClinic';
import StepDoctor from './Steps/StepDoctor';
import StepDateTime from './Steps/StepDateTime';
import StepSummary from './Steps/StepSummary';
import BookingSuccessModal from './BookingSuccessModal';
import Headers from '../../widgets/Header/Header';
import Footer from '../../widgets/Footer/Footer';
import axios from 'axios';

export default function BookingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  
 
  const [bookingData, setBookingData] = useState({
    clinicId: null as number | null,
    clinicName: '',
    clinicAddress: '',
    // Mảng để chọn đa dịch vụ
    selectedServices: [] as any[],
    serviceName: '',
    serviceCategory: '',
    doctorId: null as number | null,
    doctorName: '',
    avatarUrl: '',
    date: '',
    time: ''
  });

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleConfirmBooking = async () => {
    // 1. Kiểm tra đăng nhập & Lấy token
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");

    if (!storedUser || !token) {
      alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      navigate("/login", { state: { from: "/booking" } });
      return;
    }

    const currentUser = JSON.parse(storedUser);
    
    // --- FIX 1: LOGIC PATIENT ID ---
    // Nếu trong localStorage có patientId thì dùng, nếu chưa có (user mới) thì gửi 0.
    // Backend sẽ tự động tìm profile Patient dựa vào userId trong Token.
    const patientId = currentUser.patientId || 0; 


    setIsSubmitting(true);

    try {
      // 2. Chuẩn bị Payload
      // Đảm bảo time string chuẩn HH:mm:ss
      const timeString = bookingData.time.length === 5 ? `${bookingData.time}:00` : bookingData.time;
      
      // Tạo Date object để lấy chuẩn ISO 8601
      const startDateTime = new Date(`${bookingData.date}T${timeString}`);

      const payload = {
        clinicId: bookingData.clinicId,
        patientId: patientId, // Gửi 0 hoặc ID thật
        doctorId: bookingData.doctorId,
        roomId: null, // Để null, để Backend hoặc Lễ tân xếp sau
        startDateTime: startDateTime.toISOString(),
        status: "PENDING",
        channel: "WEB_BOOKING",
        note: "Đặt lịch Online từ Website",
        services: bookingData.selectedServices.map((service: any) => ({
            serviceId: service.id || service.serviceId, // Lấy ID dịch vụ
            quantity: 1, // Mặc định số lượng là 1
        }))
      };

      console.log("Sending Booking Payload:", payload);

      // 3. Gọi API
      // --- FIX 2: SỬA LỖI TYPO URL (Bỏ dấu ' ở cuối) ---
      // Đảm bảo bạn đã tạo endpoint này trong PatientBookingController
      await axios.post(
        `${API_BASE_URL}/api/booking/appointments`, 
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`, 
            'Content-Type': 'application/json'
          }
        }
      );

      // 4. Thành công
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error("Booking Error:", error);
      const status = error.response?.status;
      const errorData = error.response?.data;
      
      let title = "Đặt lịch thất bại";
      let message = "Có lỗi xảy ra. Vui lòng thử lại sau.";

      // Phân loại lỗi để báo chi tiết
      if (status === 409) { // Conflict
         title = "Rất tiếc, khung giờ này vừa có người đặt!";
         message = "Hệ thống vừa ghi nhận một lịch hẹn khác trùng với thời gian bạn chọn. Vui lòng chọn khung giờ khác.";
      } else if (status === 404) {
         title = "Dữ liệu không tồn tại";
         message = "Có vẻ như Dịch vụ hoặc Bác sĩ này đã thay đổi. Vui lòng tải lại trang.";
      } else if (errorData && errorData.message) {
         message = errorData.message; // Lấy message từ Backend trả về
      }

      // Hiện Toast Custom đẹp
      toast.error(
        <div className="flex flex-col gap-1">
          <h4 className="font-bold text-base">{title}</h4>
          <p className="text-sm text-gray-100">{message}</p>
        </div>,
        {
          position: "top-center", 
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          className: "bg-red-500 text-white rounded-xl shadow-2xl", 
          style: { background: "#EF4444", color: "white", borderRadius: "12px" } 
        }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRedirectHome = () => {
    navigate("/");
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
            <div className="text-center pb-10">
                <h3 className="text-2xl text-gray-500 pb-10">Step 1: Service & Clinic</h3>
                <StepServiceClinic data={bookingData} updateData={setBookingData} onNext={nextStep} />  
            </div>
        );
      case 2:
        return (
            <div className="text-center p-10">
                <h3 className="text-2xl text-gray-500 pb-10">Step 2: Doctor Selection</h3>
                <StepDoctor 
            data={bookingData} 
            updateData={setBookingData} 
            onNext={nextStep} 
            onPrev={prevStep} 
          />
            </div>
        );
      case 3:
        return (
          <StepDateTime 
            data={bookingData} 
            updateData={setBookingData} 
            onNext={nextStep} 
            onPrev={prevStep} 
          />
        );
      case 4:
        return (
          <StepSummary 
            data={bookingData} 
            onConfirm={handleConfirmBooking} 
            onPrev={prevStep} 
            loading={isSubmitting} 
          />
        );
      default:
        return null;
    }
  };

  return (
<>
<Headers/>
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-instrument">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        
        {/* HEADER: Gradient & Progress Bar */}
        <div className="bg-gradient-to-r from-[#AACCFF] via-[#6699FF] to-[#3366FF] p-8 text-center relative">
          <h2 className="text-3xl font-bold text-white mb-2">Đặt Lịch Khám</h2>
          <p className="text-blue-100">Hoàn tất 4 bước để chăm sóc nụ cười của bạn</p>

          {/* Stepper */}
          <div className="flex justify-center items-center mt-8 relative z-10">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                {/* Step Circle */}
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 border-2 
                    ${currentStep >= step 
                      ? 'bg-white text-[#3366FF] border-white scale-110 shadow-lg' 
                      : 'bg-transparent text-blue-200 border-blue-300'}`}
                >
                  {step}
                </div>
                
                {/* Connector Line (trừ bước cuối) */}
                {step < 4 && (
                  <div className={`w-16 md:w-24 h-1 transition-all duration-500 mx-2 rounded-full
                    ${currentStep > step ? 'bg-white' : 'bg-blue-300'}`} 
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* BODY: Step Content */}
        <div className="p-6 md:p-10">
            {renderStepContent()}
        </div>

      </div>
    </div>
    <BookingSuccessModal 
        isOpen={showSuccessModal} 
        onClose={handleRedirectHome} 
      />
    <Footer/>
    </>
  );
}
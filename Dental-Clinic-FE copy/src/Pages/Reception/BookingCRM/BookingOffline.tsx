import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

// --- IMPORT CÁC STEPS ---
import StepSelectPatient from '../Patient/StepSelectPatient'; // Bước 1: Chọn Khách
import StepSelectType from '../../Booking/Steps/StepSelectType'; // Bước 2: Chọn Loại
import StepServiceClinic from '../../Booking/Steps/StepServiceClinic'; // Bước 3: Dịch vụ
import StepDoctor from '../../Booking/Steps/StepDoctor'; // Bước 4 (VIP): Bác sĩ
import StepDateTimeStandard from '../../Booking/Steps/StepDateTimeStandard'; // Bước 4 (Standard): Chọn Buổi
import StepDateTime from '../../Booking/Steps/StepDateTime'; // Bước 5 (VIP): Chọn Giờ
import StepSummary from '../../Booking/Steps/StepSummary'; // Bước Cuối: Xác nhận

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function BookingOffline() {
  const navigate = useNavigate();
  
  // Bắt đầu từ Bước 1 (Chọn Khách)
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State dữ liệu
  const [bookingData, setBookingData] = useState({
    // --- THÔNG TIN KHÁCH HÀNG (Từ Step 1) ---
    patientId: null as number | null,
    patientName: '',
    patientCode: '',
    patientPhone: '',

    // --- THÔNG TIN ĐẶT LỊCH ---
    appointmentType: 'STANDARD', // Mặc định
    bookingFee: 0,
    sessionLabel: '', // VD: "Buổi Sáng"

    clinicId: null as number | null,
    clinicName: '',
    clinicAddress: '',
    selectedServices: [] as any[],
    serviceCategory: '',
    
    doctorId: null as number | null,
    doctorName: '',
    doctorAvatar: '',
    doctorSpecialties: [] as string[],
    
    date: new Date().toISOString().split('T')[0], // Mặc định hôm nay
    time: ''
  });

  // --- ĐIỀU HƯỚNG STEP ---
  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => prev - 1);

  // --- RENDER NỘI DUNG ---
  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // CHỌN KHÁCH HÀNG
        return (
             <StepSelectPatient 
                updateData={(d: any) => setBookingData({...bookingData, ...d})} 
                onNext={nextStep} 
             />
        );

      case 2: // CHỌN LOẠI LỊCH (Standard/VIP)
        return (
            <StepSelectType 
                updateData={(d: any) => setBookingData({...bookingData, ...d})} 
                onNext={nextStep} 
            />
        );

      case 3: // CHỌN DỊCH VỤ
        return (
            <StepServiceClinic 
                data={bookingData} 
                updateData={setBookingData} 
                onNext={nextStep} 
                onPrev={prevStep}
            />
        );

      case 4: // RẼ NHÁNH
        // Nếu là Standard -> Chọn Buổi -> Nhảy cóc sang bước Summary (Là bước 5 của Standard, nhưng là bước 6 của flow tổng)
        // Để đơn giản, ta render StepDateTimeStandard ở đây và onNext sẽ nhảy tới Summary
        if (bookingData.appointmentType === 'STANDARD') {
             return (
                <StepDateTimeStandard 
                    data={bookingData} 
                    updateData={setBookingData} 
                    onNext={() => setCurrentStep(6)} // Nhảy thẳng tới Summary (Step 6)
                    onPrev={prevStep} 
                />
             );
        }
        // Nếu là VIP -> Chọn Bác sĩ
        return (
            <StepDoctor 
                data={bookingData} 
                updateData={setBookingData} 
                onNext={nextStep} 
                onPrev={prevStep} 
            />
        );

      case 5: // CHỌN GIỜ (CHỈ VIP)
        // Standard không bao giờ vào case này vì đã nhảy cóc ở trên
        return (
            <StepDateTime 
                data={bookingData} 
                updateData={setBookingData} 
                onNext={nextStep} 
                onPrev={prevStep} 
            />
        );

      case 6: // XÁC NHẬN (SUMMARY)
        return (
            <StepSummary 
                data={bookingData} 
                onConfirm={handleConfirmBooking} 
                onPrev={() => setCurrentStep(bookingData.appointmentType === 'STANDARD' ? 4 : 5)} 
                loading={isSubmitting} 
            />
        );
        
      default: return null;
    }
  };

  // --- XỬ LÝ TẠO LỊCH ---
  const handleConfirmBooking = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    setIsSubmitting(true);
    try {
      // Chuẩn hóa giờ (Standard chỉ có 08:00 hoặc 13:00, VIP có giờ cụ thể)
      const timeString = bookingData.time.length === 5 ? `${bookingData.time}:00` : bookingData.time;
      const startDateTime = new Date(`${bookingData.date}T${timeString}`);

      const payload = {
        appointmentType: bookingData.appointmentType,
        bookingFee: bookingData.bookingFee,
        clinicId: bookingData.clinicId,
        patientId: bookingData.patientId, // ID khách lấy từ Step 1
        
        // Nếu Standard thì doctorId là null
        doctorId: bookingData.appointmentType === 'VIP' ? bookingData.doctorId : null,
        
        roomId: null, 
        startDateTime: startDateTime.toISOString(),
        status: "CONFIRMED", // Walk-in thì xác nhận luôn
        channel: "WALK_IN",
        note: `Lễ tân đặt tại quầy (${bookingData.appointmentType})`,
        
        services: bookingData.selectedServices.map((s: any) => ({
            serviceId: s.id || s.serviceId,
            quantity: 1
        }))
      };

      console.log("Sending Walk-in Payload:", payload);

      await axios.post(
        `${API_BASE_URL}/api/reception/appointments`, 
        payload,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      toast.success("Đặt lịch thành công! ✅");
      navigate('/reception/dashboard'); // Quay về Dashboard để xếp lịch
      
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || "Lỗi đặt lịch.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- UI STEPPER INDICATOR ---
  // Tính số bước hiển thị
  const totalSteps = bookingData.appointmentType === 'STANDARD' ? 5 : 6;
  // Step 1: Khách -> Step 2: Loại -> Step 3: Dịch vụ -> Step 4: Bác/Buổi -> (Step 5: Giờ - VIP Only) -> Summary

  return (
  <div className="flex-1 bg-gray-100 flex items-center justify-center p-4 font-instrument">

    {/* CONTAINER CHÍNH */}
    <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col h-[85vh] overflow-hidden border border-gray-200">

      {/* HEADER (Cố định, không cuộn) */}
      <div className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center shadow-md shrink-0">
        
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            🏥 Walk-in Booking
          </h2>
          <p className="text-gray-400 text-xs mt-1">Tiếp nhận & Đặt lịch tại quầy</p>
        </div>

        {/* STEP INDICATOR */}
        <div className="flex items-center gap-2">
          {Array.from({ length: totalSteps }).map((_, idx) => {
            const stepNum = idx + 1;

            let isActive = false;
            if (bookingData.appointmentType === "STANDARD") {
              if (currentStep === 6 && stepNum === 5) isActive = true;
              else if (currentStep === stepNum) isActive = true;
            } else {
              if (currentStep === stepNum) isActive = true;
            }

            return (
              <div
                key={stepNum}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                  ${
                    currentStep >= stepNum || isActive
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "border-gray-600 text-gray-500"
                  }`}
              >
                {stepNum}
              </div>
            );
          })}
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 relative">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          {renderStepContent()}
        </div>
      </div>

    </div>
  </div>
);

}
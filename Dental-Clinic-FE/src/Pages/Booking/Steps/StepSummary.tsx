interface StepProps {
  data: any;
  onConfirm: () => void;
  onPrev: () => void;
  loading?: boolean;
}

export default function StepSummary({ data, onConfirm, onPrev, loading }: StepProps) {
  
  // Format ngày cho đẹp (VD: Thứ Hai, 20/11/2025)
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', { 
      weekday: 'long', 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    }).format(date);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-800">Xác Nhận Thông Tin</h3>
        <p className="text-gray-500 mt-1">Vui lòng kiểm tra kỹ thông tin trước khi đặt lịch</p>
      </div>

      {/* TICKET CARD */}
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Header Vé - Gradient */}
        <div className="bg-gradient-to-r from-[#AACCFF] via-[#6699FF] to-[#3366FF] p-6 text-white relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/20 rounded-full blur-xl"></div>
            <div className="absolute -left-6 -bottom-6 w-20 h-20 bg-white/20 rounded-full blur-xl"></div>
            
            <h4 className="text-lg font-bold opacity-90">Phiếu Đặt Hẹn</h4>
            <div className="text-3xl font-bold mt-2">{data.time?.substring(0,5)}</div>
            <div className="text-blue-100 font-medium">{formatDate(data.date)}</div>
        </div>

        {/* Body Vé */}
        <div className="p-6 space-y-6">
            
            {/* 1. Bác sĩ & Dịch vụ */}
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-xl shadow-sm border border-blue-100">
                    👨‍⚕️
                </div>
                <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Bác sĩ & Dịch vụ</p>
                    <p className="font-bold text-gray-800 text-lg">{data.doctorName}</p>
                    <p className="text-blue-600 font-medium">{data.serviceName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{data.serviceCategory}</p>
                </div>
            </div>

            <div className="border-t border-dashed border-gray-200"></div>

            {/* 2. Địa điểm */}
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-xl shadow-sm border border-blue-100">
                    📍
                </div>
                <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Địa điểm</p>
                    <p className="font-bold text-gray-800">{data.clinicName}</p>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">{data.clinicAddress}</p>
                </div>
            </div>

        </div>

        {/* Footer Vé - Note */}
        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
            <p className="text-xs text-gray-500 italic">
                * Vui lòng đến trước 10 phút để làm thủ tục check-in.
            </p>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 mt-8 border-t border-gray-100">
        <button 
            onClick={onPrev} 
            disabled={loading}
            className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-full transition font-medium disabled:opacity-50"
        >
            Quay Lại
        </button>
        
        <button 
          onClick={onConfirm}
          disabled={loading}
          className="px-10 py-3 rounded-full bg-gradient-to-r from-[#6699FF] to-[#3366FF] text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none transition-all duration-300 flex items-center gap-2"
        >
            {loading ? (
                <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Đang xử lý...
                </>
            ) : (
                "Xác Nhận Đặt Lịch"
            )}
        </button>
      </div>
    </div>
  );
}
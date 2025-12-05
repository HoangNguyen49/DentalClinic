interface StepProps {
  data: any;
  onConfirm: () => void;
  onPrev: () => void;
  loading?: boolean;
}

export default function StepSummary({ data, onConfirm, onPrev, loading }: StepProps) {
  
  // Format ngày
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', { 
      weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' 
    }).format(date);
  };

  // Format tiền tệ
  const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // --- TÍNH TOÁN CHI PHÍ ---
  // 1. Tổng tiền dịch vụ
  const servicesTotal = (data.selectedServices || []).reduce((acc: number, s: any) => acc + (s.price || 0), 0);
  
  // 2. Phí đặt lịch (Lấy từ data, nếu không có thì fallback về 0)
  const bookingFee = data.bookingFee || 0;
  
  // 3. Tổng thanh toán cuối cùng
  const grandTotal = servicesTotal + bookingFee;

  // Tổng thời gian
  const totalDuration = (data.selectedServices || []).reduce((acc: number, s: any) => acc + (s.defaultDuration || 0), 0);
  
  const uniqueCategories = Array.from(new Set((data.selectedServices || []).map((s: any) => s.category)));

  return (
    <div className="space-y-8 animate-fadeIn">
      
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-800">Xác Nhận Thông Tin</h3>
        <p className="text-gray-500 mt-1">Vui lòng kiểm tra kỹ thông tin trước khi đặt lịch</p>
      </div>

      {/* TICKET CARD */}
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#AACCFF] via-[#6699FF] to-[#3366FF] p-6 text-white relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/20 rounded-full blur-xl"></div>
            <div className="absolute -left-6 -bottom-6 w-20 h-20 bg-white/20 rounded-full blur-xl"></div>
            
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <h4 className="text-lg font-bold opacity-90">Phiếu Đặt Hẹn</h4>
                    <div className="text-blue-100 font-medium text-sm mt-1">{formatDate(data.date)}</div>
                </div>
                <div className="text-right">
                    <div className="text-4xl font-bold tracking-tight">{data.time?.substring(0,5)}</div>
                    <div className="text-xs bg-white/20 px-2 py-0.5 rounded inline-block mt-1 backdrop-blur-sm">
                        {totalDuration} phút dự kiến
                    </div>
                </div>
            </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
            
            {/* 1. Bác sĩ (Chỉ hiện nếu có - VIP) */}
            {data.doctorName && (
                <>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center border-2 border-blue-100 shrink-0 overflow-hidden">
                            {data.doctorAvatar ? (
                                <img src={data.doctorAvatar} alt={data.doctorName} className="w-full h-full object-cover" />
                            ) : (
                                <svg className="h-8 w-8 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Bác sĩ phụ trách</p>
                            <p className="font-bold text-gray-800 text-lg">{data.doctorName}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {uniqueCategories.map((cat: any, index) => (
                                    <span key={index} className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                        {cat}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-dashed border-gray-200"></div>
                </>
            )}

            {/* 2. Chi tiết thanh toán */}
            <div>
                <div className="flex justify-between items-center mb-3">
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider flex items-center gap-2">
                        <span>Chi tiết dịch vụ</span>
                    </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 space-y-3 border border-gray-100">
                    {/* Danh sách dịch vụ */}
                    <div className="max-h-40 overflow-y-auto custom-scrollbar pr-1 space-y-2">
                        {(data.selectedServices || []).map((service: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-start text-sm group border-b border-gray-200/50 pb-2 last:border-0 last:pb-0">
                                <div className="flex items-start gap-2 overflow-hidden">
                                    <span className="text-blue-500 mt-1 text-[10px] shrink-0">●</span>
                                    <span className="font-medium text-gray-700 truncate" title={service.serviceName}>
                                        {service.serviceName}
                                    </span>
                                </div>
                                <div className="text-right shrink-0 ml-2">
                                    <div className="font-bold text-gray-900">{formatCurrency(service.price)}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Phí đặt lịch (Thêm mới) */}
                    <div className="flex justify-between items-center text-sm pt-2 border-t border-dashed border-gray-200 mt-2">
                        <span className="text-gray-600">Phí đặt lịch ({data.appointmentType === 'VIP' ? 'VIP' : 'Tiêu chuẩn'})</span>
                        <span className="font-bold text-gray-800">{formatCurrency(bookingFee)}</span>
                    </div>
                    
                    {/* Tổng cộng */}
                    <div className="border-t border-gray-200 pt-3 mt-2 flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-600">Tổng cộng</span>
                        <span className="text-xl font-extrabold text-[#3366FF]">{formatCurrency(grandTotal)}</span>
                    </div>
                </div>
            </div>

            <div className="border-t border-dashed border-gray-200"></div>

            {/* 3. Địa điểm */}
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-xl shadow-sm border border-blue-100 shrink-0">
                    📍
                </div>
                <div>
                    <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Địa điểm</p>
                    <p className="font-bold text-gray-800">{data.clinicName}</p>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">{data.clinicAddress}</p>
                </div>
            </div>

        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
            <p className="text-xs text-gray-500 italic">
                * Vui lòng đến trước 10 phút để làm thủ tục check-in.
            </p>
        </div>
      </div>

      {/* Buttons */}
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
import { useEffect, useState } from "react";
import { toast } from "react-toastify"; 
import { useTranslation } from "react-i18next"; 
import { receptionApi, type Room } from "../receptionApi"; 

interface Props {
  isOpen: boolean;
  onClose: () => void;
  appointment: any; 
  onSuccess: (updatedAppointment: any) => void; 
}

export default function RoomSelectionModal({ isOpen, onClose, appointment, onSuccess }: Props) {
  const { t } = useTranslation("reception"); // 2. Khởi tạo hook
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  // 1. Khi mở Modal -> Gọi API tìm phòng trống
  useEffect(() => {
    if (isOpen && appointment) {
      // Reset state
      setRooms([]);
      setSelectedRoomId(appointment.room ? appointment.room.id : null);
      
      fetchAvailableRooms();
    }
  }, [isOpen, appointment]);

  const fetchAvailableRooms = async () => {
    if (!appointment) return;
    setLoading(true);
    try {
      const res = await receptionApi.getAvailableRooms(
        appointment.clinic?.id || appointment.clinicId, 
        appointment.startDateTime,
        appointment.endDateTime
      );
      
      const roomList = Array.isArray(res) ? res : (res as any).data;
      setRooms(roomList || []);

    } catch (error) {
      console.error("Lỗi tải phòng:", error);
      toast.error(t("roomModal.errorLoad")); // Dịch lỗi tải
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
  if (!appointment) return;
  setLoading(true);
  try {
    const res = await receptionApi.assignRoom(appointment.id, null); 
    
    
    toast.info("Room Reset", { toastId: "reset-room" }); 
    
    setSelectedRoomId(null);
    const updatedData = (res as any).data || res;
    
    // Gọi onSuccess nhưng lưu ý: Kiểm tra ở component cha xem có toast nào trong đó không
    onSuccess(updatedData); 
    onClose();
  } catch (error: any) {
    const msg = error.response?.data?.message || "Không thể reset phòng";
    toast.error(msg, { toastId: "error-reset" });
  } finally {
    setLoading(false);
  }
};

  const handleSave = async () => {
  if (!selectedRoomId || !appointment) return;
  setLoading(true);
  try {
    const res = await receptionApi.assignRoom(appointment.id, selectedRoomId);
    
    // Thêm toastId để ngăn chặn việc spam toast 2 lần nếu render lại
    toast.success(t("roomModal.success"), { toastId: "assign-room" }); 
    
    const updatedData = (res as any).data || res;
    onSuccess(updatedData);
    onClose();
  } catch (error: any) {
    const msg = error.response?.data?.message || t("roomModal.errorSave"); 
    toast.error(msg, { toastId: "error-save" });
  } finally {
    setLoading(false);
  }
};

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
        
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-800">{t("roomModal.title")}</h3>
            <p className="text-sm text-gray-500">
                {t("roomModal.patient")}: <b>{appointment?.patient?.fullName || t("roomModal.walkInGuest")}</b>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 text-2xl">&times;</button>
        </div>

        {/* List Phòng */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
             <div className="text-center py-6 text-gray-500">⏳ {t("roomModal.loading")}</div>
          ) : rooms.length === 0 ? (
             <div className="text-center py-6 text-red-500 bg-red-50 rounded border border-red-100">
                🚫 {t("roomModal.noRoom")}
             </div>
          ) : (
            <div className="space-y-2">
              {rooms.map((room) => {
                const isSelected = selectedRoomId === room.id;
                const isVip = room.isPrivate;

                return (
                  <div 
                    key={room.id}
                    onClick={() => setSelectedRoomId(room.id)}
                    className={`
                      cursor-pointer p-3 rounded-lg border-2 flex items-center justify-between transition-all
                      ${isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-black shadow-inner border
                      ${isVip 
                        ? 'bg-amber-50 text-amber-600 border-amber-200' 
                        : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                      {isVip ? 'VIP' : 'STD'}
                    </div>
                      
                      {/* Info */}
                      <div>
                        <p className={`font-bold ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>{room.roomName}</p>
                        <span className={`text-xs px-2 py-0.5 rounded font-semibold ${isVip ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                            {isVip ? t("roomModal.vipSurgery") : t("roomModal.standard")}
                        </span>
                      </div>
                    </div>

                    {/* Check icon */}
                    {isSelected && <span className="text-blue-600 font-bold text-xl">✓</span>}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50/80 border-t flex justify-between items-center backdrop-blur-sm">
  
  {/* Nút Reset - Thiết kế tinh tế, không quá gắt nhưng vẫn rõ ràng */}
  <div className="flex-1">
    {appointment?.room && (
      <button 
        onClick={handleReset}
        disabled={loading}
        className="group px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-lg text-[11px] font-bold flex items-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-50"
      >
        <span className="text-sm group-hover:rotate-[-45deg] transition-transform duration-300">↺</span> 
        <span className="uppercase tracking-widest">Reset</span>
      </button>
    )}
  </div>

  {/* Cụm nút Cancel/Confirm nằm bên phải */}
  <div className="flex gap-3">
    {/* Nút Cancel - Nhẹ nhàng, thanh lịch */}
    <button 
      onClick={onClose} 
      className="px-5 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95"
    >
      {t("roomModal.cancel")}
    </button>

    {/* Nút Confirm - Nổi bật, có độ bóng và hiệu ứng đổ bóng */}
    <button 
      onClick={handleSave}
      disabled={!selectedRoomId || loading}
      className={`
        px-7 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg shadow-blue-200
        transition-all duration-300 flex items-center gap-2
        ${!selectedRoomId || loading 
          ? 'bg-gray-300 shadow-none cursor-not-allowed' 
          : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 hover:shadow-blue-300 active:scale-95'
        }
      `}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {loading ? t("roomModal.saving") : t("roomModal.confirm")}
    </button>
  </div>
</div>
      </div>
    </div>
  );
}
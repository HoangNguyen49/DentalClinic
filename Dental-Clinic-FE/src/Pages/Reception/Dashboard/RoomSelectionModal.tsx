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

  const handleSave = async () => {
    if (!selectedRoomId || !appointment) return;
    
    setLoading(true);
    try {
      // Gọi API Lưu
      const res = await receptionApi.assignRoom(appointment.id, selectedRoomId);
      
      toast.success(t("roomModal.success")); // Dịch thành công
      
      const updatedData = (res as any).data || res;
      onSuccess(updatedData);
      
      onClose();
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || t("roomModal.errorSave"); 
      toast.error(msg);
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
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-sm ${isVip ? 'bg-purple-100' : 'bg-green-100'}`}>
                        {isVip ? '👑' : '🦷'}
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
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded font-medium">
            {t("roomModal.cancel")}
          </button>
          <button 
            onClick={handleSave}
            disabled={!selectedRoomId || loading}
            className={`px-5 py-2 rounded text-white font-bold shadow-sm transition-all ${
                !selectedRoomId || loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
            }`}
          >
            {loading ? t("roomModal.saving") : t("roomModal.confirm")}
          </button>
        </div>

      </div>
    </div>
  );
}
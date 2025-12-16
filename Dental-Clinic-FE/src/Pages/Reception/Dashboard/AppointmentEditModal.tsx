import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next'; // 1. Import i18n
import type { AppointmentDTO } from './ReceptionDashboard';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

interface Props {
  appointment: AppointmentDTO;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AppointmentEditModal({ appointment, onClose, onSuccess }: Props) {
  const { t } = useTranslation("reception"); // 2. Khởi tạo hook
  const [status, setStatus] = useState(appointment.status);
  const [note, setNote] = useState(appointment.note || '');
  const [loading, setLoading] = useState(false);

  // Hàm xử lý lưu
  const handleSave = async () => {
    setLoading(true);
    try {
        const token = localStorage.getItem("accessToken");
        
        // Gọi API cập nhật
        await axios.put(`${API_BASE_URL}/api/reception/appointments/${appointment.id}`, 
            { status, note }, 
            { headers: { Authorization: `Bearer ${token}` } }
        );

        toast.success(t("editModal.success")); // Dịch thông báo thành công
        onSuccess();
        onClose();
    } catch (error) {
        console.error(error);
        toast.error(t("editModal.error")); // Dịch thông báo lỗi
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn font-instrument">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="bg-gray-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
            <div>
                <h3 className="font-bold text-lg">{t("editModal.title")}</h3>
                <p className="text-gray-400 text-xs">#{appointment.id} • {appointment.clinic?.clinicName || "N/A"}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition text-2xl">&times;</button>
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto space-y-6">
            
            {/* Thông tin Bệnh nhân */}
            <div className="flex items-center gap-4 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                 <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold text-xl">
                     {appointment.patient.fullName.charAt(0)}
                 </div>
                 <div>
                     <h4 className="font-bold text-gray-900">{appointment.patient.fullName}</h4>
                     <div className="text-xs text-gray-500 font-mono">{appointment.patient.patientCode} • {appointment.patient.phone}</div>
                 </div>
            </div>

            {/* Thông tin Dịch vụ & Bác sĩ */}
            <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-500">{t("editModal.labelService")}</span>
                    <span className="font-medium text-gray-900 max-w-[200px] truncate text-right">{appointment.services[0]?.serviceName}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-500">{t("editModal.labelDoctor")}</span>
                    <span className="font-medium text-gray-900">{appointment.doctor?.fullName || t("list.unassignedDoc")}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-500">{t("editModal.labelTime")}</span>
                    <span className="font-medium text-gray-900">
                        {new Date(appointment.startDateTime).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})} - 
                        {new Date(appointment.endDateTime).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}
                    </span>
                </div>
            </div>

            {/* FORM CHỈNH SỬA */}
            <div className="space-y-4 pt-2">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">{t("editModal.labelStatus")}</label>
                    <select 
                        value={status} 
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        {/* Dùng key dịch từ file json */}
                        <option value="PENDING">{t("status.PENDING")}</option>
                        <option value="SCHEDULED">{t("status.SCHEDULED")}</option>
                        <option value="IN_PROGRESS">{t("status.IN_PROGRESS")}</option>
                        <option value="COMPLETED">{t("status.COMPLETED")}</option>
                        <option value="CANCELLED">{t("status.CANCELLED")}</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">{t("editModal.labelNote")}</label>
                    <textarea 
                        rows={3}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder={t("editModal.placeholderNote")}
                    />
                </div>
            </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 shrink-0">
            <button onClick={onClose} className="px-5 py-2 rounded-lg text-gray-600 hover:bg-gray-200 font-medium transition">
                {t("editModal.close")}
            </button>
            <button 
                onClick={handleSave} 
                disabled={loading}
                className="px-6 py-2 rounded-lg bg-[#3366FF] text-white font-bold hover:bg-blue-700 shadow-md transition flex items-center gap-2"
            >
                {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                {t("editModal.save")}
            </button>
        </div>

      </div>
    </div>
  );
}
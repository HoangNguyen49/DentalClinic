import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Calendar, FileText, User, Stethoscope } from "lucide-react";
import { useTranslation } from "react-i18next";
import { receptionApi, type PatientHistoryDTO } from "../receptionApi";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  patientId: number | null;
}

export default function PatientHistoryModal({ isOpen, onClose, patientId }: Props) {
  const { t } = useTranslation("reception");
  const [history, setHistory] = useState<PatientHistoryDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  useEffect(() => {
    if (isOpen && patientId) {
      const fetchHistory = async () => {
        setLoading(true);
        try {
          const res = await receptionApi.getPatientHistory(patientId);
          const data = (res as any).data ? (res as any).data : res;
          setHistory(Array.isArray(data) ? data : []);
        } catch (err) {
          console.error("Lỗi tải lịch sử:", err);
          setHistory([]);
        } finally {
          setLoading(false);
        }
      };
      fetchHistory();
    } else if (!isOpen) {
      // (optional) reset when closing
      setHistory([]);
      setLoading(false);
    }
  }, [isOpen, patientId]);

  // ✅ Lock body scroll khi modal mở
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // ✅ ESC để đóng
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalUI = (
    <div
      className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm animate-fadeIn
                 flex items-start justify-center overflow-y-auto
                 p-4 sm:p-6"
      onMouseDown={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-5xl
                   flex flex-col overflow-hidden
                   max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)]
                   my-auto"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b bg-gray-50 shrink-0">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="text-purple-600" size={24} />
            {t("patientHistory.title")}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content Table */}
        <div className="flex-1 min-h-0 overflow-auto p-0">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-600 uppercase bg-gray-100 sticky top-0 shadow-sm z-10">
              <tr>
                <th className="px-6 py-4 font-bold">{t("patientHistory.table.time")}</th>
                <th className="px-6 py-4 font-bold">{t("patientHistory.table.doctor")}</th>
                <th className="px-6 py-4 font-bold">{t("patientHistory.table.service")}</th>
                <th className="px-6 py-4 font-bold">{t("patientHistory.table.note")}</th>
                <th className="px-6 py-4 font-bold text-center">{t("patientHistory.table.status")}</th>
                <th className="px-6 py-4 font-bold text-right">{t("patientHistory.table.total")}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500">
                    <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p>{t("patientHistory.messages.loading")}</p>
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-400 italic bg-gray-50">
                    {t("patientHistory.messages.noData")}
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.appointmentId} className="hover:bg-blue-50/50 transition-colors">
                    {/* Ngày khám */}
                    <td className="px-6 py-4 font-medium">
                      <div className="flex items-center gap-2 text-gray-900">
                        <Calendar size={16} className="text-blue-500" />
                        {new Date(item.visitDate).toLocaleDateString("vi-VN")}
                      </div>
                      <div className="text-xs text-gray-500 pl-6">
                        {new Date(item.visitDate).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>

                    {/* Bác sĩ */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-400" />
                        <span className="font-medium">{item.doctorName}</span>
                      </div>
                    </td>

                    {/* Dịch vụ */}
                    <td className="px-6 py-4">
                      {item.serviceNames ? (
                        <div className="flex flex-wrap gap-1">
                          {item.serviceNames.split(",").map((s, idx) => (
                            <span
                              key={idx}
                              className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs border border-purple-100 font-medium"
                            >
                              {s.trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">{t("patientHistory.noService")}</span>
                      )}
                    </td>

                    {/* Ghi chú */}
                    <td className="px-6 py-4 max-w-xs">
                      <div className="flex items-start gap-2">
                        <Stethoscope size={16} className="text-gray-400 shrink-0 mt-0.5" />
                        <span className="text-gray-600 line-clamp-2" title={item.diagnosis}>
                          {item.diagnosis || t("patientHistory.noNote")}
                        </span>
                      </div>
                    </td>

                    {/* Trạng thái */}
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${
                          item.status === "COMPLETED"
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : item.status === "CANCELLED"
                            ? "bg-red-100 text-red-700 border border-red-200"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {t(`status.${item.status}`)}
                      </span>
                    </td>

                    {/* Tổng tiền */}
                    <td className="px-6 py-4 text-right font-bold text-gray-800">
                      {formatMoney(item.totalAmount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return createPortal(modalUI, document.body);
}

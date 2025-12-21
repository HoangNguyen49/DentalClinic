import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { Lock, X } from "lucide-react";
import type { AppointmentDTO } from "./ReceptionDashboard";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

interface Props {
  appointment: AppointmentDTO;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AppointmentEditModal({
  appointment,
  onClose,
  onSuccess,
}: Props) {
  const { t } = useTranslation("reception");
  const [note, setNote] = useState(appointment.note || "");
  const [loading, setLoading] = useState(false);

  // ✅ Lock body scroll when modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // ✅ ESC to close
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      await axios.put(
        `${API_BASE_URL}/api/reception/appointments/${appointment.id}`,
        {
          status: appointment.status,
          note: note,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(t("editModal.success"));
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(t("editModal.error"));
    } finally {
      setLoading(false);
    }
  };

  const renderStatusBadge = () => {
    const s = appointment.status?.toUpperCase();
    let config = { color: "bg-gray-100 text-gray-600 border-gray-200", label: s };

    if (s === "SCHEDULED" || s === "CONFIRMED")
      config = {
        color: "bg-blue-50 text-blue-700 border-blue-200",
        label: t("status.SCHEDULED"),
      };
    if (s === "IN_PROGRESS" || s === "PROCESSING")
      config = {
        color: "bg-orange-50 text-orange-700 border-orange-200 animate-pulse",
        label: t("status.IN_PROGRESS"),
      };
    if (s === "COMPLETED")
      config = {
        color: "bg-green-50 text-green-700 border-green-200",
        label: t("status.COMPLETED"),
      };
    if (s === "CANCELLED" || s === "CANCELED")
      config = {
        color: "bg-red-50 text-red-700 border-red-200",
        label: t("status.CANCELLED"),
      };
    if (s === "PENDING")
      config = {
        color: "bg-yellow-50 text-yellow-700 border-yellow-200",
        label: t("status.PENDING"),
      };

    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-bold text-xs shadow-sm ${config.color}`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            s === "IN_PROGRESS" || s === "PROCESSING"
              ? "bg-orange-500"
              : "bg-current"
          }`}
        />
        {config.label}
      </div>
    );
  };

  const modalUI = (
    // ✅ IMPORTANT FIX:
    // - items-start + padding
    // - overlay scrollable (overflow-y-auto)
    // - modal max height based on viewport minus padding
    <div
      className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm animate-fadeIn
                 flex items-start justify-center overflow-y-auto
                 p-4 sm:p-6"
      onMouseDown={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden
                   flex flex-col
                   max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)]
                   my-auto"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="bg-gray-900 text-white px-6 py-5 flex justify-between items-start shrink-0">
          <div>
            <h3 className="font-bold text-xl tracking-tight">
              {t("editModal.title")}
            </h3>
            <p className="text-gray-400 text-xs mt-1">
              #{appointment.id} • {appointment.clinic?.clinicName || "Sunshine Clinic"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition p-1"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto space-y-6 min-h-0">
          <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-inner">
              {appointment.patient.fullName?.charAt(0) || "?"}
            </div>
            <div>
              <h4 className="font-bold text-gray-900 leading-tight">
                {appointment.patient.fullName}
              </h4>
              <p className="text-xs text-blue-600 font-medium mt-1">
                {appointment.patient.patientCode} • {appointment.patient.phone}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500 font-medium">
                {t("editModal.labelService")}
              </span>
              <span className="font-bold text-gray-800 text-right">
                {appointment.services?.[0]?.serviceName || "-"}
              </span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500 font-medium">
                {t("editModal.labelDoctor")}
              </span>
              <span className="font-bold text-gray-800">
                {appointment.doctor?.fullName || t("list.unassignedDoc")}
              </span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500 font-medium">
                {t("editModal.labelTime")}
              </span>
              <span className="font-bold text-gray-800">
                {new Date(appointment.startDateTime).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                -{" "}
                {new Date(
                  appointment.endDateTime ?? appointment.startDateTime
                ).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                {t("editModal.labelStatus")}
              </label>
              <div className="flex items-center gap-3 flex-wrap">
                {renderStatusBadge()}
                <span className="flex items-center gap-1 text-[10px] text-orange-600 font-semibold bg-orange-50 px-2 py-1 rounded-md">
                  <Lock size={10} /> {t("editModal.statusLocked")}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                {t("editModal.labelNote")}
              </label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full border-2 border-gray-100 p-3 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 text-sm transition-all resize-none"
                placeholder={t("editModal.placeholderNote")}
              />
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-gray-50 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-gray-600 hover:bg-gray-200 font-bold text-sm transition"
          >
            {t("editModal.close")}
          </button>

          <button
            onClick={handleSave}
            disabled={loading}
            className="px-8 py-2.5 rounded-xl bg-blue-600 text-white font-extrabold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              t("editModal.save")
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalUI, document.body);
}

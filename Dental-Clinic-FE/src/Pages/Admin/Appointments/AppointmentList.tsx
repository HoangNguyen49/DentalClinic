import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import CreateAppointmentForm from "./CreateAppointmentForm";

type Appointment = {
  appointmentId: number;
  appointmentDateTime: string;
  status: string;
  note?: string;
  patient?: { fullName: string };
  doctor?: { fullName: string };
  service?: { serviceName: string };
  room?: { roomName: string };
  chair?: { chairNumber: string };
};

function AppointmentList() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const { t } = useTranslation("admin");
  const apiBase = useMemo(() => import.meta.env.VITE_API_URL, []);

  const fetchAppointments = async () => {
    try {
      const res = await axios.get<Appointment[]>(
        `${apiBase}/appointments?date=${new Date().toISOString()}`
      );
      setAppointments(res.data);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách lịch hẹn:", err);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-[#0D1B3E]">
          {t("pageTitles.appointmentList")}
        </h1>
        <button
          onClick={() => setShowCreate(true)}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          + Create
        </button>
      </div>

      {showCreate && (
        <CreateAppointmentForm
          onClose={() => setShowCreate(false)}
          onSubmitSuccess={fetchAppointments}
        />
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-3 border">{t("tableHeaders.appointmentDateTime")}</th>
              <th className="p-3 border">{t("tableHeaders.patient")}</th>
              <th className="p-3 border">{t("tableHeaders.doctor")}</th>
              <th className="p-3 border">{t("tableHeaders.service")}</th>
              <th className="p-3 border">{t("tableHeaders.room")}</th>
              <th className="p-3 border">{t("tableHeaders.chair")}</th>
              <th className="p-3 border">{t("tableHeaders.status")}</th>
              <th className="p-3 border">{t("tableHeaders.note")}</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.appointmentId} className="hover:bg-gray-50">
                <td className="p-3 border">{new Date(a.appointmentDateTime).toLocaleString("vi-VN")}</td>
                <td className="p-3 border">{a.patient?.fullName || "-"}</td>
                <td className="p-3 border">{a.doctor?.fullName || "-"}</td>
                <td className="p-3 border">{a.service?.serviceName || "-"}</td>
                <td className="p-3 border">{a.room?.roomName || "-"}</td>
                <td className="p-3 border">{a.chair?.chairNumber || "-"}</td>
                <td className="p-3 border">{a.status || "-"}</td>
                <td className="p-3 border">{a.note || "-"}</td>
              </tr>
            ))}
            {appointments.length === 0 && (
              <tr>
                <td colSpan={8} className="p-3 border text-center text-gray-500">
                  {t("empty.noData") || "No appointments for this date."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AppointmentList;

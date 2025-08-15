import { useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";

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
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { t } = useTranslation("admin");

  const fetchAppointments = async () => {
    try {
      const res = await axios.get<Appointment[]>(
        `${import.meta.env.VITE_API_URL}/appointments?date=${new Date().toISOString()}`
      );
      setAppointments(res.data);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách lịch hẹn:", err);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCreate = () => {
    setEditingAppointment(null);
    setShowForm(true);
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setShowForm(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-[#0D1B3E]">{t("pageTitles.appointmentList")}</h1>
        <button
          onClick={handleCreate}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          + Create
        </button>
      </div>

      {showForm && (
        <AppointmentForm
          initialData={editingAppointment}
          onClose={() => setShowForm(false)}
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
              <th className="p-3 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.appointmentId} className="hover:bg-gray-50">
                <td className="p-3 border">
                  {new Date(a.appointmentDateTime).toLocaleString("vi-VN")}
                </td>
                <td className="p-3 border">{a.patient?.fullName || "-"}</td>
                <td className="p-3 border">{a.doctor?.fullName || "-"}</td>
                <td className="p-3 border">{a.service?.serviceName || "-"}</td>
                <td className="p-3 border">{a.room?.roomName || "-"}</td>
                <td className="p-3 border">{a.chair?.chairNumber || "-"}</td>
                <td className="p-3 border">{a.status || "-"}</td>
                <td className="p-3 border">{a.note || "-"}</td>
                <td className="p-3 border">
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => handleEdit(a)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AppointmentForm({
  initialData,
  onClose,
  onSubmitSuccess,
}: {
  initialData?: Appointment | null;
  onClose: () => void;
  onSubmitSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    appointmentDateTime: initialData?.appointmentDateTime?.slice(0, 16) || "",
    status: initialData?.status || "pending",
    note: initialData?.note || "",
    patientId: 1,
    doctorId: 1,
    serviceId: 1,
    roomId: 1,
    chairId: 1,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      if (initialData) {
        // TODO: PUT request nếu có
        console.warn("PUT /appointments/:id chưa được triển khai.");
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/appointments`, {
          ...formData,
          appointmentDateTime: new Date(formData.appointmentDateTime).toISOString(),
        });
      }
      onSubmitSuccess();
      onClose();
    } catch (err) {
      console.error("Lỗi khi gửi dữ liệu:", err);
    }
  };

  return (
    <div className="bg-white border p-4 rounded shadow-md mb-6">
      <h2 className="text-lg font-bold mb-4">{initialData ? "Edit" : "Create"} Appointment</h2>
      <div className="grid grid-cols-2 gap-4">
        <input
          type="datetime-local"
          name="appointmentDateTime"
          value={formData.appointmentDateTime}
          onChange={handleChange}
          className="border p-2"
        />
        <input
          type="text"
          name="note"
          placeholder="Note"
          value={formData.note}
          onChange={handleChange}
          className="border p-2"
        />
        <input
          type="number"
          name="patientId"
          placeholder="Patient ID"
          value={formData.patientId}
          onChange={handleChange}
          className="border p-2"
        />
        <input
          type="number"
          name="doctorId"
          placeholder="Doctor ID"
          value={formData.doctorId}
          onChange={handleChange}
          className="border p-2"
        />
        <input
          type="number"
          name="serviceId"
          placeholder="Service ID"
          value={formData.serviceId}
          onChange={handleChange}
          className="border p-2"
        />
        <input
          type="number"
          name="roomId"
          placeholder="Room ID"
          value={formData.roomId}
          onChange={handleChange}
          className="border p-2"
        />
        <input
          type="number"
          name="chairId"
          placeholder="Chair ID"
          value={formData.chairId}
          onChange={handleChange}
          className="border p-2"
        />
        <input
          type="text"
          name="status"
          placeholder="Status"
          value={formData.status}
          onChange={handleChange}
          className="border p-2"
        />
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={handleSubmit} className="bg-blue-500 text-white px-4 py-2 rounded">
          {initialData ? "Update" : "Create"}
        </button>
        <button onClick={onClose} className="border px-4 py-2 rounded">
          Cancel
        </button>
      </div>
    </div>
  );
}

export default AppointmentList;

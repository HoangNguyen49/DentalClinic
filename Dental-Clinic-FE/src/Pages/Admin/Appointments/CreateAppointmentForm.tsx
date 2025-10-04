import { useMemo, useState } from "react";
import axios from "axios";
import { localDatetimeToISO, defaultLocalDatetimeValue } from "../../../utils/datetime";

type Props = {
  onClose: () => void;
  onSubmitSuccess: () => void;
};

type FormState = {
  appointmentDateTime: string;
  status: string;
  note: string;
  channel: string;
  patientId: number;
  doctorId: number;
  serviceId: number;
  roomId: number;
  chairId: number;
};

export default function CreateAppointmentForm({ onClose, onSubmitSuccess }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const apiBase = useMemo(() => import.meta.env.VITE_API_URL, []);

  const [formData, setFormData] = useState<FormState>({
    appointmentDateTime: defaultLocalDatetimeValue(30),
    status: "pending",
    note: "",
    channel: "in-clinic",
    patientId: 1,
    doctorId: 1,
    serviceId: 1,
    roomId: 1,
    chairId: 1,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (["patientId", "doctorId", "serviceId", "roomId", "chairId"].includes(name)) {
      setFormData((prev) => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.appointmentDateTime) {
      setErrorMsg("Vui lòng chọn ngày giờ.");
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);

    try {
      await axios.post(`${apiBase}/appointments`, {
        appointmentDateTime: localDatetimeToISO(formData.appointmentDateTime),
        note: formData.note || undefined,
        channel: formData.channel || undefined,
        patientId: formData.patientId,
        doctorId: formData.doctorId,
        serviceId: formData.serviceId,
        roomId: formData.roomId,
        chairId: formData.chairId,
        status: formData.status,
      });
      onSubmitSuccess();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể tạo lịch hẹn. Vui lòng thử lại.";
      setErrorMsg(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border p-4 rounded shadow-md mb-6">
      <h2 className="text-lg font-bold mb-4">Create Appointment</h2>
      {errorMsg && (
        <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input label="Date & Time" type="datetime-local" name="appointmentDateTime"
          value={formData.appointmentDateTime} onChange={handleChange} />

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Status</span>
          <select name="status" value={formData.status} onChange={handleChange} className="border p-2 rounded">
            <option value="pending">pending</option>
            <option value="scheduled">scheduled</option>
            <option value="completed">completed</option>
            <option value="cancelled">cancelled</option>
            <option value="no-show">no-show</option>
          </select>
        </label>

        <NumberInput label="Patient ID" name="patientId" value={formData.patientId} onChange={handleChange} />
        <NumberInput label="Doctor ID" name="doctorId" value={formData.doctorId} onChange={handleChange} />
        <NumberInput label="Service ID" name="serviceId" value={formData.serviceId} onChange={handleChange} />
        <NumberInput label="Room ID" name="roomId" value={formData.roomId} onChange={handleChange} />
        <NumberInput label="Chair ID" name="chairId" value={formData.chairId} onChange={handleChange} />

        <Input label="Channel" type="text" name="channel" value={formData.channel} onChange={handleChange} />
        <Input label="Note" type="text" name="note" value={formData.note} onChange={handleChange} />
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white px-4 py-2 rounded"
        >
          {submitting ? "Saving..." : "Create"}
        </button>
        <button onClick={onClose} className="border px-4 py-2 rounded">
          Cancel
        </button>
      </div>
    </div>
  );
}

function Input({ label, ...rest }: any) {
  return (
    <label className="flex flex-col gap-1 col-span-2 sm:col-span-1">
      <span className="text-sm font-medium">{label}</span>
      <input className="border p-2 rounded" {...rest} />
    </label>
  );
}

function NumberInput({ label, ...rest }: any) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium">{label}</span>
      <input type="number" className="border p-2 rounded" min={1} required {...rest} />
    </label>
  );
}

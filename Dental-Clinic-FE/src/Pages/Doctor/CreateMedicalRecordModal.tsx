import { useEffect, useState } from "react";
import axios from "axios";
import { X, Save, Trash2, Plus } from "lucide-react";
import { toast } from "react-toastify";
import { format } from "date-fns";
import medications from "../../data/dental-medications.json";

type MedicationOption = { id: string; name: string; defaultDosage?: string; description?: string };
type SelectedMedication = { id: string; name: string; quantity: string; instructions: string };

type DoctorAppointment = {
  appointmentId: number;
  startDateTime: string;
  endDateTime: string;
  clinic?: { id: number; clinicName: string };
  patient?: { id: number; patientCode: string; fullName: string; phone?: string; email?: string };
  service?: { id: number; serviceName: string };
};

type MedicalRecordDTO = {
  recordId: number;
  clinic?: { id: number; clinicName: string };
  patient?: { id: number; patientCode: string; fullName: string };
  appointmentId?: number;
  serviceId?: number;
  serviceName?: string;
  diagnosis: string;
  treatmentPlan?: string;
  prescriptionNote?: string;
  note?: string;
  recordDate: string;
};

type Props = {
  isOpen: boolean;
  mode: "create" | "edit";
  patientId?: number;
  doctorId?: number;
  appointment?: DoctorAppointment | null;
  record?: MedicalRecordDTO | null;
  onClose: () => void;
  onSuccess?: () => void;
};

const medicationOptions = medications as MedicationOption[];

const buildPrescriptionText = (meds: SelectedMedication[], manualNote: string) => {
  const auto = meds
    .map((med, idx) => `${idx + 1}. ${med.name} • SL: ${med.quantity} • HDSD: ${med.instructions}`)
    .join("\n");
  if (auto && manualNote.trim()) return `${auto}\n\n${manualNote.trim()}`;
  return auto || manualNote.trim();
};

export default function CreateMedicalRecordModal({
  isOpen,
  mode,
  patientId,
  doctorId,
  appointment,
  record,
  onClose,
  onSuccess,
}: Props) {
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const accessToken = localStorage.getItem("accessToken");

  const clinicInfo = appointment?.clinic || record?.clinic;
  const patientInfo = appointment?.patient || record?.patient;
  const serviceInfo = appointment?.service?.serviceName || record?.serviceName;
  const appointmentId = appointment?.appointmentId ?? record?.appointmentId;

  const [diagnosis, setDiagnosis] = useState(record?.diagnosis || "");
  const [treatmentPlan, setTreatmentPlan] = useState(record?.treatmentPlan || "");
  const [manualPrescriptionNote, setManualPrescriptionNote] = useState(record?.prescriptionNote || "");
  const [generalNote, setGeneralNote] = useState(record?.note || "");
  const [recordDate, setRecordDate] = useState(
    record?.recordDate
      ? format(new Date(record.recordDate), "yyyy-MM-dd")
      : appointment?.startDateTime
      ? format(new Date(appointment.startDateTime), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd")
  );
  const [selectedMedications, setSelectedMedications] = useState<SelectedMedication[]>([]);
  const [medicationInput, setMedicationInput] = useState({ medId: "", quantity: "", instructions: "" });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const resetState = () => {
    setDiagnosis(record?.diagnosis || "");
    setTreatmentPlan(record?.treatmentPlan || "");
    setManualPrescriptionNote(record?.prescriptionNote || "");
    setGeneralNote(record?.note || "");
    setRecordDate(
      record?.recordDate
        ? format(new Date(record.recordDate), "yyyy-MM-dd")
        : appointment?.startDateTime
        ? format(new Date(appointment.startDateTime), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd")
    );
    setSelectedMedications([]);
    setMedicationInput({ medId: "", quantity: "", instructions: "" });
    setAttachments([]);
  };

  useEffect(() => {
    if (isOpen) {
      resetState();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, record, appointment]);

  const serviceReadOnly = serviceInfo || "N/A";
  const clinicReadOnly = clinicInfo?.clinicName || "N/A";
  const doctorReadOnly = doctorId ? `Doctor #${doctorId}` : "N/A";
  const appointmentTime = appointment
    ? `${format(new Date(appointment.startDateTime), "MMM dd, yyyy HH:mm")} - ${format(
        new Date(appointment.endDateTime),
        "HH:mm"
      )}`
    : "N/A";

  const handleAddMedication = () => {
    if (!medicationInput.medId || !medicationInput.quantity.trim()) {
      toast.error("Select a medication and enter quantity.");
      return;
    }
    const med = medicationOptions.find((m) => m.id === medicationInput.medId);
    if (!med) return;
    setSelectedMedications((prev) => [
      ...prev,
      {
        id: med.id,
        name: med.name,
        quantity: medicationInput.quantity.trim(),
        instructions: medicationInput.instructions.trim() || med.defaultDosage || "Theo chỉ định của bác sĩ",
      },
    ]);
    setMedicationInput({ medId: "", quantity: "", instructions: "" });
  };

  const handleRemoveMedication = (id: string) => {
    setSelectedMedications((prev) => prev.filter((med) => med.id !== id));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setAttachments(Array.from(e.target.files));
    }
  };

  const buildPayload = () => ({
    clinicId: clinicInfo?.id,
    doctorId,
    appointmentId,
    serviceId: appointment?.service?.id ?? record?.serviceId,
    diagnosis: diagnosis.trim(),
    treatmentPlan: treatmentPlan.trim() || undefined,
    prescriptionNote: buildPrescriptionText(selectedMedications, manualPrescriptionNote),
    note: generalNote.trim() || undefined,
    recordDate,
  });

  const validate = () => {
    if (!patientId) {
      toast.error("Patient info is missing.");
      return false;
    }
    if (!doctorId) {
      toast.error("Doctor info is missing.");
      return false;
    }
    if (!clinicInfo?.id) {
      toast.error("Clinic information is missing.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = buildPayload();

    setLoading(true);
    try {
      let currentRecordId = record?.recordId;
      if (mode === "create") {
        const response = await axios.post<{ recordId?: number; id?: number }>(
          `${apiBase}/api/patients/${patientId}/records`,
          payload,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            withCredentials: true,
          }
        );
        currentRecordId = response.data.recordId || response.data.id;
      } else if (mode === "edit" && record?.recordId) {
        await axios.put(
          `${apiBase}/api/patients/${patientId}/records/${record.recordId}`,
          payload,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            withCredentials: true,
          }
        );
        currentRecordId = record.recordId;
      }

      if (currentRecordId && attachments.length) {
        for (const file of attachments) {
          const formData = new FormData();
          formData.append("file", file);
          await axios.post(
            `${apiBase}/api/patients/${patientId}/records/${currentRecordId}/images`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "multipart/form-data",
              },
              withCredentials: true,
            }
          );
        }
      }

      toast.success(mode === "create" ? "Medical record created" : "Medical record updated");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save medical record");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-400">Medical Record</p>
            <h2 className="text-2xl font-bold text-[#0D1B3E]">
              {mode === "create" ? "Create Medical Record" : "Update Medical Record"}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-500 hover:text-gray-800 transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
          <section className="grid grid-cols-1 gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900 md:grid-cols-2">
            <p>
              <span className="font-semibold text-blue-700">Patient:</span> {patientInfo?.fullName || "N/A"}
            </p>
            <p>
              <span className="font-semibold text-blue-700">Clinic:</span> {clinicReadOnly}
            </p>
            <p>
              <span className="font-semibold text-blue-700">Doctor:</span> {doctorReadOnly}
            </p>
            <p>
              <span className="font-semibold text-blue-700">Service:</span> {serviceReadOnly}
            </p>
            <p>
              <span className="font-semibold text-blue-700">Appointment Ref:</span>{" "}
              {appointmentId ?? "N/A"}
            </p>
            <p className="md:col-span-2">
              <span className="font-semibold text-blue-700">Appointment Time:</span> {appointmentTime}
            </p>
          </section>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-600">Clinic</label>
              <input
                readOnly
                value={clinicReadOnly}
                className="mt-1 w-full rounded border bg-gray-100 px-3 py-2 text-gray-700"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Service</label>
              <input
                readOnly
                value={serviceReadOnly}
                className="mt-1 w-full rounded border bg-gray-100 px-3 py-2 text-gray-700"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Record Date</label>
              <input
                type="date"
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Appointment ID</label>
              <input
                readOnly
                value={appointmentId ?? "N/A"}
                className="mt-1 w-full rounded border bg-gray-100 px-3 py-2 text-gray-700"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Diagnosis</label>
            <textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter diagnosis..."
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Treatment Plan</label>
            <textarea
              value={treatmentPlan}
              onChange={(e) => setTreatmentPlan(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter treatment plan..."
            />
          </div>

          <section className="rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-800">Prescription Builder</h3>
                <p className="text-xs text-gray-500">Select medication, enter quantity & instructions.</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              <select
                value={medicationInput.medId}
                onChange={(e) => setMedicationInput((prev) => ({ ...prev, medId: e.target.value }))}
                className="rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select medication</option>
                {medicationOptions.map((med) => (
                  <option key={med.id} value={med.id}>
                    {med.name}
                  </option>
                ))}
              </select>
              <input
                value={medicationInput.quantity}
                onChange={(e) => setMedicationInput((prev) => ({ ...prev, quantity: e.target.value }))}
                placeholder="Quantity"
                className="rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <input
                  value={medicationInput.instructions}
                  onChange={(e) => setMedicationInput((prev) => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Instructions"
                  className="flex-1 rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddMedication}
                  className="rounded bg-green-600 px-3 py-2 text-white hover:bg-green-700"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            {medicationInput.medId && (
              <p className="mt-1 text-xs text-gray-500">
                {medicationOptions.find((m) => m.id === medicationInput.medId)?.description}
              </p>
            )}
            {selectedMedications.length > 0 && (
              <div className="mt-3 space-y-2">
                {selectedMedications.map((med) => (
                  <div key={med.id} className="flex items-center justify-between rounded border px-3 py-2">
                    <div>
                      <p className="font-medium text-gray-800">{med.name}</p>
                      <p className="text-sm text-gray-600">
                        Qty: {med.quantity} • {med.instructions}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveMedication(med.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3">
              <label className="text-sm font-medium text-gray-600">Additional Prescription Note</label>
              <textarea
                value={manualPrescriptionNote}
                onChange={(e) => setManualPrescriptionNote(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add extra instructions..."
              />
            </div>
          </section>

          <div>
            <label className="text-sm font-medium text-gray-600">General Note</label>
            <textarea
              value={generalNote}
              onChange={(e) => setGeneralNote(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter additional notes..."
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-600">Upload Images / X-rays</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="mt-1 w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {attachments.length > 0 && (
              <div className="mt-2 space-y-2 text-sm text-gray-600">
                {attachments.map((file, idx) => (
                  <div key={`${file.name}-${idx}`} className="flex items-center justify-between rounded border px-3 py-2">
                    <span className="truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => setAttachments((prev) => prev.filter((_, index) => index !== idx))}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded border px-4 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {loading ? "Saving..." : mode === "create" ? "Create Record" : "Update Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


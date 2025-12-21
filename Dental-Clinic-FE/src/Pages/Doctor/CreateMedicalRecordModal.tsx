import { useEffect, useState } from "react";
import axios from "axios";
import { X, Save, Trash2, Plus, Sparkles } from "lucide-react";
import { toast } from "react-toastify";
import { format } from "date-fns";
import medications from "../../data/dental-medications.json";
import ServiceVariantsModal from "./ServiceVariantsModal";
import type {
  DoctorAppointmentDTO,
  MedicalRecordDTO,
  MedicalRecordRequest,
  ServiceDTO,
} from "../types/doctor";

// Interface for AI-generated medical record response
interface AiGeneratedMedicalRecordDto {
  treatmentPlan: string;
  prescriptionNote: Array<{
    drugName: string;
    dosage: string;
    quantity: number;
    usageInstruction: string;
  }>;
  prescriptionNoteFormatted: string;
  note: string;
}

type MedicationOption = { id: string; name: string; defaultDosage?: string; description?: string };
type SelectedMedication = { id: string; name: string; quantity: string; instructions: string };

type Props = {
  isOpen: boolean;
  mode: "create" | "edit";
  patientId?: number;
  doctorId?: number;
  appointment?: DoctorAppointmentDTO | null;
  record?: MedicalRecordDTO | null;
  onClose: () => void;
  onSuccess?: () => void;
};

const medicationOptions = (medications as { category: string; items: MedicationOption[] }[]).flatMap((g) => g.items);

const buildPrescriptionText = (meds: SelectedMedication[], manualNote: string) => {
  const auto = meds
    .map((med, idx) => `${idx + 1}. ${med.name} • Qty: ${med.quantity} • Instructions: ${med.instructions}`)
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
  const serviceInfo = appointment?.service || record?.service;
  const appointmentId = appointment?.appointmentId ?? record?.appointmentId;
  
  // State for AI Assistant
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AiGeneratedMedicalRecordDto | null>(null);
  const [showAiPreview, setShowAiPreview] = useState(false);

  // Debug: Log appointment data to see what we're receiving
  useEffect(() => {
    if (appointment && isOpen) {
      console.log("Appointment data:", appointment);
      console.log("Appointment service:", appointment.service);
      console.log("Appointment appointmentServiceId:", appointment.appointmentServiceId);
    }
  }, [appointment, isOpen]);

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
  const [selectedService, setSelectedService] = useState<ServiceDTO | null>(null);
  const [showVariantsModal, setShowVariantsModal] = useState(false);
  const [activeVariantId, setActiveVariantId] = useState<number | undefined>(undefined);
  const [activeVariantName, setActiveVariantName] = useState<string | undefined>(undefined);
  const showOnlyActiveVariantForModal = Boolean(
    appointment?.serviceVariant || appointment?.appointmentServiceId || (appointment?.serviceDetails && appointment.serviceDetails.length === 1)
  );

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
    setActiveVariantId(undefined);
    setActiveVariantName(undefined);
    // Reset AI states
    setAiSuggestions(null);
    setAiError(null);
    setShowAiPreview(false);
  };

  // Function to call AI backend for suggestions
  const callAiForSuggestions = async () => {
    if (!diagnosis.trim()) {
      toast.error("Please enter a diagnosis first");
      return;
    }

    if (!appointmentId) {
      toast.error("Appointment ID is required for AI suggestions");
      return;
    }

    setAiLoading(true);
    setAiError(null);
    setAiSuggestions(null);

    try {
      const response = await axios.post<AiGeneratedMedicalRecordDto>(
        `${apiBase}/api/medical-records/${appointmentId}/ai/generate`,
        {
          appointmentId,
          diagnosis: diagnosis.trim()
        },
        {
          headers: { 
            'Content-Type': 'application/json',
            ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
          },
          withCredentials: true,
        }
      );

      setAiSuggestions(response.data);
      setShowAiPreview(true);
      toast.success("AI suggestions generated successfully");
    } catch (err: any) {
      console.error("AI generation error:", err);
      
      if (err.response?.status === 401) {
        setAiError("Session expired. Please login again.");
      } else if (err.response?.status === 403) {
        setAiError("You don't have permission to use AI features");
      } else if (err.response?.status === 429) {
        setAiError("Too many requests. Please try again later.");
      } else if (err.response?.data?.message) {
        setAiError(`AI Error: ${err.response.data.message}`);
      } else {
        setAiError("Failed to generate AI suggestions. Please try again.");
      }
    } finally {
      setAiLoading(false);
    }
  };

  // Function to apply AI suggestions to the form
  const applyAiSuggestions = () => {
    if (!aiSuggestions) return;

    // Apply treatment plan
    if (aiSuggestions.treatmentPlan) {
      setTreatmentPlan(aiSuggestions.treatmentPlan);
    }

    // Apply prescription note (use formatted version)
    if (aiSuggestions.prescriptionNoteFormatted) {
      setManualPrescriptionNote(aiSuggestions.prescriptionNoteFormatted);
      
      // Also try to parse and add to selected medications if needed
      const parsedMeds = tryParsePrescriptionNote(aiSuggestions.prescriptionNoteFormatted);
      if (parsedMeds && parsedMeds.length > 0) {
        setSelectedMedications(parsedMeds);
      }
    }

    // Apply general note
    if (aiSuggestions.note) {
      setGeneralNote(aiSuggestions.note);
    }

    toast.success("AI suggestions applied to form");
    setShowAiPreview(false);
  };

  const tryParsePrescriptionNote = (note?: string) => {
    if (!note) return undefined;
    // Try JSON first
    try {
      const maybeJson = JSON.parse(note);
      const maybeParsed = maybeJson as { meds?: unknown[] };
      if (maybeParsed && Array.isArray(maybeParsed.meds) && maybeParsed.meds.length > 0) {
        const medsArray = maybeParsed.meds as unknown[];
        const meds = medsArray.map((m) => {
          const obj = m as Record<string, unknown>;
          return {
            id: String(obj.id ?? obj.medId ?? obj.name ?? ""),
            name: String(obj.name ?? obj.medName ?? ""),
            quantity: String(obj.quantity ?? obj.qty ?? ""),
            instructions: String(obj.instructions ?? obj.instruction ?? ""),
          } as SelectedMedication;
        });
        return meds;
      }
    } catch {
      // not JSON, continue
    }

    // Try parse numbered lines of our format: "1. Name • Qty: qty • Instructions: instr"
    const lines = note.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const parsed: SelectedMedication[] = [];
    for (const line of lines) {
      // Remove leading numbering
      const m = line.match(/^\s*\d+\.\s*(.*)$/);
      const content = m ? m[1] : line;
      // Split by bullet separators '•' or similar
      const parts = content.split(/\s*[•··]\s*/).map((p) => p.trim());
      const name = parts[0] || "";
      let quantity = "";
      let instructions = "";
      for (let i = 1; i < parts.length; i++) {
        const part = parts[i];
        const qtyMatch = part.match(/Qty\s*:\s*(.*)/i);
        const instrMatch = part.match(/Instructions?\s*:\s*(.*)/i);
        if (qtyMatch) quantity = qtyMatch[1].trim();
        else if (instrMatch) instructions = instrMatch[1].trim();
      }
      // Fallback: if parts length === 2 and second part doesn't contain labels, assume it is quantity
      if (!quantity && parts.length === 2) {
        quantity = parts[1];
      }
      parsed.push({ id: name, name, quantity, instructions });
    }
    return parsed.length > 0 ? parsed : undefined;
  };

  const noteHasMeds = (note?: string) => {
    if (!note) return false;
    // JSON with meds
    try {
      const maybe = JSON.parse(note) as { meds?: unknown[] };
      if (maybe && Array.isArray(maybe.meds) && maybe.meds.length > 0) return true;
    } catch {
      // not JSON
    }
    // Numbered lines like '1. Name • Qty: ...'
    const lines = note.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return false;
    let countNumbered = 0;
    for (const line of lines) {
      if (/^\s*\d+\./.test(line)) countNumbered++;
      else if (/Qty\s*:/i.test(line) && /Instructions?\s*:/i.test(line)) countNumbered++;
    }
    return countNumbered > 0;
  };

  useEffect(() => {
    if (isOpen) {
      resetState();
      // Pre-fill active variant using appointment or record if available
      const svcVariantId = appointment?.serviceVariant?.variantId ?? appointment?.serviceVariant?.id ?? record?.serviceVariant?.variantId ?? record?.serviceVariant?.id;
      const svcVariantName = appointment?.serviceVariant?.variantName ?? appointment?.serviceDetails?.[0] ?? record?.serviceVariant?.variantName ?? record?.serviceName;
      if (svcVariantId) setActiveVariantId(svcVariantId);
      if (!svcVariantId && svcVariantName) setActiveVariantName(svcVariantName);
      // Parse prescription note into selected medications preserving order when editing
      if (mode === "edit" && record?.prescriptionNote) {
        const parsed = tryParsePrescriptionNote(record.prescriptionNote);
        if (parsed && parsed.length > 0) {
          setSelectedMedications(parsed);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, record, appointment]);

  const appointmentVariantName = appointment?.serviceVariant?.variantName || appointment?.serviceDetails?.[0] || record?.serviceVariant?.variantName || undefined;
  const serviceReadOnly = serviceInfo?.serviceName ? (appointmentVariantName ? `${serviceInfo.serviceName} - ${appointmentVariantName}` : serviceInfo.serviceName) : "N/A";
  const clinicReadOnly = clinicInfo?.clinicName || "N/A";
  const doctorReadOnly = doctorId ? `Doctor #${doctorId}` : "N/A";
  const appointmentTime = appointment
    ? `${format(new Date(appointment.startDateTime), "MMM dd, yyyy HH:mm")} - ${format(
        new Date(appointment.endDateTime ?? appointment.startDateTime),
        "HH:mm"
      )}`
    : "N/A";

  const handleServiceClick = async () => {
    if (!serviceInfo) return;

    // Determine active variant id or name from appointment/record
    const svcVariantId = appointment?.serviceVariant?.variantId ?? appointment?.serviceVariant?.id ?? record?.serviceVariant?.variantId ?? record?.serviceVariant?.id;
    const svcVariantName = appointment?.serviceVariant?.variantName ?? appointment?.serviceDetails?.[0] ?? record?.serviceVariant?.variantName;
    if (svcVariantId) setActiveVariantId(svcVariantId);
    if (!svcVariantId && svcVariantName) setActiveVariantName(svcVariantName);

    // If service already has variants, use it directly
    if (serviceInfo.variants !== undefined) {
      setSelectedService(serviceInfo);
      setShowVariantsModal(true);
      return;
    }

    // Otherwise, fetch full service data
    try {
      const response = await axios.get<ServiceDTO>(
        `${apiBase}/api/services/${serviceInfo.id}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        }
      );
      setSelectedService(response.data);
      setShowVariantsModal(true);
    } catch (err) {
      console.error("Failed to fetch service details:", err);
      toast.error("Failed to load service details");
    }
  };

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
        instructions: medicationInput.instructions.trim() || med.defaultDosage || "As directed by doctor",
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

  const buildPayload = (): MedicalRecordRequest => {
    // Priority: use appointmentServiceId if available from appointment
    // If the manual prescription note contains a JSON object like {meds: [...], manual: "..."}, parse it
    let parsedMedText = manualPrescriptionNote || "";
    try {
      const maybeJson = JSON.parse(manualPrescriptionNote || "{}");
      const maybeParsedJson = maybeJson as { meds?: unknown[]; manual?: string };
      if (maybeJson && Array.isArray(maybeParsedJson.meds)) {
        const medsArray = maybeParsedJson.meds || [];
        const medsFromJson: SelectedMedication[] = medsArray.map((m) => {
          const obj = m as Record<string, unknown>;
          return {
            id: String(obj.id ?? obj.medId ?? obj.name ?? ""),
            name: String(obj.name ?? obj.medName ?? ""),
            quantity: String(obj.quantity ?? obj.qty ?? ""),
            instructions: String(obj.instructions ?? obj.instruction ?? ""),
          };
        });
        parsedMedText = buildPrescriptionText(medsFromJson, maybeParsedJson.manual || "");
      }
    } catch {
      // not JSON, ignore
    }

    const payload: MedicalRecordRequest = {
      clinicId: clinicInfo?.id || 0,
      doctorId: doctorId || 0,
      appointmentId: appointmentId || null,
      diagnosis: diagnosis.trim(),
      treatmentPlan: treatmentPlan.trim() || null,
      // Use meds selected in UI if present; avoid appending manual note if it already contains the med list (prevents duplication)
      prescriptionNote: (selectedMedications.length > 0
        ? buildPrescriptionText(selectedMedications, noteHasMeds(manualPrescriptionNote) ? "" : manualPrescriptionNote)
        : (parsedMedText.trim() || null)) || null,
      note: generalNote.trim() || null,
      recordDate: recordDate || null,
    };

    // Priority 1: If appointmentServiceId is directly available from appointment
    if (appointment?.appointmentServiceId) {
      payload.appointmentServiceId = appointment.appointmentServiceId;
      console.log("Using appointmentServiceId:", appointment.appointmentServiceId);
    } 
    // Priority 2: If appointmentServices array exists, get id of first service
    else if (appointment?.appointmentServices && appointment.appointmentServices.length > 0) {
      const firstAppointmentService = appointment.appointmentServices[0];
      const serviceId = firstAppointmentService.id || firstAppointmentService.appointmentServiceId;
      if (serviceId) {
        payload.appointmentServiceId = serviceId;
        console.log("Using appointmentServiceId from array:", serviceId);
      }
    }
    // Priority 3: If only appointmentId exists, backend will automatically get first AppointmentService
    // Nothing additional needed, just appointmentId
    // Priority 4: Fallback - use serviceId and variantId if no appointmentServiceId
    else if (serviceInfo?.id) {
      payload.serviceId = serviceInfo.id;
      // If variant exists from appointment or record
      const variantId = appointment?.serviceVariant?.variantId || 
                       appointment?.serviceVariant?.id ||
                       record?.serviceVariant?.variantId ||
                       record?.serviceVariant?.id;
      if (variantId) {
        payload.variantId = variantId;
      }
      console.log("Using serviceId and variantId:", payload.serviceId, payload.variantId);
    } 
    // Priority 5: Use serviceId from record when editing
    else if (record?.serviceId) {
      payload.serviceId = record.serviceId;
      const variantId = record?.serviceVariant?.variantId || record?.serviceVariant?.id;
      if (variantId) {
        payload.variantId = variantId;
      }
      console.log("Using record serviceId and variantId:", payload.serviceId, payload.variantId);
    }

    console.log("Medical record payload:", payload);
    return payload;
  };

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
            disabled={loading || aiLoading}
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
              <span className="font-semibold text-blue-700">Service:</span>{" "}
              <span
                className={serviceInfo ? "text-blue-600 cursor-pointer hover:text-blue-800 hover:underline transition" : ""}
                onClick={handleServiceClick}
              >
                {serviceReadOnly}
              </span>
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
              <div
                className={`mt-1 w-full rounded border bg-gray-100 px-3 py-2 ${serviceInfo ? 'text-blue-600 cursor-pointer hover:text-blue-800 hover:underline transition' : 'text-gray-700'}`}
                onClick={handleServiceClick}
              >
                {serviceReadOnly}
              </div>
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

          {/* Diagnosis section with AI Assistant button */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-600">Diagnosis</label>
              <button
                type="button"
                onClick={callAiForSuggestions}
                disabled={aiLoading || !diagnosis.trim() || !appointmentId}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {aiLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    AI Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    AI Assistant
                  </>
                )}
              </button>
            </div>
            <textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              rows={3}
              className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter diagnosis... (AI will detect language and provide suggestions in same language)"
            />
            {aiError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm text-red-700">{aiError}</p>
              </div>
            )}
          </div>

          {/* AI Suggestions Preview */}
          {showAiPreview && aiSuggestions && (
            <div className="rounded-xl border border-yellow-300 bg-gradient-to-b from-yellow-50 to-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-yellow-100 p-2">
                    <Sparkles className="h-5 w-5 text-yellow-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-yellow-800">🧠 AI Suggestions</h3>
                    <p className="text-sm text-yellow-700">
                      Review and edit before applying. Language: {diagnosis.match(/[^\x00-\x7F]+/) ? 'Auto-detected' : 'English'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAiPreview(false)}
                    className="rounded-lg border border-yellow-400 bg-white px-4 py-2 text-sm font-medium text-yellow-700 hover:bg-yellow-50"
                  >
                    Hide
                  </button>
                  <button
                    type="button"
                    onClick={applyAiSuggestions}
                    className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2 font-medium text-white hover:from-green-700 hover:to-emerald-700"
                  >
                    Apply Suggestions
                  </button>
                </div>
              </div>

              {/* Treatment Plan Suggestion */}
              <div className="mb-4">
                <label className="mb-2 block font-medium text-gray-800">
                  Treatment Plan Suggestion:
                </label>
                <div className="whitespace-pre-wrap rounded border border-gray-200 bg-white p-3 text-gray-800">
                  {aiSuggestions.treatmentPlan}
                </div>
              </div>

              {/* Prescription Suggestion */}
              <div className="mb-4">
                <label className="mb-2 block font-medium text-gray-800">
                  Prescription Suggestion:
                </label>
                <div className="whitespace-pre-wrap rounded border border-gray-200 bg-white p-3 font-mono text-sm text-gray-800">
                  {aiSuggestions.prescriptionNoteFormatted}
                </div>
              </div>

              {/* Medication Details Suggestion */}
              {aiSuggestions.prescriptionNote.length > 0 && (
                <div className="mb-4">
                  <label className="mb-2 block font-medium text-gray-800">
                    Medication Details ({aiSuggestions.prescriptionNote.length} items):
                  </label>
                  <div className="overflow-x-auto rounded border border-gray-200">
                    <table className="w-full min-w-full border-collapse">
                      <thead>
                        <tr className="border-b bg-gray-100 text-left text-sm text-gray-600">
                          <th className="px-4 py-2">#</th>
                          <th className="px-4 py-2">Drug Name</th>
                          <th className="px-4 py-2">Dosage</th>
                          <th className="px-4 py-2">Quantity</th>
                          <th className="px-4 py-2">Instructions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aiSuggestions.prescriptionNote.map((item, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-700">{index + 1}</td>
                            <td className="px-4 py-3 font-medium">{item.drugName}</td>
                            <td className="px-4 py-3">{item.dosage}</td>
                            <td className="px-4 py-3">{item.quantity}</td>
                            <td className="px-4 py-3">{item.usageInstruction}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Note Suggestion */}
              <div className="mb-4">
                <label className="mb-2 block font-medium text-gray-800">
                  Additional Notes Suggestion:
                </label>
                <div className="whitespace-pre-wrap rounded border border-gray-200 bg-white p-3 text-gray-800">
                  {aiSuggestions.note}
                </div>
              </div>

              {/* Important Disclaimer */}
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-xl">⚠️</div>
                  <div>
                    <h4 className="font-semibold text-red-800">Important Disclaimer:</h4>
                    <ul className="mt-2 space-y-1 text-sm text-red-700">
                      <li>• AI provides suggestions based on input diagnosis only</li>
                      <li>• Review all information carefully before applying</li>
                      <li>• Ensure prescriptions are appropriate for patient's actual condition</li>
                      <li>• Doctor is fully responsible for final clinical decisions</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

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
              disabled={loading || aiLoading}
              className="rounded border px-4 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || aiLoading}
              className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {loading ? "Saving..." : mode === "create" ? "Create Record" : "Update Record"}
            </button>
          </div>
        </form>
      </div>

      <ServiceVariantsModal
        isOpen={showVariantsModal}
        service={selectedService}
        activeVariantId={activeVariantId}
        activeVariantName={activeVariantName}
        onlyShowActiveVariant={showOnlyActiveVariantForModal}
        onClose={() => {
          setShowVariantsModal(false);
          setSelectedService(null);
          setActiveVariantId(undefined);
          setActiveVariantName(undefined);
        }}
      />
    </div>
  );
}
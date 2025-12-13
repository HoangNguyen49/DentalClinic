import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, MapPin, User, Stethoscope, FileText, Trash2, Upload } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from "date-fns";
import ServiceVariantsModal from "./ServiceVariantsModal";
import CreateMedicalRecordModal from "./CreateMedicalRecordModal";

type MedicalRecordImage = {
  imageId: number;
  imageUrl: string;
  description?: string;
  aiTag?: string;
  createdAt?: string;
};

type ServiceVariantDTO = {
  id: number;
  variantName: string;
  description?: string;
  price?: number;
};

type ServiceDTO = {
  id: number;
  serviceName: string;
  category?: string;
  description?: string;
  defaultDuration?: number;
  isActive?: boolean;
  variants?: ServiceVariantDTO[];
};

type MedicalRecordDTO = {
  recordId: number;
  clinic?: { id: number; clinicName: string; address?: string };
  doctor?: { id: number; fullName: string };
  patient?: {
    id: number;
    patientCode: string;
    fullName: string;
    phone?: string;
    email?: string;
  };
  appointmentId?: number;
  appointmentDateTime?: string;
  serviceId?: number;
  serviceName?: string;
  service?: ServiceDTO;
  diagnosis: string;
  treatmentPlan?: string;
  prescriptionNote?: string;
  note?: string;
  recordDate: string;
  images?: MedicalRecordImage[];
};

export default function MedicalRecordDetail() {
  const navigate = useNavigate();
  const { patientId, recordId } = useParams<{ patientId: string; recordId: string }>();
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const accessToken = localStorage.getItem("accessToken");

  const [record, setRecord] = useState<MedicalRecordDTO | null>(null);
  const [images, setImages] = useState<MedicalRecordImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [serviceMap, setServiceMap] = useState<Record<number, ServiceDTO>>({});
  const [selectedService, setSelectedService] = useState<ServiceDTO | null>(null);
  const [showVariantsModal, setShowVariantsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchRecord = useCallback(async () => {
    if (!patientId || !recordId) return;
    setLoading(true);
    try {
      const res = await axios.get<MedicalRecordDTO[]>(
        `${apiBase}/api/patients/${patientId}/records`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        }
      );
      const data = res.data?.find((item) => String(item.recordId) === recordId);
      if (!data) {
        toast.error("Medical record not found");
        navigate(-1);
        return;
      }
      setRecord(data);
      setImages(data.images || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load medical record");
    } finally {
      setLoading(false);
    }
  }, [apiBase, accessToken, patientId, recordId, navigate]);

  useEffect(() => {
    fetchRecord();
  }, [fetchRecord]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await axios.get<ServiceDTO[]>(
          `${apiBase}/api/services`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            withCredentials: true,
          }
        );
        const map = Object.fromEntries(
          (res.data || []).map((service) => [service.id, service])
        );
        setServiceMap(map);
      } catch (err) {
        console.warn("Could not fetch services", err);
      }
    };
    fetchServices();
  }, [apiBase, accessToken]);

  const serviceLabel = useMemo(() => {
    if (!record) return "N/A";
    return (
      record.service?.serviceName ||
      record.serviceName ||
      (record.serviceId && serviceMap[record.serviceId]?.serviceName) ||
      (record.serviceId ? `Service #${record.serviceId}` : "N/A")
    );
  }, [record, serviceMap]);

  const handleServiceClick = () => {
    if (record?.service) {
      setSelectedService(record.service);
      setShowVariantsModal(true);
    } else if (record?.serviceId && serviceMap[record.serviceId]) {
      setSelectedService(serviceMap[record.serviceId]);
      setShowVariantsModal(true);
    }
  };

  const handleUploadImages = async (files: FileList | null) => {
    if (!files || !patientId || !recordId) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        await axios.post<MedicalRecordImage>(
          `${apiBase}/api/patients/${patientId}/records/${recordId}/images`,
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
      toast.success("Images uploaded");
      fetchRecord();
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload images");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!patientId || !recordId) return;
    const backup = images;
    setImages((prev) => prev.filter((img) => img.imageId !== imageId));
    try {
      await axios.delete(
        `${apiBase}/api/patients/${patientId}/records/${recordId}/images/${imageId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        }
      );
      toast.success("Image deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete image");
      setImages(backup);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-lg border bg-white p-6 text-center text-gray-500 shadow">
          Loading medical record...
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="p-6">
        <div className="rounded-lg border bg-white p-6 text-center text-gray-500 shadow">
          Medical record not found.
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="p-6 bg-gray-100 min-h-screen">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              Back
            </button>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow space-y-6">
            <header className="border-b pb-4">
              <p className="text-xs uppercase tracking-wider text-gray-400">
                Medical Record #{record.recordId}
              </p>
              <h1 className="text-3xl font-bold text-[#0D1B3E]">
                {record.patient?.fullName || "Patient"}
              </h1>
              <p className="text-sm text-gray-500">
                Record date: {format(new Date(record.recordDate), "MMM dd, yyyy")}
              </p>
              <div className="mt-4 grid gap-3 rounded-lg border bg-gray-50 p-3 text-sm text-gray-600 md:grid-cols-2">
                <p>
                  <span className="font-semibold text-gray-500">Service: </span>
                  <span
                    className={`${(record?.service || (record?.serviceId && serviceMap[record.serviceId])) ? 'text-blue-600 cursor-pointer hover:text-blue-800 hover:underline transition' : ''}`}
                    onClick={handleServiceClick}
                  >
                    {serviceLabel}
                  </span>
                </p>
                <p>
                  <span className="font-semibold text-gray-500">Appointment Ref: </span>
                  {record.appointmentId ? `#${record.appointmentId}` : "N/A"}
                </p>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="rounded bg-yellow-500 px-3 py-2 text-sm font-medium text-white hover:bg-yellow-600"
                >
                  Edit
                </button>
                <button
                  onClick={async () => {
                    if (!patientId || !record) return;
                    try {
                      const url = `${apiBase}/api/patients/${patientId}/records/${record.recordId}/export/pdf`;
                      const response = await axios.get(url, {
                        headers: { Authorization: `Bearer ${accessToken}` },
                        responseType: "arraybuffer",
                        withCredentials: true,
                      });
                      const blob = new Blob([response.data], { type: "application/pdf" });
                      const downloadUrl = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = downloadUrl;
                      a.download = `${record.patient?.fullName || 'Patient'}-MedicalRecord-${record.recordId}-${Date.now()}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      window.URL.revokeObjectURL(downloadUrl);
                    } catch (err) {
                      console.error(err);
                      toast.error("Failed to export PDF");
                    }
                  }}
                  className="rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Export PDF
                </button>
              </div>
            </header>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="h-4 w-4" />
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Patient Information
                  </h3>
                </div>
                <p className="mt-2 text-gray-900">{record.patient?.fullName}</p>
                <p className="text-sm text-gray-500">Code: {record.patient?.patientCode}</p>
                <p className="text-sm text-gray-500">Phone: {record.patient?.phone || "N/A"}</p>
                <p className="text-sm text-gray-500">Email: {record.patient?.email || "N/A"}</p>
              </div>

              <div className="rounded-xl border p-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Clinic & Doctor
                  </h3>
                </div>
                <p className="mt-2 text-gray-900">{record.clinic?.clinicName || "N/A"}</p>
                <p className="text-sm text-gray-500">{record.clinic?.address || "No address"}</p>
                <p className="mt-3 text-gray-900">{record.doctor?.fullName || "Doctor"}</p>
              </div>
            </section>

            <section className="rounded-xl border p-4 space-y-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Stethoscope className="h-4 w-4" />
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Clinical Details
                </h3>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">Diagnosis</p>
                <p className="mt-1 whitespace-pre-wrap rounded bg-gray-50 p-3 text-gray-900">
                  {record.diagnosis || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">Treatment Plan</p>
                <p className="mt-1 whitespace-pre-wrap rounded bg-gray-50 p-3 text-gray-900">
                  {record.treatmentPlan || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">Prescription Note</p>
                <div className="mt-1 whitespace-pre-wrap rounded bg-gray-50 p-3 text-gray-900">
                  {(() => {
                    const note = record.prescriptionNote;
                    if (!note) return <div className="text-gray-500">N/A</div>;
                    // try parse JSON saved by the modal
                    try {
                      const parsed = JSON.parse(note);
                      let meds: any[] = [];
                      let manual = "";
                      if (Array.isArray(parsed)) {
                        meds = parsed;
                      } else if (parsed && typeof parsed === "object") {
                        meds = parsed.meds || parsed.medications || parsed.items || [];
                        manual = parsed.manual || parsed.note || "";
                      }
                      if (meds && meds.length) {
                        return (
                          <div>
                            <ul className="list-disc pl-5">
                              {meds.map((m: any, idx: number) => (
                                <li key={idx} className="text-gray-900">
                                  <span className="font-medium">{m.name || m.medName || m.label || "Medication"}</span>
                                  {m.quantity ? <span className="text-gray-600"> • Qty: {m.quantity}</span> : null}
                                  {m.instructions ? <div className="text-sm text-gray-700">{m.instructions}</div> : null}
                                </li>
                              ))}
                            </ul>
                            {manual ? <div className="mt-2 text-sm text-gray-700">{manual}</div> : null}
                          </div>
                        );
                      }
                      // fallback: show manual only if present
                      if (manual) return <div className="text-gray-900">{manual}</div>;
                    } catch (e) {
                      // not JSON, fallthrough to human-readable
                    }

                    // If it's plain text (possibly from older versions), try to display it nicely
                    return <div className="text-gray-900">{note}</div>;
                  })()}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">General Note</p>
                <p className="mt-1 whitespace-pre-wrap rounded bg-gray-50 p-3 text-gray-900">
                  {record.note || "N/A"}
                </p>
              </div>
            </section>

            <section className="rounded-xl border p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600">
                  <FileText className="h-4 w-4" />
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Attachments
                  </h3>
                </div>
                <label className="flex cursor-pointer items-center gap-2 rounded border px-3 py-1 text-sm text-gray-600 hover:bg-gray-100">
                  <Upload className="h-4 w-4" />
                  {uploading ? "Uploading..." : "Add images"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => handleUploadImages(e.target.files)}
                  />
                </label>
              </div>

              {images.length === 0 ? (
                <p className="text-sm text-gray-500">No images.</p>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {images.map((img) => (
                    <div key={img.imageId} className="rounded-lg border bg-white p-3 shadow-sm">
                      <img
                        src={img.imageUrl}
                        alt={img.description || "medical record"}
                        className="h-40 w-full rounded object-cover"
                      />
                      <p className="mt-2 text-sm font-medium text-gray-800">
                        {img.description || "No description"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {img.aiTag ? `Tag: ${img.aiTag}` : "No tag"} •{" "}
                        {img.createdAt ? format(new Date(img.createdAt), "MMM dd, yyyy HH:mm") : ""}
                      </p>
                      <button
                        onClick={() => handleDeleteImage(img.imageId)}
                        className="mt-2 flex items-center gap-1 text-xs text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      <ServiceVariantsModal
        isOpen={showVariantsModal}
        service={selectedService}
        onClose={() => {
          setShowVariantsModal(false);
          setSelectedService(null);
        }}
      />
      <CreateMedicalRecordModal
        isOpen={showEditModal}
        mode="edit"
        patientId={patientId ? Number(patientId) : undefined}
        doctorId={record?.doctor ? (record.doctor as any).id : undefined}
        appointment={null}
        record={
          record
            ? {
                recordId: record.recordId,
                clinic: record.clinic,
                patient: record.patient,
                appointmentId: record.appointmentId,
                serviceId: record.serviceId,
                service: record.service,
                diagnosis: record.diagnosis,
                treatmentPlan: record.treatmentPlan,
                prescriptionNote: record.prescriptionNote,
                note: record.note,
                recordDate: record.recordDate,
              }
            : null
        }
        onClose={() => setShowEditModal(false)}
        onSuccess={() => {
          fetchRecord();
        }}
      />
    </>
  );
}


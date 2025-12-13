import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Calendar, Eye } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from "date-fns";
import ServiceVariantsModal from "./ServiceVariantsModal";
import type { MedicalRecordDTO, ServiceDTO, ServiceVariantDTO } from "../types/doctor";

export default function PatientMedicalRecords() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const accessToken = localStorage.getItem("accessToken");

  const [records, setRecords] = useState<MedicalRecordDTO[]>([]);
  const [serviceMap, setServiceMap] = useState<Record<number, ServiceDTO>>({});
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<ServiceDTO | null>(null);
  const [showVariantsModal, setShowVariantsModal] = useState(false);
  const [activeVariantId, setActiveVariantId] = useState<number | undefined>(undefined);
  const [activeVariantName, setActiveVariantName] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!patientId) return;
    const fetchRecords = async () => {
      setLoading(true);
      try {
        const response = await axios.get<MedicalRecordDTO[]>(
          `${apiBase}/api/patients/${patientId}/records`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            withCredentials: true,
          }
        );
        console.log("Medical records response:", response.data);
        response.data?.forEach((record, index) => {
          console.log(`Record ${index}:`, {
            recordId: record.recordId,
            service: record.service,
            serviceVariant: record.serviceVariant,
            serviceId: record.serviceId,
            serviceName: record.serviceName
          });
        });
        const data =
          response.data?.sort(
            (a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime()
          ) || [];
        setRecords(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load medical records");
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [apiBase, accessToken, patientId]);

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
        console.warn("Could not load services", err);
      }
    };
    fetchServices();
  }, [apiBase, accessToken]);

  const handleServiceClick = (service: ServiceDTO | null | undefined, serviceId?: number, selectedVariant?: ServiceVariantDTO | null | undefined) => {
    if (service) {
      setSelectedService(service);
      setShowVariantsModal(true);
    } else if (serviceId && serviceMap[serviceId]) {
      setSelectedService(serviceMap[serviceId]);
      setShowVariantsModal(true);
    }
    // Determine active variant from selectedVariant if provided
    const vid = selectedVariant?.variantId ?? selectedVariant?.id;
    if (vid) {
      setActiveVariantId(vid);
      setActiveVariantName(undefined);
    } else if (selectedVariant?.variantName) {
      setActiveVariantName(selectedVariant.variantName);
      setActiveVariantId(undefined);
    } else {
      setActiveVariantId(undefined);
      setActiveVariantName(undefined);
    }
  };

  const patientInfo = useMemo(() => records[0]?.patient, [records]);

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="min-h-screen bg-gray-100 p-6">
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
            <div className="border-b pb-4">
              <p className="text-xs uppercase tracking-wider text-gray-400">Patient</p>
              <h1 className="text-3xl font-bold text-[#0D1B3E]">
                {patientInfo?.fullName || "Patient records"}
              </h1>
              {patientInfo && (
                <div className="mt-2 text-sm text-gray-500">
                  <p>ID: {patientInfo.patientCode}</p>
                  <p>Email: {patientInfo.email || "N/A"}</p>
                  <p>Phone: {patientInfo.phone || "N/A"}</p>
                </div>
              )}
            </div>

            {loading ? (
              <div className="rounded-lg border bg-gray-50 p-6 text-center text-gray-500">
                Loading records...
              </div>
            ) : records.length === 0 ? (
              <div className="rounded-lg border bg-gray-50 p-6 text-center text-gray-500">
                No medical records for this patient.
              </div>
            ) : (
              <div className="space-y-4">
                {records.map((record) => (
                  <div
                    key={record.recordId}
                    className="rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">
                          Record #{record.recordId}
                        </p>
                        <h3 
                          className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition"
                          onClick={() => handleServiceClick(record.service, record.serviceId, record.serviceVariant)}
                        >
                          {(() => {
                            const serviceName = 
                              record.service?.serviceName ||
                              record.serviceName ||
                              (record.service?.id && serviceMap[record.service.id]?.serviceName) ||
                              (record.serviceId && serviceMap[record.serviceId]?.serviceName) ||
                              (record.serviceId ? `Service #${record.serviceId}` : "Unknown service");
                            
                            // Nếu có variant, hiển thị cả variant name
                            if (record.serviceVariant?.variantName) {
                              return `${serviceName} - ${record.serviceVariant.variantName}`;
                            }
                            
                            return serviceName;
                          })()}
                        </h3>
                        <p className="text-sm text-gray-500">
                          <Calendar className="mr-1 inline h-4 w-4 text-gray-400" />
                          {format(new Date(record.recordDate), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            navigate(`/doctor/patients/${patientId}/records/${record.recordId}`)
                          }
                          className="flex items-center gap-1 rounded border px-3 py-2 text-sm text-blue-600 hover:bg-blue-50"
                        >
                          <Eye className="h-4 w-4" />
                          View detail
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-gray-600 md:grid-cols-2">
                      <p>
                        <span className="font-semibold text-gray-500">Clinic:</span>{" "}
                        {record.clinic?.clinicName || "N/A"}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-500">Doctor:</span>{" "}
                        {record.doctor?.fullName || "N/A"}
                      </p>
                      <p className="md:col-span-2">
                        <span className="font-semibold text-gray-500">Diagnosis:</span>{" "}
                        {record.diagnosis || "N/A"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ServiceVariantsModal
        isOpen={showVariantsModal}
        service={selectedService}
        activeVariantId={activeVariantId}
        activeVariantName={activeVariantName}
        onlyShowActiveVariant={Boolean(activeVariantId || activeVariantName)}
        onClose={() => {
          setShowVariantsModal(false);
          setSelectedService(null);
          setActiveVariantId(undefined);
          setActiveVariantName(undefined);
        }}
      />
    </>
  );
}


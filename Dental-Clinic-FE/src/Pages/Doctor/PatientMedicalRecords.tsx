import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Calendar, Eye } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from "date-fns";

type MedicalRecordDTO = {
  recordId: number;
  recordDate: string;
  diagnosis: string;
  treatmentPlan?: string;
  serviceName?: string;
  serviceId?: number;
  service?: { id: number; serviceName: string };
  clinic?: { id: number; clinicName: string };
  doctor?: { id: number; fullName: string };
  patient?: {
    id: number;
    patientCode: string;
    fullName: string;
    phone?: string;
    email?: string;
  };
};

export default function PatientMedicalRecords() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const accessToken = localStorage.getItem("accessToken");

  const [records, setRecords] = useState<MedicalRecordDTO[]>([]);
  const [serviceMap, setServiceMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

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

  // Fetch services map to show service names when service object is not present
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await axios.get<{ id: number; serviceName: string }[]>(
          `${apiBase}/api/services`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            withCredentials: true,
          }
        );
        const map = Object.fromEntries((res.data || []).map((s) => [s.id, s.serviceName]));
        setServiceMap(map);
      } catch (err) {
        console.warn("Could not fetch services", err);
      }
    };
    fetchServices();
  }, [apiBase, accessToken]);

  

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
                        <h3 className="text-lg font-semibold text-gray-900">
                          {record.service?.serviceName ||
                            record.serviceName ||
                            (record.service?.id && serviceMap[record.service.id]) ||
                            (record.serviceId ? `Service #${record.serviceId}` : "Unknown service")}
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
    </>
  );
}


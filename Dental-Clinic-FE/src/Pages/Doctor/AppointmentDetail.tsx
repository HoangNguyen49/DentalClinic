import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  MapPin,
  Phone,
  Mail,
  FileText,
  Crown,
  DollarSign,
  Play,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import CreateMedicalRecordModal from "./CreateMedicalRecordModal";
import ServiceVariantsModal from "./ServiceVariantsModal";
import AISummaryPanel from "../../components/Doctor/AISummaryPanel";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from "date-fns";
import type { DoctorAppointmentDTO, ServiceDTO } from "../types/doctor";

interface AISummaryData {
  overview: string;
  alerts: string;
  recentTreatments: string;
  rawSummary?: string;
}

export default function AppointmentDetail() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const accessToken = localStorage.getItem("accessToken");
  // read user object saved by login handlers (key: "user")
  const userInfo = JSON.parse(localStorage.getItem("user") || "null");
  const doctorId = userInfo?.doctorId || userInfo?.id || userInfo?.userId;

  const [appointment, setAppointment] = useState<DoctorAppointmentDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMedicalRecordModal, setShowMedicalRecordModal] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceDTO | null>(null);
  const [showVariantsModal, setShowVariantsModal] = useState(false);
  const [activeVariantId, setActiveVariantId] = useState<number | undefined>(undefined);
  const [activeVariantName, setActiveVariantName] = useState<string | undefined>(undefined);
  
  // AI Summary state
  const [aiSummary, setAiSummary] = useState<AISummaryData | null>(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [aiError, setAiError] = useState<string | null>(null);
  
  // Status change state
  const [changingStatus, setChangingStatus] = useState(false);

  useEffect(() => {
    if (!appointmentId || !doctorId) {
      toast.error("Missing appointment ID or doctor ID");
      navigate("/doctor/appointments");
      return;
    }

    // Fetch appointment detail and AI summary in parallel
    const fetchAppointment = async () => {
      try {
        const response = await axios.get<DoctorAppointmentDTO>(
          `${apiBase}/api/doctor/appointments/${doctorId}/${appointmentId}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        console.log("Appointment response:", response.data);
        console.log("Appointment service:", response.data.service);
        console.log("Appointment appointmentServiceId:", response.data.appointmentServiceId);
        setAppointment(response.data);
      } catch (err: unknown) {
        console.error("Error fetching appointment:", err);
        if (err instanceof Error) {
          toast.error(err.message);
        } else {
          toast.error("Failed to load appointment");
        }
        navigate("/doctor/appointments");
      } finally {
        setLoading(false);
      }
    };

    // Fetch AI summary (new)
    const fetchAISummary = async () => {
      if (!appointmentId || !accessToken) {
        setAiLoading(false);
        return;
      }

      setAiLoading(true);
      setAiError(null);

      try {
        const response = await axios.get<AISummaryData>(
          `${apiBase}/api/doctor/appointments/${appointmentId}/ai-summary`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        setAiSummary(response.data);
      } catch (err: unknown) {
        console.error("Error fetching AI summary:", err);
        // Don't block the page if AI summary fails - just show error in panel
        const resp = (err as { response?: { status?: number } })?.response;
        if (resp?.status === 401) {
          setAiError("Unauthorized. Please log in again.");
        } else if (resp?.status === 404) {
          setAiError("Appointment not found or you don't have access.");
        } else {
          setAiError("Unable to load AI summary. Please try refreshing the page.");
        }
      } finally {
        setAiLoading(false);
      }
    };

    // Call both APIs in parallel
    fetchAppointment();
    fetchAISummary();
  }, [appointmentId, doctorId, apiBase, accessToken, navigate]);



  const getStatusBadgeClass = (status: string) => {
    const s = status?.toLowerCase() || "";
    if (s === "pending") return "bg-yellow-100 text-yellow-800";
    if (s === "scheduled") return "bg-blue-100 text-blue-800";
    if (s === "in_progress" || s === "in-progress") return "bg-purple-100 text-purple-800";
    if (s === "completed") return "bg-green-100 text-green-800";
    if (s === "canceled") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  // Change appointment status
  const changeStatus = async (newStatus: string) => {
    if (!appointmentId || !accessToken || changingStatus) return;

    const raw = (newStatus || "").trim().toUpperCase();
    let mapped = raw;
    // Normalize common aliases (send normalized values to backend)
    if (["IN-PROGRESS", "IN_PROGRESS"].includes(raw)) mapped = "IN_PROGRESS";
    if (["NO-SHOW", "NO_SHOW", "NO-SHOWING", "NO_SHOWING"].includes(raw)) mapped = "CANCELED";
    if (raw === "CANCELLED") mapped = "CANCELED";

    // Frontend only warns when completing — backend performs final validation
    if (mapped === "COMPLETED") {
      toast.warning("Please ensure you have created a medical record before completing.", { autoClose: 4000 });
    }

    setChangingStatus(true);
    try {
      await axios.post(
        `${apiBase}/api/doctor/appointments/${appointmentId}/status?status=${mapped}`,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      toast.success(`Appointment status changed to ${mapped}`);
      
      // Refresh appointment data
      if (appointmentId && doctorId) {
        try {
          const response = await axios.get<DoctorAppointmentDTO>(
            `${apiBase}/api/doctor/appointments/${doctorId}/${appointmentId}`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          setAppointment(response.data);
        } catch (err) {
          console.error("Error refreshing appointment:", err);
        }
      }
    } catch (postErr: unknown) {
      const resp = (postErr as { response?: { status?: number; data?: unknown } })?.response;

      // Handle backend validation errors
      if (resp && resp.status === 400) {
        const payload = resp.data as { message?: unknown } | undefined;
        const serverMsg = payload && typeof payload.message === "string" ? payload.message : undefined;

        // Backend returns 400 with message "Cannot set to COMPLETED: medical record is required"
        if (serverMsg && serverMsg.toLowerCase().includes("medical record is required")) {
          console.error(`[DoctorAppointment] appointmentId=${appointmentId} missing medical record according to server:`, resp.data);
          // Show modal prompting to create/view medical record
          toast.error("Cannot complete appointment: medical record is required.");
          setShowMedicalRecordModal(true);
          return;
        }

        // Other validation messages from backend
        toast.error(serverMsg ?? "Validation failed");
        return;
      }

      console.error("Error changing status:", postErr);
      if (postErr instanceof Error) {
        toast.error(postErr.message);
      } else {
        toast.error("Failed to change appointment status");
      }
    } finally {
      setChangingStatus(false);
    }
  };

  const handleServiceClick = async () => {
    if (!appointment?.service) return;
    // Determine the active variant from appointment data, prefer explicit variant if available
    const svcVariantId = appointment.serviceVariant?.variantId ?? appointment.serviceVariant?.id;
    let nameFromAppointment: string | undefined;
    if (appointment.serviceVariant?.variantName) nameFromAppointment = appointment.serviceVariant?.variantName;
    // If there are appointmentServices, prefer to find by appointmentServiceId
    if (!svcVariantId && appointment.appointmentServices && appointment.appointmentServices.length > 0) {
      const found = appointment.appointmentServices.find((s) => s.appointmentServiceId === appointment.appointmentServiceId) || appointment.appointmentServices[0];
      if (found?.serviceVariant) {
        const id = found.serviceVariant.variantId ?? found.serviceVariant.id;
        if (id) {
          setActiveVariantId(id);
        }
        if (found.serviceVariant.variantName) setActiveVariantName(found.serviceVariant.variantName);
      }
    } else {
      if (svcVariantId) setActiveVariantId(svcVariantId);
      if (nameFromAppointment) setActiveVariantName(nameFromAppointment);
      if (!svcVariantId && !nameFromAppointment && appointment.serviceDetails && appointment.serviceDetails.length > 0) {
        // Use the first detail string as name
        setActiveVariantName(appointment.serviceDetails[0]);
      }
    }
    
    // If service already has variants, use it directly
    if (appointment.service.variants !== undefined) {
      setSelectedService(appointment.service);
      setShowVariantsModal(true);
      return;
    }

    // Otherwise, fetch full service data
    try {
      const response = await axios.get<ServiceDTO>(
        `${apiBase}/api/services/${appointment.service.id}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      setSelectedService(response.data);
      setShowVariantsModal(true);
    } catch (err) {
      console.error("Failed to fetch service details:", err);
      toast.error("Failed to load service details");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">Appointment not found</div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="p-6 min-h-screen bg-gray-100">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/doctor/appointments")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Appointments
            </button>    
              <button
                onClick={() => setShowMedicalRecordModal(true)}
                disabled={!appointment.patient?.id}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText className="w-4 h-4" />
                Create Medical Record
              </button>
          </div>

          {/* AI Summary Panel - Prominently displayed at the top */}
          <AISummaryPanel 
            summary={aiSummary}
            loading={aiLoading}
            error={aiError}
          />

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-[#0D1B3E]">Appointment Details</h1>
              
              {/* Status Change Actions - inline buttons */}
              <div className="flex items-center gap-2">
                {(() => {
                  const now = new Date();
                  const start = new Date(appointment.startDateTime);
                  const startMinus5 = new Date(start.getTime() - 5 * 60 * 1000);
                  const canStart = now >= startMinus5 && (appointment.status || "").toUpperCase() === "SCHEDULED";

                  const startPlus20 = new Date(start.getTime() + 20 * 60 * 1000);
                  const canCancel = ( (appointment.status || "").toUpperCase() === "SCHEDULED" || (appointment.status || "").toUpperCase() === "CONFIRMED") && now >= startPlus20;

                  const statusUpper = (appointment.status || "").toUpperCase();
                  const isProcessing = statusUpper === "PROCESSING" || statusUpper === "IN_PROGRESS" || statusUpper === "IN-PROGRESS";

                  const exceeds20Min = now.getTime() - start.getTime() > 20 * 60 * 1000;

                  return (
                    <>
                      {/* SCHEDULED -> Start */}
                      {(appointment.status || "").toUpperCase() === "SCHEDULED" && (
                        <button
                          onClick={async () => {
                            if (!canStart) {
                              toast.error("Cannot start yet: appointments can only be started within 5 minutes of scheduled time");
                              return;
                            }
                            await changeStatus("IN_PROGRESS");
                          }}
                          disabled={!canStart || changingStatus}
                          className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition ${canStart ? "bg-purple-600 text-white hover:bg-purple-700" : "bg-gray-300 text-gray-500 cursor-not-allowed"} disabled:opacity-50`}
                          title={!canStart ? "Cannot start yet" : "Start processing"}
                        >
                          <Play className="w-4 h-4" />
                          Start
                        </button>
                      )}

                      {/* PROCESSING -> Complete (+ Cancel if overdue) */}
                      {isProcessing && (
                        <>
                          <button
                            onClick={async () => {
                              // Let backend validate medical record requirement — frontend only warns
                              await changeStatus("COMPLETED");
                            }}
                            disabled={changingStatus}
                            className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition disabled:opacity-50"
                            title="Mark as Completed (requires medical record)"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Complete
                          </button>

                          {exceeds20Min && (
                            <button
                              onClick={async () => await changeStatus("CANCELED")}
                              disabled={changingStatus}
                              className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 transition disabled:opacity-50 animate-pulse"
                              title="Meeting exceeded 20 minutes - recommend canceling"
                            >
                              <XCircle className="w-4 h-4" />
                              Cancel
                            </button>
                          )}
                        </>
                      )}

                      {/* Allow cancel from SCHEDULED/CONFIRMED after 20min */}
                      {canCancel && ( (appointment.status || "").toUpperCase() !== "CANCELED") && (
                        <button
                          onClick={async () => await changeStatus("CANCELED")}
                          disabled={changingStatus}
                          className="px-3 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      )}
                    </>
                  );
                })()}

               
              </div>
            </div>

            <div className="space-y-6">
              {/* Appointment Information */}
              <section>
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Appointment Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="mt-1">
                      <span
                        className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusBadgeClass(
                          appointment.status
                        )}`}
                      >
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Channel</label>
                    <div className="mt-1 text-gray-900">{appointment.channel || "N/A"}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date & Time</label>
                    <div className="mt-1 flex items-center gap-2 text-gray-900">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {format(new Date(appointment.startDateTime), "MMM dd, yyyy HH:mm")} -{" "}
                      {format(new Date(appointment.endDateTime ?? appointment.startDateTime), "HH:mm")}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Service</label>
                    <div 
                      className={`mt-1 ${appointment.service ? 'text-blue-600 cursor-pointer hover:text-blue-800 hover:underline transition' : 'text-gray-900'}`}
                      onClick={handleServiceClick}
                    >
                      {appointment.service?.serviceName || "N/A"}
                    </div>
                    {appointment.serviceVariant && (
                      <div className="mt-1 text-sm text-gray-600">
                        <div className="font-medium">{appointment.serviceVariant.variantName}</div>
                        {appointment.serviceVariant.duration && (
                          <div className="text-xs text-gray-500">
                            Duration: {appointment.serviceVariant.duration} minutes
                          </div>
                        )}
                        {appointment.serviceVariant.price !== undefined && appointment.serviceVariant.price !== null && (
                          <div className="text-xs text-gray-500">
                            Price: {new Intl.NumberFormat("vi-VN", {
                              style: "currency",
                              currency: appointment.serviceVariant.currency || "VND",
                            }).format(appointment.serviceVariant.price)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Appointment Type</label>
                    <div className="mt-1 flex items-center gap-2">
                      {appointment.appointmentType ? (
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full ${
                            appointment.appointmentType === "VIP"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          <Crown className={`w-3 h-3 ${appointment.appointmentType === "VIP" ? "text-purple-600" : ""}`} />
                          {appointment.appointmentType}
                        </span>
                      ) : (
                        <span className="text-gray-900">N/A</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Booking Fee</label>
                    <div className="mt-1 flex items-center gap-2 text-gray-900">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      {appointment.bookingFee !== undefined && appointment.bookingFee !== null
                        ? new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(appointment.bookingFee)
                        : "N/A"}
                    </div>
                  </div>
                  {appointment.note && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-500">Note</label>
                      <div className="mt-1 p-3 bg-gray-50 rounded text-gray-900">{appointment.note}</div>
                    </div>
                  )}
                </div>
              </section>

              {/* Patient Information */}
              <section className="border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Patient Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Patient Code</label>
                    <div className="mt-1 text-gray-900">{appointment.patient?.patientCode || "N/A"}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <div className="mt-1 text-gray-900">{appointment.patient?.fullName || "N/A"}</div>
                  </div>
                     <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <div className="mt-1 flex items-center gap-2 text-gray-900">
                      <Mail className="w-4 h-4 text-gray-400" />
                      {appointment.patient?.email || "N/A"}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <div className="mt-1 flex items-center gap-2 text-gray-900">
                      <Phone className="w-4 h-4 text-gray-400" />
                      {appointment.patient?.phone || "N/A"}
                    </div>
                  </div>
               
                  {appointment.patient?.dateOfBirth && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                      <div className="mt-1 text-gray-900">
                        {format(new Date(appointment.patient.dateOfBirth), "MMM dd, yyyy")}
                      </div>
                    </div>
                  )}
                  {appointment.patient?.gender && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Gender</label>
                      <div className="mt-1 text-gray-900">{appointment.patient.gender}</div>
                    </div>
                  )}
                </div>
                {appointment.patient?.id && (
                  <div className="mt-4">
                    <button
                      onClick={() => navigate(`/doctor/patients/${appointment.patient?.id}/records`)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      View Patient Medical Records
                    </button>
                  </div>
                )}
              </section>

              {/* Clinic Information */}
              <section className="border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Clinic Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Clinic</label>
                    <div className="mt-1 flex items-center gap-2 text-gray-900">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {appointment.clinic?.clinicName || "N/A"}
                    </div>
                    {appointment.clinic?.address && (
                      <div className="mt-1 text-sm text-gray-600">{appointment.clinic.address}</div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Room</label>
                    <div className="mt-1 text-gray-900">
                      {appointment.room?.roomName || "N/A"}
                      {appointment.chair && ` - Chair ${appointment.chair.chairNumber}`}
                    </div>
                  </div>
                </div>
              </section>

              {/* Doctor Information */}
              <section className="border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Doctor Information</h2>
                <div>
                  <label className="text-sm font-medium text-gray-500">Doctor</label>
                  <div className="mt-1 text-gray-900">{appointment.doctor?.fullName || "N/A"}</div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* Create Medical Record Modal */}
      <CreateMedicalRecordModal
        isOpen={showMedicalRecordModal}
        mode="create"
        appointment={appointment}
        patientId={appointment.patient?.id}
        doctorId={doctorId}
        onClose={() => setShowMedicalRecordModal(false)}
        onSuccess={async () => {
          // Refetch appointment detail after creating medical record
          if (appointmentId && doctorId) {
            try {
              const response = await axios.get<DoctorAppointmentDTO>(
                `${apiBase}/api/doctor/appointments/${doctorId}/${appointmentId}`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
              );
              setAppointment(response.data);
              toast.success("Hồ sơ bệnh án đã được tạo. Bạn có thể hoàn tất lịch hẹn.");
            } catch (err) {
              console.error("Error refreshing appointment after creating medical record:", err);
            }
          }
        }}
      />

      {/* Service Variants Modal */}
      <ServiceVariantsModal
        isOpen={showVariantsModal}
        service={selectedService}
        activeVariantId={activeVariantId}
        activeVariantName={activeVariantName}
        onlyShowActiveVariant={true}
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


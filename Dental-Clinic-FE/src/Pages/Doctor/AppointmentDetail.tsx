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
} from "lucide-react";
import CreateMedicalRecordModal from "./CreateMedicalRecordModal";
import ServiceVariantsModal from "./ServiceVariantsModal";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from "date-fns";
import type { DoctorAppointmentDTO, ServiceDTO } from "../types/doctor";

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

  useEffect(() => {
    if (!appointmentId || !doctorId) {
      toast.error("Missing appointment ID or doctor ID");
      navigate("/doctor/appointments");
      return;
    }

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

    fetchAppointment();
  }, [appointmentId, doctorId, apiBase, accessToken, navigate]);



  const getStatusBadgeClass = (status: string) => {
    const s = status?.toLowerCase() || "";
    if (s === "pending") return "bg-yellow-100 text-yellow-800";
    if (s === "scheduled") return "bg-blue-100 text-blue-800";
    if (s === "completed") return "bg-green-100 text-green-800";
    if (s === "canceled") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
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

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h1 className="text-2xl font-bold text-[#0D1B3E] mb-6">Appointment Details</h1>

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
                    <div className="md:col-span-2">
                    <div className="mt-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
                      {appointment.serviceDetails && appointment.serviceDetails.length > 0 ? (
                        <ul className="space-y-1">
                          {appointment.serviceDetails.map((name, index) => (
                            <li key={index} className="flex items-start gap-2 text-gray-900 text-sm">
                              <span className="mt-1.5 w-1.5 h-1.5 bg-blue-600 rounded-full shrink-0" />
                              <span className="font-medium">{name}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        // Fallback nếu chưa có list thì hiện logic cũ
                        <div 
                           className={`text-gray-900 ${appointment.service ? 'cursor-pointer hover:text-blue-600' : ''}`}
                           onClick={handleServiceClick}
                        >
                           {appointment.service?.serviceName || "N/A"}
                        </div>
                      )}
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
        onSuccess={() => {
          // Could refetch appointment if needed
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


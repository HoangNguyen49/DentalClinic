import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Eye, Clock, User, MapPin, Crown, DollarSign } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from "date-fns";
import type { DoctorAppointmentDTO } from "../types/doctor";
import CreateMedicalRecordModal from "./CreateMedicalRecordModal";

export default function AppointmentList() {
  const navigate = useNavigate();
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const accessToken = localStorage.getItem("accessToken");
  // read user object saved by login handlers (key: "user")
  const userInfo = JSON.parse(localStorage.getItem("user") || "null");
  const doctorId = userInfo?.doctorId || userInfo?.id || userInfo?.userId;

  const [appointments, setAppointments] = useState<DoctorAppointmentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [missingRecordAppointment, setMissingRecordAppointment] = useState<DoctorAppointmentDTO | null>(null);
  const [showCreateRecordModal, setShowCreateRecordModal] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("");

  const fetchAppointments = useCallback(async () => {
    if (!accessToken || !doctorId) {
      toast.error("Please login to view appointments");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let url = `${apiBase}/api/doctor/appointments/${doctorId}`;
      const params: Record<string, string> = {};

      if (statusFilter) {
        url = `${apiBase}/api/doctor/appointments/${doctorId}/status/${statusFilter}`;
      } else if (dateFilter) {
        // If date filter is set, use date-range endpoint
        const startDate = new Date(dateFilter);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        params.startDate = startDate.toISOString().split("T")[0];
        params.endDate = endDate.toISOString().split("T")[0];
        url = `${apiBase}/api/doctor/appointments/${doctorId}/date-range`;
      }

      const response = await axios.get<DoctorAppointmentDTO[]>(url, {
        params,
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      let filtered = response.data || [];

      // Client-side search by patient name or code
      if (searchInput.trim()) {
        const searchLower = searchInput.toLowerCase();
        filtered = filtered.filter(
          (apt) =>
            apt.patient?.fullName?.toLowerCase().includes(searchLower) ||
            apt.patient?.patientCode?.toLowerCase().includes(searchLower)
        );
      }

      // Sort by startDateTime (newest first)
      filtered.sort((a, b) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime());

      // Hide PENDING appointments by default (unless user explicitly filters by status)
      if (!statusFilter) {
        filtered = filtered.filter((a) => (a.status || "").toUpperCase() !== "PENDING");
      }

      // update state with fetched & filtered appointments
      setAppointments(filtered);

    } catch (err: unknown) {
      console.error("Error fetching appointments:", err);
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Failed to load appointments");
      }
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [apiBase, accessToken, doctorId, statusFilter, dateFilter, searchInput]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const changeStatus = async (appointmentId: number, newStatus: string) => {
    try {
      if (!accessToken) {
        toast.error("Not authenticated");
        return;
      }

      const appt = appointments.find((a) => a.appointmentId === appointmentId);
      if (!appt) {
        toast.error("Appointment not loaded");
        return;
      }

      const raw = (newStatus || "").trim().toUpperCase();
      // Normalize common aliases
      let mapped = raw;
      if (["IN-PROGRESS", "IN_PROGRESS"].includes(raw)) mapped = "PROCESSING";
      if (["NO-SHOW", "NO_SHOW", "NO-SHOWING", "NO_SHOWING"].includes(raw)) mapped = "CANCELED";
      if (raw === "CANCELLED") mapped = "CANCELED";

      // THÊM CẢNH BÁO KHI CHỌN COMPLETED - FRONTEND CHỈ HIỂN THỊ CẢNH BÁO, BACKEND SẼ VALIDATE
      if (mapped === "COMPLETED") {
        toast.warning(
          "Please ensure you have created a medical record before completing.",
          { autoClose: 4000 }
        );
      }

      // THÊM: ĐÃ XÓA VALIDATION LOGIC Ở FRONTEND, CHỈ ĐỂ BACKEND XỬ LÝ VALIDATION
      // ĐÃ XÓA: Các validation cho IN_PROGRESS, COMPLETED, CANCELED ở frontend

      // All validations passed — send request with normalized status
      try {
        await axios.post(
          `${apiBase}/api/doctor/appointments/${appointmentId}/status?status=${mapped}`,
          {},
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        toast.success(`Appointment status changed to ${mapped}`);
        
        // Flow A: If status changed to PROCESSING, navigate to detail page immediately
        if (mapped === "PROCESSING") {
          // Navigate to appointment detail page immediately after successful status change
          navigate(`/doctor/appointments/${appointmentId}`);
          return; // Don't refresh list, we're navigating away
        }
        
        fetchAppointments(); // Refresh list for other status changes
      } catch (postErr: unknown) {
        const resp = (postErr as { response?: { status?: number; data?: unknown } })?.response;
        // Backend returns 400 with message "Cannot set to COMPLETED: medical record is required"
        const payload = resp?.data as { message?: unknown } | undefined;
        const serverMsg = payload && typeof payload.message === "string" ? payload.message : undefined;

        if (resp && resp.status === 400 && serverMsg && serverMsg.includes("medical record is required")) {
          console.error(`[DoctorAppointment] appointmentId=${appt.appointmentId} missing medical record according to server:`, resp.data);
          // show modal prompting to create/view medical record
          setMissingRecordAppointment(appt);
          return;
        }

        // THÊM: XỬ LÝ CÁC LỖI VALIDATION KHÁC TỪ BACKEND
        if (resp && resp.status === 400) {
          // Hiển thị thông báo lỗi từ backend
          toast.error(serverMsg ?? "Validation failed");
          return;
        }

        console.error("Error changing status:", postErr);
        if (postErr instanceof Error) {
          toast.error(postErr.message);
        } else {
          toast.error("Failed to change appointment status");
        }
        return;
      }
    } catch (err) {
      console.error("Error changing status:", err);
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Failed to change appointment status");
      }
    }
  };



  const getStatusBadgeClass = (status: string) => {
    const s = status?.toLowerCase() || "";
    if (s === "scheduled") return "bg-blue-100 text-blue-800";
    if (s === "in_progress" || s === "in-progress") return "bg-purple-100 text-purple-800";
    if (s === "completed") return "bg-green-100 text-green-800";
    if (s === "canceled") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="p-6 min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-[#0D1B3E] mb-2">Appointments</h1>
              <p className="text-gray-600 text-base">
                Total: <span className="font-extrabold text-gray-900">{appointments.length}</span> appointments
              {/* Modal shown when server reports missing medical record for COMPLETED */}
              {missingRecordAppointment && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
                  <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-4">
                    <h3 className="text-base font-semibold text-red-600 mb-1">Medical Record Required</h3>
                    <p className="text-xs text-gray-600 mt-1">
                      Cannot complete appointment: a medical record is required for this appointment. This validation is enforced by the backend to ensure proper documentation.
                    </p>

                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700">
                      <div className="font-medium">{missingRecordAppointment.patient?.fullName || "N/A"}</div>
                      <div className="text-xs">{format(new Date(missingRecordAppointment.startDateTime), "MMM dd, HH:mm")} • {missingRecordAppointment.service?.serviceName || "-"}</div>
                    </div>

                    <div className="flex justify-end gap-2 mt-3">
                      <button
                        onClick={() => {
                          setShowCreateRecordModal(true);
                        }}
                        className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 transition text-xs"
                      >
                        Create Medical Record
                      </button>

                      <button 
                        onClick={() => setMissingRecordAppointment(null)} 
                        className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 transition text-xs"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <CreateMedicalRecordModal
                isOpen={showCreateRecordModal}
                mode="create"
                patientId={missingRecordAppointment?.patient?.id}
                doctorId={doctorId}
                appointment={missingRecordAppointment}
                onClose={() => setShowCreateRecordModal(false)}
                onSuccess={() => {
                  setShowCreateRecordModal(false);
                  setMissingRecordAppointment(null);
                  fetchAppointments();
                  // THÊM THÔNG BÁO THÀNH CÔNG SAU KHI TẠO MEDICAL RECORD
                  toast.success("Medical record created successfully. You can now complete the appointment.");
                }}
              />

                
              </p>
              
            </div>
            
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Patient name or code..."
                    className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                  <button
                    onClick={() => fetchAppointments()}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  <option value="">All Status</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELED">Canceled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={() => {
                  setSearchInput("");
                  setStatusFilter("");
                  setDateFilter("");
                }}
                className="px-4 py-2 text-gray-700 border rounded hover:bg-gray-100 transition"
              >
                Clear Filters
              </button>
            </div>
          </div>

        
          <div className="bg-white rounded-xl shadow-md border border-gray-200">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : appointments.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No appointments found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Clinic
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Service
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Room
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Booking Fee
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {appointments.map((appointment) => {
                      const now = new Date();
                      const start = new Date(appointment.startDateTime);
                      const startMinus5 = new Date(start.getTime() - 5 * 60 * 1000);
                      const canStart = now >= startMinus5;


                      return (
                        <tr key={appointment.appointmentId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="font-medium text-gray-900">
                                {format(new Date(appointment.startDateTime), "HH:mm")} -{" "}
                                {format(new Date(appointment.endDateTime ?? appointment.startDateTime), "HH:mm")}
                              </div>
                              <div className="text-gray-500 text-xs">
                                {format(new Date(appointment.startDateTime), "MMM dd, yyyy")}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {appointment.patient?.fullName || "N/A"}
                              </div>
                              <div className="text-xs text-gray-500">
                                {appointment.patient?.patientCode || ""}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          {appointment.clinic?.clinicName || "-"}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          <div>
                            {appointment.service?.serviceName || "-"}
                            {appointment.serviceVariant && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                {appointment.serviceVariant.variantName}
                                {appointment.serviceVariant.price && (
                                  <span className="ml-1">
                                    • {new Intl.NumberFormat("vi-VN", {
                                      style: "currency",
                                      currency: appointment.serviceVariant.currency || "VND",
                                    }).format(appointment.serviceVariant.price)}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            {appointment.room?.roomName || "-"}
                            {appointment.chair && ` (Chair ${appointment.chair.chairNumber})`}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {appointment.appointmentType ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full ${
                                appointment.appointmentType === "VIP"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {appointment.appointmentType === "VIP" && (
                                <Crown className="w-3 h-3 text-purple-600" />
                              )}
                              {appointment.appointmentType}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          {appointment.bookingFee !== undefined && appointment.bookingFee !== null ? (
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3 text-gray-400" />
                              <span>
                                {new Intl.NumberFormat("vi-VN", {
                                  style: "currency",
                                  currency: "VND",
                                }).format(appointment.bookingFee)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${getStatusBadgeClass(
                              appointment.status
                            )}`}
                          >
                            {appointment.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* View button */}
                            <button
                              onClick={() => navigate(`/doctor/appointments/${appointment.appointmentId}`)}
                              className="text-blue-600 hover:text-blue-900 flex items-center gap-1 text-xs transition"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </button>



                            

                            {appointment.status === "SCHEDULED" && (
                              <>
                                <button
                                  onClick={() => changeStatus(appointment.appointmentId, "IN_PROGRESS")}
                                  disabled={!canStart}
                                  className={`text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded transition ${!canStart ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-200'}`}
                                  title={!canStart ? 'Cannot start yet: appointments can only be started within 5 minutes of scheduled time' : 'Start processing - meeting in progress'}
                                >
                                  Start
                                </button>
                              </>
                            )}

                            {(appointment.status === "IN_PROGRESS" || appointment.status === "IN-PROGRESS") && (
                              <>
                                {/* Check if appointment duration exceeded 20 minutes */}
                                {(() => {
                                  const now = new Date();
                                  const startTime = new Date(appointment.startDateTime);
                                  const durationMs = now.getTime() - startTime.getTime();
                                  const durationMinutes = durationMs / (1000 * 60);
                                  const exceeds20Min = durationMinutes > 20;

                                  return (
                                    <>
                                      <button
                                        onClick={() => changeStatus(appointment.appointmentId, "COMPLETED")}
                                        className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition"
                                        // THÊM TITLE RÕ HƠN VỀ YÊU CẦU MEDICAL RECORD
                                        title="Mark as Completed (requires medical record)"
                                      >
                                        Complete
                                      </button>
                                      {exceeds20Min && (
                                        <button
                                          onClick={() => changeStatus(appointment.appointmentId, "CANCELED")}
                                          className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 transition animate-pulse"
                                          title="Meeting exceeded 20 minutes - recommend canceling"
                                        >
                                          ⚠️ Cancel
                                        </button>
                                      )}
                                    </>
                                  );
                                })()}
                              </>
                            )}

                            {appointment.status === "COMPLETED" && (
                              <span className="text-xs text-green-700 font-medium">✓ Completed</span>
                            )}

                            {appointment.status === "CANCELED" && (
                              <span className="text-xs text-red-700 font-medium">✗ Canceled</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                    }
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
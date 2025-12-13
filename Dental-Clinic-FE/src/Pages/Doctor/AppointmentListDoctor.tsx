import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Eye, Calendar, Clock, User, MapPin, Crown, DollarSign } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from "date-fns";

type DoctorAppointmentDTO = {
  appointmentId: number;
  clinic?: { id: number; clinicName: string };
  patient?: { id: number; patientCode: string; fullName: string; phone?: string; email?: string };
  doctor?: { id: number; fullName: string };
  room?: { id: number; roomName: string };
  chair?: { id: number; chairNumber: string };
  startDateTime: string;
  endDateTime: string;
  status: string;
  channel?: string;
  note?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  appointmentType?: string; // "VIP" hoặc "STANDARD"
  bookingFee?: number; // Phí đặt lịch hẹn
};

export default function AppointmentList() {
  const navigate = useNavigate();
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const accessToken = localStorage.getItem("accessToken");
  // read user object saved by login handlers (key: "user")
  const userInfo = JSON.parse(localStorage.getItem("user") || "null");
  const doctorId = userInfo?.doctorId || userInfo?.id || userInfo?.userId;

  const [appointments, setAppointments] = useState<DoctorAppointmentDTO[]>([]);
  const [loading, setLoading] = useState(true);
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

      // By default, doctors should only see these statuses
      const allowedStatusesForDoctor = ["SCHEDULED", "PROCESSING", "COMPLETED", "CANCELED"];

      // If no explicit status filter provided, restrict to allowed statuses
      if (!statusFilter) {
        filtered = filtered.filter((apt) => allowedStatusesForDoctor.includes(apt.status));
      } else {
        // If a status filter was chosen, ensure it's one of the allowed ones
        if (!allowedStatusesForDoctor.includes(statusFilter)) {
          // If user somehow selected an unsupported status, show none
          filtered = [];
        }
      }

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

      // Prevent doctors from setting status to RESCHEDULE
      if (newStatus?.toString().toUpperCase() === "RESCHEDULE") {
        toast.error("Doctors are not allowed to reschedule appointments.");
        return;
      }

      await axios.post(
        `${apiBase}/api/doctor/appointments/${appointmentId}/status?status=${newStatus}`,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      toast.success(`Appointment status changed to ${newStatus}`);
      fetchAppointments(); // Refresh list
    } catch (err) {
      console.error("Error changing status:", err);
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Failed to change appointment status");
      }
    }
  };

  const checkAndAutoComplete = (appointment: DoctorAppointmentDTO) => {
    const now = new Date();
    const endTime = new Date(appointment.endDateTime);
    // Auto-complete if past end time and not already completed
    if (now > endTime && appointment.status !== "COMPLETED") {
      changeStatus(appointment.appointmentId, "COMPLETED");
    }
  };

  const getStatusBadgeClass = (status: string) => {
    const s = status?.toLowerCase() || "";
    if (s === "pending") return "bg-yellow-100 text-yellow-800";
    if (s === "scheduled") return "bg-blue-100 text-blue-800";
    if (s === "processing") return "bg-purple-100 text-purple-800";
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
              </p>
            </div>
            <button
              onClick={() => navigate("/doctor/appointments/calendar")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              Calendar View
            </button>
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
                    className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => fetchAppointments()}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="PROCESSING">Progressing</option>
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
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="px-4 py-2 text-gray-700 border rounded hover:bg-gray-100"
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
                    {appointments.map((appointment) => (
                      <tr key={appointment.appointmentId} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="font-medium text-gray-900">
                                {format(new Date(appointment.startDateTime), "HH:mm")} -{" "}
                                {format(new Date(appointment.endDateTime), "HH:mm")}
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
                              className="text-blue-600 hover:text-blue-900 flex items-center gap-1 text-xs"
                            >
                              <Eye className="w-4 h-4" />
                              View
                            </button>

                            {/* Status transition buttons */}
                            {appointment.status === "PENDING" && (
                              <button
                                onClick={() => changeStatus(appointment.appointmentId, "SCHEDULED")}
                                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition"
                                title="Mark as Scheduled"
                              >
                                Schedule
                              </button>
                            )}

                            {appointment.status === "SCHEDULED" && (
                              <>
                                <button
                                  onClick={() => changeStatus(appointment.appointmentId, "PROCESSING")}
                                  className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition"
                                  title="Start processing - meeting in progress"
                                >
                                  Start
                                </button>
                              </>
                            )}

                            {appointment.status === "PROCESSING" && (
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
                                        title="Mark as Completed"
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
                    ))}
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


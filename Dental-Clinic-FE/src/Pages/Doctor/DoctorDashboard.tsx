import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Calendar,
  Clock,
  ArrowRight,
  CalendarDays,
  Crown,
  DollarSign,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { format } from "date-fns";
import type { DoctorAppointmentDTO } from "../types/doctor";



type DashboardStats = {
  todayAppointments: number;
  weekAppointments: number;

};

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const accessToken = localStorage.getItem("accessToken");
  const userInfo = JSON.parse(localStorage.getItem("user") || "{}");
  const doctorId = userInfo.userId || userInfo.id || userInfo.doctorId;

  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    weekAppointments: 0,

  });
  const [todayAppointments, setTodayAppointments] = useState<DoctorAppointmentDTO[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<DoctorAppointmentDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken || !doctorId) {
      toast.error("Please login");
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);

        // Fetch today's appointments
        try {
          const todayRes = await axios.get<DoctorAppointmentDTO[]>(
            `${apiBase}/api/doctor/appointments/${doctorId}/date-range`,
            {
              params: {
                startDate: today.toISOString().split("T")[0],
                endDate: tomorrow.toISOString().split("T")[0],
              },
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          const todayApts = todayRes.data || [];
          setTodayAppointments(todayApts.filter((apt) => apt.status !== "CANCELLED"));
          setStats((prev) => ({ ...prev, todayAppointments: todayApts.length }));
        } catch (err) {
          console.warn("Could not fetch today appointments:", err);
        }

        // Fetch week's appointments
        try {
          const weekRes = await axios.get<DoctorAppointmentDTO[]>(
            `${apiBase}/api/doctor/appointments/${doctorId}/date-range`,
            {
              params: {
                startDate: today.toISOString().split("T")[0],
                endDate: weekEnd.toISOString().split("T")[0],
              },
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          setStats((prev) => ({ ...prev, weekAppointments: (weekRes.data || []).length }));
        } catch (err) {
          console.warn("Could not fetch week appointments:", err);
        }

        // Fetch upcoming appointments (next 3 days)
        try {
          const upcomingEnd = new Date(today);
          upcomingEnd.setDate(upcomingEnd.getDate() + 3);
          const upcomingRes = await axios.get<DoctorAppointmentDTO[]>(
            `${apiBase}/api/doctor/appointments/${doctorId}/date-range`,
            {
              params: {
                startDate: today.toISOString().split("T")[0],
                endDate: upcomingEnd.toISOString().split("T")[0],
              },
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          setUpcomingAppointments(
            (upcomingRes.data || [])
              .filter((apt) => apt.status !== "CANCELLED")
              .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
              .slice(0, 5)
          );
        } catch (err) {
          console.warn("Could not fetch upcoming appointments:", err);
        }

      
      } catch (err: unknown) {
        console.error("Error fetching dashboard data:", err);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [apiBase, accessToken, doctorId]);

  const getStatusBadgeClass = (status: string) => {
    const s = status?.toLowerCase() || "";
    if (s.includes("pending")) return "bg-yellow-100 text-yellow-800";
    if (s.includes("confirm")) return "bg-blue-100 text-blue-800";
    if (s.includes("complete") || s.includes("done")) return "bg-green-100 text-green-800";
    if (s.includes("cancel")) return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="p-6 min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-[#0D1B3E] mb-2">Doctor Dashboard</h1>
            <p className="text-gray-600">Welcome back! Here's your overview.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Today's Appointments</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.todayAppointments}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <CalendarDays className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">This Week</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.weekAppointments}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <Calendar className="w-8 h-8 text-green-600" />
                </div>
              </div>
            </div>

         

          
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Today's Appointments */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Today's Appointments</h2>
                <button
                  onClick={() => navigate("/doctor/appointments")}
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                >
                  View All
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              {todayAppointments.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No appointments today</div>
              ) : (
                <div className="space-y-3">
                  {todayAppointments.slice(0, 5).map((apt) => (
                    <div
                      key={apt.appointmentId}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                      onClick={() => navigate(`/doctor/appointments/${apt.appointmentId}`)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {format(new Date(apt.startDateTime), "HH:mm")} -{" "}
                            {format(new Date(apt.endDateTime ?? apt.startDateTime), "HH:mm")}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {apt.patient?.fullName || "Unknown"} ({apt.patient?.patientCode || "N/A"})
                        </div>
                        <div className="text-xs text-gray-500">
                          {apt.service?.serviceName || "N/A"}
                          {apt.serviceVariant && ` • ${apt.serviceVariant.variantName}`}
                        </div>
                        <div className="text-xs text-gray-500">
                          {apt.clinic?.clinicName || "N/A"} • {apt.room?.roomName || "N/A"}
                        </div>
                        {(apt.appointmentType || apt.bookingFee !== undefined) && (
                          <div className="flex items-center gap-2 mt-1">
                            {apt.appointmentType && (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                                  apt.appointmentType === "VIP"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {apt.appointmentType === "VIP" && (
                                  <Crown className="w-2.5 h-2.5 text-purple-600" />
                                )}
                                {apt.appointmentType}
                              </span>
                            )}
                            {apt.bookingFee !== undefined && apt.bookingFee !== null && (
                              <span className="text-xs text-gray-600 flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                {new Intl.NumberFormat("vi-VN", {
                                  style: "currency",
                                  currency: "VND",
                                }).format(apt.bookingFee)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(
                          apt.status
                        )}`}
                      >
                        {apt.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Appointments */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Upcoming Appointments</h2>
                <button
                  onClick={() => navigate("/doctor/appointments")}
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                >
                  View All
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              {upcomingAppointments.length === 0 ? (
                <div className="text-center text-gray-500 py-8">No upcoming appointments</div>
              ) : (
                <div className="space-y-3">
                  {upcomingAppointments.map((apt) => (
                    <div
                      key={apt.appointmentId}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                      onClick={() => navigate(`/doctor/appointments/${apt.appointmentId}`)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {format(new Date(apt.startDateTime), "MMM dd, HH:mm")}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {apt.patient?.fullName || "Unknown"} ({apt.patient?.patientCode || "N/A"})
                        </div>
                        <div className="text-xs text-gray-500">
                          {apt.service?.serviceName || "N/A"}
                          {apt.serviceVariant && ` • ${apt.serviceVariant.variantName}`}
                        </div>
                        {(apt.appointmentType || apt.bookingFee !== undefined) && (
                          <div className="flex items-center gap-2 mt-1">
                            {apt.appointmentType && (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                                  apt.appointmentType === "VIP"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {apt.appointmentType === "VIP" && (
                                  <Crown className="w-2.5 h-2.5 text-purple-600" />
                                )}
                                {apt.appointmentType}
                              </span>
                            )}
                            {apt.bookingFee !== undefined && apt.bookingFee !== null && (
                              <span className="text-xs text-gray-600 flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                {new Intl.NumberFormat("vi-VN", {
                                  style: "currency",
                                  currency: "VND",
                                }).format(apt.bookingFee)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(
                          apt.status
                        )}`}
                      >
                        {apt.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

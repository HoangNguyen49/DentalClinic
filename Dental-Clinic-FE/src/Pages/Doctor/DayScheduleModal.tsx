import { useEffect, useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import { XCircle, Clock, FileText } from "lucide-react";
import { toast } from "react-toastify";
import type { DoctorAppointmentDTO } from "../types/doctor";

type Props = {
  isOpen: boolean;
  date: Date | null;
  onClose: () => void;
  apiBase: string;
  accessToken: string | null;
  doctorId?: number | string | undefined;
};

export default function DayScheduleModal({ isOpen, date, onClose, apiBase, accessToken, doctorId }: Props) {
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState<DoctorAppointmentDTO[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const fetch = async () => {
      if (!date || !accessToken || !doctorId) return;
      setLoading(true);
      const dateStr = format(date, "yyyy-MM-dd");
      try {
        type DaySchedule = { appointments?: DoctorAppointmentDTO[]; appointmentList?: DoctorAppointmentDTO[] };
        const resp = await axios.get<DaySchedule[]>(`${apiBase}/api/doctor/my-schedule/day/${dateStr}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        console.debug('my-schedule/day resp', resp.status, resp.data);

        // If server returns schedules with appointments inside, flatten them
        const data = resp.data || [] as DaySchedule[];
        // Try to extract appointments if present
        let appts: DoctorAppointmentDTO[] = [];
        if (Array.isArray(data)) {
          data.forEach((s: DaySchedule) => {
            if (Array.isArray(s.appointments)) appts = appts.concat(s.appointments as DoctorAppointmentDTO[]);
            if (Array.isArray(s.appointmentList)) appts = appts.concat(s.appointmentList as DoctorAppointmentDTO[]);
          });
        }

        // If no appointments found in my-schedule response, try explicit appointments endpoints
        if (appts.length === 0) {
          // First try an appointments-per-day endpoint if available
          try {
            const rrDay = await axios.get<DoctorAppointmentDTO[]>(`${apiBase}/api/doctor/appointments/${doctorId}/day/${dateStr}`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            appts = rrDay.data || [];
          } catch (dayErr: unknown) {
            console.debug('appointments/day fallback failed', dayErr);
            // Fallback to date-range endpoint (existing behavior)
            try {
              const startDate = dateStr;
              const endDate = dateStr;
              const rr = await axios.get<DoctorAppointmentDTO[]>(`${apiBase}/api/doctor/appointments/${doctorId}/date-range`, {
                params: { startDate, endDate },
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              appts = rr.data || [];
            } catch (rangeErr: unknown) {
              console.debug('appointments/date-range fallback failed', rangeErr);
            }
          }
        }

        setAppointments(appts);
      } catch (err: unknown) {
        const respData = (err as any)?.response?.data ?? err;
        console.error("Error fetching day schedule:", respData);
        toast.error((respData && respData.message) ? respData.message : "Failed to load day details");
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [isOpen, date, apiBase, accessToken, doctorId]);

  const formatTimeRange = (a: DoctorAppointmentDTO) => {
    try {
      const start = new Date(a.startDateTime);
      const end = new Date(a.endDateTime ?? a.startDateTime);
      const startStr = format(start, "HH:mm");
      const endStr = format(end, "HH:mm");
      return `${startStr} - ${endStr}`;
    } catch {
      return "-";
    }
  };

  const getStatusBadgeClass = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "scheduled" || s === "confirmed") return "bg-blue-100 text-blue-800";
    if (s === "processing" || s === "in_progress" || s === "in-progress") return "bg-yellow-100 text-yellow-800";
    if (s === "completed") return "bg-green-100 text-green-800";
    if (s === "noshow" || s === "no_show") return "bg-red-100 text-red-800";
    if (s === "cancelled" || s === "canceled") return "bg-red-50 text-red-700";
    return "bg-gray-100 text-gray-800";
  };

  // Sort with SCHEDULED first, then by time
  const sorted = [...appointments].sort((a, b) => {
    const order = ["SCHEDULED", "CONFIRMED", "PROCESSING", "IN_PROGRESS", "COMPLETED", "NOSHOW", "CANCELED"];
    const sa = (a.status || "").toString().toUpperCase();
    const sb = (b.status || "").toString().toUpperCase();
    const ia = order.includes(sa) ? order.indexOf(sa) : order.length;
    const ib = order.includes(sb) ? order.indexOf(sb) : order.length;
    if (ia !== ib) return ia - ib;
    return new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime();
  });

  if (!isOpen || !date) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center p-6 bg-black/40">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold">Appointments — {format(date, "dd MMM yyyy")}</h3>
            <p className="text-sm text-gray-500 mt-1">Showing appointments for the selected date (SCHEDULED prioritized)</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {loading && <div className="text-sm text-gray-500">Loading...</div>}

          {!loading && sorted.length === 0 && (
            <div className="text-center text-gray-500 p-6">No appointments for this date</div>
          )}

          {!loading && sorted.map((apt) => (
            <div key={apt.appointmentId} className="border border-blue-50 bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <div className="text-sm font-semibold">{formatTimeRange(apt)}</div>
                  </div>

                  <div className="text-gray-700 font-medium capitalize">{apt.patient?.fullName || 'N/A'} <span className="text-xs text-gray-500 ml-2">({apt.patient?.patientCode || '-'})</span></div>
                  <div className="text-sm text-gray-600 mt-1">Service: {apt.service?.serviceName || '-'}</div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(apt.status || '')}`}>
                    {apt.status}
                  </div>
                  <button
                    onClick={() => window.location.assign(`/doctor/appointments/${apt.appointmentId}`)}
                    className="text-sm text-blue-600 hover:underline flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Click to view details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

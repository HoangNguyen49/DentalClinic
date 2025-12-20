import { useEffect, useState } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, DoorOpen, FileText, Crown, DollarSign } from "lucide-react";
import { toast } from "react-toastify";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from "date-fns";
import type { DoctorAppointmentDTO } from "../types/doctor";

type ClinicResponse = {
  id: number;
  clinicName: string;
};

type RoomResponse = {
  id: number;
  roomName: string;
  clinicId?: number;
  clinicName?: string;
};

type DoctorScheduleDto = {
  id: number;
  doctor: unknown;
  clinic: ClinicResponse | null;
  room: RoomResponse | null;
  workDate: string;
  startTime: string;
  endTime: string;
  status: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
};

export default function MySchedule() {
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const accessToken = localStorage.getItem("accessToken");

  const [schedules, setSchedules] = useState<DoctorScheduleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  // UI mode: false = show single day (Today by default), true = show entire week
  const [showWeek, setShowWeek] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Appointments fetched per-date (keyed by YYYY-MM-DD)
  const [appointmentsMap, setAppointmentsMap] = useState<Record<string, DoctorAppointmentDTO[]>>({});
  const [apptsLoading, setApptsLoading] = useState(false);

  // derive doctorId from stored user (same pattern used in other pages)
  const userInfo = JSON.parse(localStorage.getItem("user") || "null");
  const doctorId = userInfo?.doctorId || userInfo?.id || userInfo?.userId;

  // Format date to YYYY-MM-DD
  const formatDateString = (date: Date): string => {
    return format(date, "yyyy-MM-dd");
  };

  // Format time from "HH:mm:ss" to "HH:mm"
  const formatTime = (time: string): string => {
    if (!time) return "";
    return time.substring(0, 5);
  };

  // Get week days (Monday to Saturday)
  const getWeekDays = (monday: Date): Date[] => {
    const days: Date[] = [];
    for (let i = 0; i < 6; i++) {
      days.push(addDays(monday, i));
    }
    return days;
  };

  // Fetch week schedule from API
  const fetchWeekSchedule = async (weekStartDate: Date) => {
    setLoading(true);
    try {
      const weekStartStr = formatDateString(weekStartDate);
      const response = await axios.get<DoctorScheduleDto[]>(
        `${apiBase}/api/doctor/my-schedule/${weekStartStr}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          withCredentials: true,
        }
      );
      setSchedules(response.data || []);
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: unknown } })?.response;
      console.error("Error fetching schedule:", resp ?? err);
      const data = resp?.data as Record<string, unknown> | undefined;
      const errorMsg = (data && ((data['message'] as string) || (data['error'] as string))) || (err as Error)?.message || "Failed to load work schedule";
      toast.error(errorMsg);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch single-day schedule (for Today mode)
  const fetchDaySchedule = async (date: Date) => {
    setLoading(true);
    try {
      const dateStr = formatDateString(date);
      const response = await axios.get<DoctorScheduleDto[]>(`${apiBase}/api/doctor/my-schedule/day/${dateStr}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        withCredentials: true,
      });
      setSchedules(response.data || []);
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: unknown } })?.response;
      console.error("Error fetching day schedule:", resp ?? err);
      const data = resp?.data as Record<string, unknown> | undefined;
      const errorMsg = (data && ((data['message'] as string) || (data['error'] as string))) || (err as Error)?.message || "Failed to load work schedule for the day";
      toast.error(errorMsg);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!doctorId) return;

    // Fetch appointments depending on mode
    const fetchApptsForDay = async (date: Date) => {
      setApptsLoading(true);
      try {
        const dateStr = formatDateString(date);
        const res = await axios.get<DoctorAppointmentDTO[]>(`${apiBase}/api/doctor/appointments/${doctorId}/day/${dateStr}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        setAppointmentsMap((prev) => ({ ...prev, [dateStr]: res.data || [] }));
      } catch (err) {
        console.debug('fetchApptsForDay failed', date, err);
        setAppointmentsMap((prev) => ({ ...prev, [formatDateString(date)]: [] }));
      } finally {
        setApptsLoading(false);
      }
    };

    const fetchApptsForWeek = async (weekStartDate: Date) => {
      setApptsLoading(true);
      try {
        const start = formatDateString(weekStartDate);
        const end = formatDateString(addDays(weekStartDate, 5));
        const res = await axios.get<DoctorAppointmentDTO[]>(`${apiBase}/api/doctor/appointments/${doctorId}/date-range`, {
          params: { startDate: start, endDate: end },
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const grouped: Record<string, DoctorAppointmentDTO[]> = {};
        (res.data || []).forEach((a) => {
          const d = new Date(a.startDateTime).toISOString().split('T')[0];
          grouped[d] = grouped[d] || [];
          grouped[d].push(a);
        });
        setAppointmentsMap(grouped);
      } catch (err) {
        console.debug('fetchApptsForWeek failed', err);
        setAppointmentsMap({});
      } finally {
        setApptsLoading(false);
      }
    };

    if (showWeek) {
      fetchApptsForWeek(weekStart);
    } else {
      fetchApptsForDay(selectedDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId, weekStart, showWeek, selectedDate]);

  // Fetch schedules when weekStart/selectedDate/mode changes
  useEffect(() => {
    if (showWeek) {
      fetchWeekSchedule(weekStart);
    } else {
      fetchDaySchedule(selectedDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showWeek, weekStart, selectedDate]);



  // Go to previous week
  const handlePreviousWeek = () => {
    setWeekStart(subWeeks(weekStart, 1));
  };

  // Go to next week
  const handleNextWeek = () => {
    setWeekStart(addWeeks(weekStart, 1));
  };

  // Go to current week
  const handleCurrentWeek = () => {
    setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  // Get schedule for a specific day
  const getSchedulesForDate = (date: Date): DoctorScheduleDto[] => {
    const dateStr = formatDateString(date);
    return schedules.filter((schedule) => schedule.workDate === dateStr);
  };

  // Sort schedule by time
  const sortSchedulesByTime = (schedules: DoctorScheduleDto[]): DoctorScheduleDto[] => {
    return [...schedules].sort((a, b) => {
      const timeA = a.startTime || "00:00";
      const timeB = b.startTime || "00:00";
      return timeA.localeCompare(timeB);
    });
  };

  // Get day name
  const getDayName = (date: Date): string => {
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return dayNames[date.getDay()];
  };

  const weekDays = getWeekDays(weekStart);
  const today = new Date();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#0D1B3E] mb-2">My Work Schedule</h1>
              <p className="text-gray-600">View and manage your work schedule</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setShowWeek(false); setSelectedDate(new Date()); }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition ${!showWeek ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
              >
                Today
              </button>
              <button
                onClick={() => { setShowWeek(true); setWeekStart(startOfWeek(selectedDate, { weekStartsOn: 1 })); }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition ${showWeek ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
              >
                Show all week
              </button>
              <button
                onClick={() => { setShowWeek(true); handleCurrentWeek(); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                This Week
              </button>
            </div>
          </div>
        </div>

        {/* Week / Day Navigation */}
        {showWeek ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between">
              <button
                onClick={handlePreviousWeek}
                disabled={loading}
                className="p-2 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-800">
                  {format(weekStart, "dd MMM yyyy")} - {" "}
                  {format(addDays(weekStart, 5), "dd MMM yyyy")}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Week {format(weekStart, "w")} - {format(weekStart, "yyyy")}
                </p>
              </div>
              <button
                onClick={handleNextWeek}
                disabled={loading}
                className="p-2 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedDate(addDays(selectedDate, -1))}
                disabled={loading}
                className="p-2 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-800">{format(selectedDate, "dd MMM yyyy")}</h2>
                <p className="text-sm text-gray-500 mt-1">{getDayName(selectedDate)}</p>
              </div>
              <button
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                disabled={loading}
                className="p-2 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading work schedule...</p>
          </div>
        )}

        {/* Schedule Content */}
        {!loading && (
          <div className="space-y-4">
            {showWeek ? (
              <>
                {weekDays.map((day, index) => {
                  const daySchedules = sortSchedulesByTime(getSchedulesForDate(day));
                  const isToday = isSameDay(day, today);
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                  return (
                    <div
                      key={index}
                      className={`bg-white rounded-xl shadow-sm border-2 ${
                        isToday ? "border-blue-500" : "border-gray-200"
                      } overflow-hidden`}
                    >
                      {/* Day Header */}
                      <div
                        className={`px-6 py-4 border-b ${
                          isToday ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Calendar
                              className={`h-5 w-5 ${isToday ? "text-blue-600" : "text-gray-500"}`}
                            />
                            <div>
                              <h3 className={`text-lg font-semibold ${isToday ? "text-blue-900" : "text-gray-800"}`}>
                                {getDayName(day)} - {format(day, "dd/MM/yyyy")}
                              </h3>
                            </div>
                            {isToday && (
                              <span className="px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded">
                                Today
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {daySchedules.length > 0 ? `${daySchedules.length} shifts` : "No shifts"}
                          </div>
                        </div>
                      </div>

                      {/* Day Content */}
                      <div className="p-6">
                        {daySchedules.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-gray-400">
                              {isWeekend ? "Weekend - No shifts" : "No work schedule for this day"}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {daySchedules.map((schedule) => (
                              <div
                                key={schedule.id}
                                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    {/* Time */}
                                    <div className="flex items-center gap-2 mb-3">
                                      <Clock className="h-4 w-4 text-gray-500" />
                                      <span className="text-lg font-semibold text-gray-800">
                                        {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                                      </span>
                                    </div>

                                    {/* Clinic and Room */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                      {schedule.clinic && (
                                        <div className="flex items-center gap-2">
                                          <MapPin className="h-4 w-4 text-blue-600" />
                                          <span className="text-sm text-gray-700">
                                            <span className="font-medium">Clinic:</span> {schedule.clinic.clinicName}
                                          </span>
                                        </div>
                                      )}
                                      {schedule.room && (
                                        <div className="flex items-center gap-2">
                                          <DoorOpen className="h-4 w-4 text-green-600" />
                                          <span className="text-sm text-gray-700">
                                            <span className="font-medium">Room:</span> {schedule.room.roomName}
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Status */}
                                    {schedule.status && (
                                      <div className="mb-3">
                                        <span
                                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                                            schedule.status.toLowerCase() === "active"
                                              ? "bg-green-100 text-green-800"
                                              : schedule.status.toLowerCase() === "cancelled"
                                              ? "bg-red-100 text-red-800"
                                              : "bg-gray-100 text-gray-800"
                                          }`}
                                        >
                                          {schedule.status}
                                        </span>
                                      </div>
                                    )}

                                    {/* Note */}
                                    {schedule.note && (
                                      <div className="flex items-start gap-2 mt-3 pt-3 border-t border-gray-200">
                                        <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                                        <div>
                                          <span className="text-xs font-medium text-gray-600">Note:</span>
                                          <p className="text-sm text-gray-700 mt-1">{schedule.note}</p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}

                            {/* Appointments for this day */}
                            {(appointmentsMap[format(day, 'yyyy-MM-dd')] || []).length > 0 ? (
                              <div className="mt-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Appointments</h4>
                                <div className="space-y-3">
                                  {(appointmentsMap[format(day, 'yyyy-MM-dd')] || []).map((apt) => (
                                    <div key={apt.appointmentId} className="flex items-center justify-between border border-gray-100 rounded-lg p-3">
                                      <div className="flex items-center gap-3">
                                        <div className="flex-shrink-0 text-sm font-medium w-20">
                                          <div>{format(new Date(apt.startDateTime), 'HH:mm')}</div>
                                          <div className="text-xs text-gray-500">{format(new Date(apt.startDateTime), 'dd/MM/yyyy')}</div>
                                        </div>

                                        <div>
                                          <div className="flex items-center gap-2">
                                            <div className="text-sm font-medium text-gray-900">{apt.patient?.fullName || 'N/A'}</div>
                                            {apt.appointmentType === 'VIP' && (
                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                                                <Crown className="w-3 h-3 text-purple-600" />
                                                VIP
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-xs text-gray-500">{apt.patient?.patientCode || ''}</div>
                                          <div className="text-xs text-gray-500 mt-1">
                                            {apt.service?.serviceName || apt.appointmentServices?.[0]?.service?.serviceName || ''}
                                            {apt.serviceVariant?.variantName && (
                                              <span className="ml-2 text-xs text-gray-500">{apt.serviceVariant.variantName}</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-4">
                                        <div className="text-sm text-gray-700">
                                          {apt.bookingFee !== undefined && apt.bookingFee !== null ? (
                                            <div className="flex items-center gap-1">
                                              <DollarSign className="w-4 h-4 text-gray-400" />
                                              <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(apt.bookingFee)}</span>
                                            </div>
                                          ) : (
                                            <span className="text-gray-400">-</span>
                                          )}
                                        </div>
                                        <div className="text-sm text-blue-600 hover:underline cursor-pointer" onClick={() => window.location.assign(`/doctor/appointments/${apt.appointmentId}`)}>View</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : apptsLoading ? (
                              <div className="text-sm text-gray-500 mt-4">Loading appointments...</div>
                            ) : null}

                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              // Single day view
              (() => {
                const day = selectedDate;
                const daySchedules = sortSchedulesByTime(getSchedulesForDate(day));
                const isToday = isSameDay(day, today);
                const isWeekend = day.getDay() === 0 || day.getDay() === 6;

                return (
                  <div key={format(day, "yyyy-MM-dd")} className={`bg-white rounded-xl shadow-sm border-2 ${isToday ? "border-blue-500" : "border-gray-200"} overflow-hidden`}>
                    <div className={`px-6 py-4 border-b ${isToday ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Calendar className={`h-5 w-5 ${isToday ? "text-blue-600" : "text-gray-500"}`} />
                          <div>
                            <h3 className={`text-lg font-semibold ${isToday ? "text-blue-900" : "text-gray-800"}`}>
                              {getDayName(day)} - {format(day, "dd/MM/yyyy")}
                            </h3>
                          </div>
                          {isToday && (
                            <span className="px-2 py-1 text-xs font-medium bg-blue-600 text-white rounded">Today</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">{daySchedules.length > 0 ? `${daySchedules.length} shifts` : "No shifts"}</div>
                      </div>
                    </div>

                    <div className="p-6">
                      {daySchedules.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-400">{isWeekend ? "Weekend - No shifts" : "No work schedule for this day"}</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {daySchedules.map((schedule) => (
                            <div key={schedule.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Clock className="h-4 w-4 text-gray-500" />
                                    <span className="text-lg font-semibold text-gray-800">{formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}</span>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                    {schedule.clinic && (
                                      <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-blue-600" />
                                        <span className="text-sm text-gray-700"><span className="font-medium">Clinic:</span> {schedule.clinic.clinicName}</span>
                                      </div>
                                    )}
                                    {schedule.room && (
                                      <div className="flex items-center gap-2">
                                        <DoorOpen className="h-4 w-4 text-green-600" />
                                        <span className="text-sm text-gray-700"><span className="font-medium">Room:</span> {schedule.room.roomName}</span>
                                      </div>
                                    )}
                                  </div>

                                  {schedule.status && (
                                    <div className="mb-3">
                                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${schedule.status.toLowerCase() === "active" ? "bg-green-100 text-green-800" : schedule.status.toLowerCase() === "cancelled" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}>{schedule.status}</span>
                                    </div>
                                  )}

                                  {schedule.note && (
                                    <div className="flex items-start gap-2 mt-3 pt-3 border-t border-gray-200">
                                      <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                                      <div>
                                        <span className="text-xs font-medium text-gray-600">Note:</span>
                                        <p className="text-sm text-gray-700 mt-1">{schedule.note}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}

                          {/* Appointments for this day */}
                          {(appointmentsMap[format(selectedDate, 'yyyy-MM-dd')] || []).length > 0 ? (
                            <div className="mt-4">
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">Appointments</h4>
                              <div className="space-y-3">
                                {(appointmentsMap[format(selectedDate, 'yyyy-MM-dd')] || []).map((apt) => (
                                  <div key={apt.appointmentId} className="flex items-center justify-between border border-gray-100 rounded-lg p-3">
                                    <div className="flex items-center gap-3">
                                      <div className="flex-shrink-0 text-sm font-medium w-20">
                                        <div>{format(new Date(apt.startDateTime), 'HH:mm')}</div>
                                        <div className="text-xs text-gray-500">{format(new Date(apt.startDateTime), 'dd/MM/yyyy')}</div>
                                      </div>

                                      <div>
                                        <div className="flex items-center gap-2">
                                          <div className="text-sm font-medium text-gray-900">{apt.patient?.fullName || 'N/A'}</div>
                                          {apt.appointmentType === 'VIP' && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                                              <Crown className="w-3 h-3 text-purple-600" />
                                              VIP
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-xs text-gray-500">{apt.patient?.patientCode || ''}</div>
                                        <div className="text-xs text-gray-500 mt-1">
                                          {apt.service?.serviceName || apt.appointmentServices?.[0]?.service?.serviceName || ''}
                                          {apt.serviceVariant?.variantName && (
                                            <span className="ml-2 text-xs text-gray-500">{apt.serviceVariant.variantName}</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                      <div className="text-sm text-gray-700">
                                        {apt.bookingFee !== undefined && apt.bookingFee !== null ? (
                                          <div className="flex items-center gap-1">
                                            <DollarSign className="w-4 h-4 text-gray-400" />
                                            <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(apt.bookingFee)}</span>
                                          </div>
                                        ) : (
                                          <span className="text-gray-400">-</span>
                                        )}
                                      </div>
                                      <div className="text-sm text-blue-600 hover:underline cursor-pointer" onClick={() => window.location.assign(`/doctor/appointments/${apt.appointmentId}`)}>View</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : apptsLoading ? (
                            <div className="text-sm text-gray-500 mt-4">Loading appointments...</div>
                          ) : null}

                        </div>
                      )}
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && schedules.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">{showWeek ? "No work schedule for this week" : "No work schedule for this day"}</p>
            <p className="text-gray-400 text-sm">Please contact HR to be assigned a work schedule</p>
          </div>
        )}
      </div>
    </div>
  );
}
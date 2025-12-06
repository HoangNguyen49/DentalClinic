import { useEffect, useState } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, DoorOpen, FileText } from "lucide-react";
import { toast } from "react-toastify";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from "date-fns";

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
  doctor: any;
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

  // Fetch schedule from API
  const fetchSchedule = async (weekStartDate: Date) => {
    setLoading(true);
    try {
      const weekStartStr = formatDateString(weekStartDate);
      const response = await axios.get<DoctorScheduleDto[]>(
        `${apiBase}/api/hr/my-schedule/${weekStartStr}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          withCredentials: true,
        }
      );
      setSchedules(response.data || []);
    } catch (err: any) {
      console.error("Error fetching schedule:", err);
      const errorMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to load work schedule";
      toast.error(errorMsg);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule(weekStart);
  }, [weekStart]);

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
                onClick={handleCurrentWeek}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                This Week
              </button>
            </div>
          </div>
        </div>

        {/* Week Navigation */}
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
                {format(weekStart, "dd MMM yyyy")} -{" "}
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
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && schedules.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No work schedule for this week</p>
            <p className="text-gray-400 text-sm">Please contact HR to be assigned a work schedule</p>
          </div>
        )}
      </div>
    </div>
  );
}


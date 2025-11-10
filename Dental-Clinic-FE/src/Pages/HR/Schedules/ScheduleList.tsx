import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Calendar, Plus, ChevronLeft, ChevronRight, Clock, Building2 } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type HrDocDto = {
  id: number;
  fullName: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  code?: string;
};

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

type ScheduleItem = {
  id: number;
  doctor: HrDocDto | null;
  clinic: ClinicResponse | null;
  room: RoomResponse | null;
  chair: any;
  workDate: string;
  startTime: string;
  endTime: string;
  status: string;
  note?: string;
};

// Lấy màu cho các block lịch làm việc
const getScheduleColor = (index: number): string => {
  const colors = [
    "bg-blue-100 text-blue-800 border-blue-200",
    "bg-orange-100 text-orange-800 border-orange-200",
    "bg-green-100 text-green-800 border-green-200",
    "bg-gray-100 text-gray-800 border-gray-200",
    "bg-purple-100 text-purple-800 border-purple-200",
    "bg-pink-100 text-pink-800 border-pink-200",
  ];
  return colors[index % colors.length];
};

function ScheduleList() {
  const navigate = useNavigate();
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const accessToken = localStorage.getItem("accessToken");

  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState<string>("");
  const [allClinics, setAllClinics] = useState<ClinicResponse[]>([]);

  useEffect(() => {
    // Hàm fetch toàn bộ clinics
    const fetchClinics = async () => {
      try {
        const response = await axios.get<ClinicResponse[]>(
          `${apiBase}/api/hr/management/clinics`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        setAllClinics(response.data || []);
      } catch (err) {
        console.error("Error fetching clinics:", err);
      }
    };

    // Hàm lấy ngày thứ 2 đầu tuần hiện tại
    const getMondayOfWeek = (date: Date): string => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      return monday.toISOString().split("T")[0];
    };

    const monday = getMondayOfWeek(new Date());
    setCurrentWeekStart(monday);
    fetchClinics();
    fetchSchedule(monday);
  }, []);

  // Gọi API lấy schedule cho 1 tuần, truyền vào là ngày đầu tuần (thứ 2)
  const fetchSchedule = async (weekStart: string) => {
    setLoading(true);
    try {
      const response = await axios.get<ScheduleItem[]>(
        `${apiBase}/api/hr/schedules/${weekStart}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setSchedules(response.data || []);
    } catch (err: any) {
      console.error("Error fetching schedule:", err);
      const errorMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Unable to load schedules";
      toast.error(errorMsg);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  // Hàm chuyển đổi tuần (prev/next)
  const navigateWeek = (direction: "prev" | "next") => {
    const current = new Date(currentWeekStart);
    const newDate = new Date(current);
    newDate.setDate(current.getDate() + (direction === "next" ? 7 : -7));
    const newWeekStart = newDate.toISOString().split("T")[0];
    setCurrentWeekStart(newWeekStart);
    fetchSchedule(newWeekStart);
  };

  // Hàm lấy danh sách ngày trong 1 tuần (Thứ 2 - Chủ Nhật)
  const getDaysOfWeek = (weekStart: string): Array<{ date: string; dayName: string; dayNum: number; isToday: boolean }> => {
    const [year, month, day] = weekStart.split("-").map(Number);
    const start = new Date(year, month - 1, day);
    const days: Array<{ date: string; dayName: string; dayNum: number; isToday: boolean }> = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayNames = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      const dayOfWeek = date.getDay();
      const dayName = dayNames[dayOfWeek === 0 ? 6 : dayOfWeek - 1];

      const dateOnly = new Date(date);
      dateOnly.setHours(0, 0, 0, 0);
      const isToday = dateOnly.getTime() === today.getTime();

      days.push({
        date: dateStr,
        dayName,
        dayNum: date.getDate(),
        isToday,
      });
    }
    return days;
  };

  const weekDays = currentWeekStart ? getDaysOfWeek(currentWeekStart) : [];

  // Gom lịch theo ngày
  const schedulesByDate = schedules.reduce((acc, schedule) => {
    const date = schedule.workDate;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(schedule);
    return acc;
  }, {} as Record<string, ScheduleItem[]>);

  // Sắp xếp schedule mỗi ngày theo thời gian
  Object.keys(schedulesByDate).forEach((date) => {
    schedulesByDate[date].sort((a, b) => {
      const timeA = a.startTime || "00:00";
      const timeB = b.startTime || "00:00";
      return timeA.localeCompare(timeB);
    });
  });

  // Lấy tên/tháng hiện tại để hiển thị ở header
  const getMonthAndDate = (weekStart: string): { month: string; shortMonth: string; date: string } => {
    const date = new Date(weekStart);
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const shortMonths = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    return {
      month: months[date.getMonth()],
      shortMonth: shortMonths[date.getMonth()],
      date: `${shortMonths[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`,
    };
  };

  const { month, date: headerDate } = currentWeekStart ? getMonthAndDate(currentWeekStart) : { month: "", date: "" };

  // Định dạng lại giờ để hiển thị
  const formatTime = (time: string): string => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading work schedules...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="p-6 min-h-screen bg-white">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-2xl font-semibold text-gray-900">{month}</div>
                <div className="text-sm text-gray-600">{headerDate}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateWeek("prev")}
                  className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  aria-label="Previous week"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => navigateWeek("next")}
                  className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  aria-label="Next week"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            <button
              onClick={() => navigate("/hr/schedules/create")}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Create New Schedule
            </button>
          </div>

          {weekDays.length === 0 ? (
            <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">
                No work schedules for this week
              </p>
              <button
                onClick={() => navigate("/hr/schedules/create")}
                className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                Create New Schedule
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="grid grid-cols-7 gap-0">
                {weekDays.map((day) => (
                  <div
                    key={day.date}
                    className="border-r border-gray-200 last:border-r-0 p-3 bg-gray-50"
                  >
                    <div className="text-center">
                      <div className="text-xs font-semibold text-gray-500 mb-1">
                        {day.dayName}
                      </div>
                      <div
                        className={`text-sm font-medium ${
                          day.isToday
                            ? "text-purple-600 border-b-2 border-purple-600 pb-1 inline-block"
                            : "text-gray-900"
                        }`}
                      >
                        {day.dayNum}
                      </div>
                    </div>
                  </div>
                ))}

                {weekDays.map((day) => {
                  const daySchedules = schedulesByDate[day.date] || [];
                  const isWeekend = day.dayName === "SAT" || day.dayName === "SUN";
                  // Lấy các clinic trong ngày đang làm việc
                  const workingClinicIds = new Set(
                    daySchedules
                      .map((s) => s.clinic?.id)
                      .filter((id): id is number => id !== null && id !== undefined)
                  );
                  // Tìm clinics đang đóng cửa trong ngày
                  const closedClinics = allClinics.filter(
                    (clinic) => !workingClinicIds.has(clinic.id)
                  );

                  return (
                    <div
                      key={day.date}
                      className="border-r border-t border-gray-200 last:border-r-0 min-h-[400px] bg-white relative"
                    >
                      {daySchedules.length === 0 ? (
                        isWeekend ? (
                          <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center text-gray-400 text-sm font-semibold">
                            No Sessions
                          </div>
                        ) : closedClinics.length === allClinics.length && allClinics.length > 0 ? (
                          <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center text-gray-400 text-sm font-semibold">
                            No Sessions
                          </div>
                        ) : closedClinics.length > 0 ? (
                          <div className="absolute left-0 right-0 top-[75%] -translate-y-1/2 flex justify-center">
                            <div className="text-center">
                              {closedClinics.map((clinic) => (
                                <div
                                  key={clinic.id}
                                  className="text-gray-400 text-sm font-semibold"
                                >
                                  {clinic.clinicName} - Off
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-300 text-sm"></div>
                        )
                      ) : closedClinics.length > 0 ? (
                        <div className="p-2 flex flex-col gap-2">
                          {daySchedules.map((schedule, index) => (
                            <div
                              key={schedule.id}
                              className={`rounded-lg p-3 border ${getScheduleColor(index)} shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
                            >
                              <div className="font-semibold text-sm mb-1 truncate">
                                {schedule.doctor?.fullName || `Doctor #${schedule.id}`}
                              </div>
                              <div className="text-xs mb-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                                </span>
                              </div>
                              {schedule.clinic && (
                                <div className="text-xs mb-1 flex items-center gap-1 truncate">
                                  <Building2 className="w-3 h-3" />
                                  <span className="truncate">{schedule.clinic.clinicName}</span>
                                </div>
                              )}
                              {schedule.room && (
                                <div className="text-xs text-gray-600 truncate">
                                  {schedule.room.roomName}
                                </div>
                              )}
                            </div>
                          ))}
                          <div className="absolute left-0 right-0 top-[75%] -translate-y-1/2 flex justify-center pointer-events-none">
                            <div className="text-center">
                              {closedClinics.map((clinic) => (
                                <div
                                  key={clinic.id}
                                  className="text-gray-400 text-sm font-semibold"
                                >
                                  {clinic.clinicName} - Off
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2 flex flex-col gap-2">
                          {daySchedules.map((schedule, index) => (
                            <div
                              key={schedule.id}
                              className={`rounded-lg p-3 border ${getScheduleColor(index)} shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
                            >
                              <div className="font-semibold text-sm mb-1 truncate">
                                {schedule.doctor?.fullName || `Doctor #${schedule.id}`}
                              </div>
                              <div className="text-xs mb-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                                </span>
                              </div>
                              {schedule.clinic && (
                                <div className="text-xs mb-1 flex items-center gap-1 truncate">
                                  <Building2 className="w-3 h-3" />
                                  <span className="truncate">{schedule.clinic.clinicName}</span>
                                </div>
                              )}
                              {schedule.room && (
                                <div className="text-xs text-gray-600 truncate">
                                  {schedule.room.roomName}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default ScheduleList;

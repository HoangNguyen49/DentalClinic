import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from "react-i18next";
import DailyScheduleView from "./DailyScheduleView";
import WeeklyScheduleView from "./WeeklyScheduleView";

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

function ScheduleList() {
  const { t, i18n } = useTranslation("schedules");
  const navigate = useNavigate();
  const location = useLocation();
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const accessToken = localStorage.getItem("accessToken");

  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("daily");
  const [doctorDepartmentMap, setDoctorDepartmentMap] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    // Lấy danh sách clinic cho các ứng dụng liên quan
    const fetchClinics = async () => {
      try {
        await axios.get<ClinicResponse[]>(
          `${apiBase}/api/hr/management/clinics`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
      } catch (err) {
        console.error("Error fetching clinics:", err);
      }
    };

    // Lấy thông tin bác sĩ và map về phòng ban của từng bác sĩ
    const fetchDoctors = async () => {
      try {
        // Backend limit per page = 100, nên xử lý fetch nhiều trang nếu vượt quá
        const response = await axios.get<{
          content: Array<{
            id: number;
            department?: { id: number; departmentName: string };
          }>;
          totalElements: number;
        }>(`${apiBase}/api/hr/employees`, {
          params: {
            page: 0,
            size: 100,
            isActive: true
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const doctors = response.data?.content || [];
        const deptMap = new Map<number, string>();
        doctors.forEach((doctor: any) => {
          const deptName =
            doctor.department?.departmentName ||
            doctor.department?.name ||
            t("create.table.uncategorized");
          deptMap.set(doctor.id, deptName);
        });

        const totalElements = response.data?.totalElements || 0;
        if (totalElements > 100) {
          const totalPages = Math.ceil(totalElements / 100);
          for (let page = 1; page < totalPages; page++) {
            try {
              const nextResponse = await axios.get<{
                content: Array<{
                  id: number;
                  department?: { id: number; departmentName: string };
                }>;
              }>(`${apiBase}/api/hr/employees`, {
                params: {
                  page,
                  size: 100,
                  isActive: true
                },
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              });

              nextResponse.data?.content?.forEach((doctor: any) => {
                const deptName =
                  doctor.department?.departmentName ||
                  doctor.department?.name ||
                  t("create.table.uncategorized");
                deptMap.set(doctor.id, deptName);
              });
            } catch (err) {
              console.error(`Error fetching doctors page ${page}:`, err);
            }
          }
        }

        setDoctorDepartmentMap(deptMap);
      } catch (err) {
        console.error("Error fetching doctors:", err);
      }
    };

    // Lấy ngày thứ hai của tuần từ một ngày bất kỳ (dùng để xác định tuần hiện tại)
    const getMondayOfWeek = (date: Date): string => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      return monday.toISOString().split("T")[0];
    };

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const monday = getMondayOfWeek(today);
    setCurrentWeekStart(monday);
    setSelectedDate(todayStr);
    fetchClinics();
    fetchDoctors();
    // Ưu tiên hiển thị lịch theo ngày
    fetchSchedule(todayStr, "daily");
  }, []);

  useEffect(() => {
    // Kiểm tra refresh khi quay lại từ trang tạo mới
    const state = location.state as { refresh?: boolean; weekStart?: string } | null;

    if (state?.refresh) {
      // Nếu có weekStart từ trang tạo mới thì load lại tuần đó và bật weekly view
      if (state.weekStart) {
        setCurrentWeekStart(state.weekStart);
        setViewMode("weekly");
        setLoading(true);
        axios
          .get<ScheduleItem[]>(
            `${apiBase}/api/hr/schedules/${state.weekStart}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          )
          .then((response) => {
            setSchedules(response.data || []);
            setLoading(false);
          })
          .catch((err) => {
            console.error("Error fetching schedule:", err);
            const errorMsg =
              err?.response?.data?.message ||
              err?.response?.data?.error ||
              err?.message ||
              t("list.unableToLoad");
            toast.error(errorMsg);
            setSchedules([]);
            setLoading(false);
          });
      } else {
        // Nếu không có weekStart thì refresh lại chế độ hiện tại
        if (viewMode === "weekly" && currentWeekStart) {
          fetchSchedule(currentWeekStart, "weekly");
        } else if (viewMode === "daily" && selectedDate) {
          fetchSchedule(selectedDate, "daily");
        }
      }
      window.history.replaceState({}, document.title);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  // Lấy dữ liệu lịch làm việc
  const fetchSchedule = async (date: string, mode: "daily" | "weekly") => {
    setLoading(true);
    try {
      let url = "";
      if (mode === "daily") {
        url = `${apiBase}/api/hr/schedules/date/${date}`;
      } else {
        url = `${apiBase}/api/hr/schedules/${date}`;
      }
      const response = await axios.get<ScheduleItem[]>(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setSchedules(response.data || []);
    } catch (err: any) {
      console.error("Error fetching schedule:", err);
      const errorMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        t("list.unableToLoad");
      toast.error(errorMsg);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  // Chuyển sang tuần trước/tuần sau
  const navigateWeek = (direction: "prev" | "next") => {
    const current = new Date(currentWeekStart);
    const newDate = new Date(current);
    newDate.setDate(current.getDate() + (direction === "next" ? 7 : -7));
    const newWeekStart = newDate.toISOString().split("T")[0];
    setCurrentWeekStart(newWeekStart);
    fetchSchedule(newWeekStart, "weekly");
  };

  // Chuyển sang ngày trước/ngày sau
  const navigateDay = (direction: "prev" | "next") => {
    const current = new Date(selectedDate);
    const newDate = new Date(current);
    newDate.setDate(current.getDate() + (direction === "next" ? 1 : -1));
    const newDateStr = newDate.toISOString().split("T")[0];
    setSelectedDate(newDateStr);
    fetchSchedule(newDateStr, "daily");
  };

  // Đổi kiểu xem giữa daily/weekly
  const handleViewModeChange = (mode: "daily" | "weekly") => {
    setViewMode(mode);
    if (mode === "daily") {
      fetchSchedule(selectedDate, "daily");
    } else {
      fetchSchedule(currentWeekStart, "weekly");
    }
  };

  // Chọn ngày trong daily view
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    fetchSchedule(date, "daily");
  };

  // Trả về danh sách các ngày trong một tuần (bắt đầu từ thứ Hai)
  const getDaysOfWeek = (
    weekStart: string
  ): Array<{ date: string; dayName: string; dayNum: number; isToday: boolean }> => {
    const [year, month, day] = weekStart.split("-").map(Number);
    const start = new Date(year, month - 1, day);
    const days: Array<{ date: string; dayName: string; dayNum: number; isToday: boolean }> = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayNames = [
      t("list.days.mon"),
      t("list.days.tue"),
      t("list.days.wed"),
      t("list.days.thu"),
      t("list.days.fri"),
      t("list.days.sat"),
      t("list.days.sun"),
    ];

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

  // Trả về thông tin ngày đang chọn cho daily view
  const getSelectedDayInfo = () => {
    if (!selectedDate) return null;
    const date = new Date(selectedDate);
    const dayNames = [
      t("list.days.mon"),
      t("list.days.tue"),
      t("list.days.wed"),
      t("list.days.thu"),
      t("list.days.fri"),
      t("list.days.sat"),
      t("list.days.sun"),
    ];
    const dayOfWeek = date.getDay();
    const dayName = dayNames[dayOfWeek === 0 ? 6 : dayOfWeek - 1];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    const isToday = dateOnly.getTime() === today.getTime();

    return {
      date: selectedDate,
      dayName,
      dayNum: date.getDate(),
      isToday,
    };
  };

  const selectedDayInfo = getSelectedDayInfo();

  // Gom lịch theo ngày và bác sĩ
  type DoctorDaySchedule = {
    doctor: HrDocDto | null;
    morning?: ScheduleItem;
    afternoon?: ScheduleItem;
  };

  const schedulesByDateAndDoctor = schedules.reduce(
    (acc, schedule) => {
      const date = schedule.workDate;
      const doctorId = schedule.doctor?.id || schedule.id;

      if (!acc[date]) {
        acc[date] = {};
      }
      if (!acc[date][doctorId]) {
        acc[date][doctorId] = {
          doctor: schedule.doctor,
          morning: undefined,
          afternoon: undefined,
        };
      }

      // Phân loại ca sáng hoặc chiều dựa theo giờ bắt đầu
      const startTime = schedule.startTime || "00:00";
      if (startTime < "12:00") {
        acc[date][doctorId].morning = schedule;
      } else {
        acc[date][doctorId].afternoon = schedule;
      }

      return acc;
    },
    {} as Record<string, Record<number, DoctorDaySchedule>>
  );

  // Nhóm lịch theo department trong weekly view
  const schedulesByDate = Object.keys(schedulesByDateAndDoctor).reduce((acc, date) => {
    const doctorSchedules = Object.values(schedulesByDateAndDoctor[date]);

    // Gom nhóm theo phòng ban
    const schedulesByDept = doctorSchedules.reduce((deptAcc, docSchedule) => {
      const doctorId = docSchedule.doctor?.id;
      const deptName =
        doctorId
          ? doctorDepartmentMap.get(doctorId) || t("create.table.uncategorized")
          : t("create.table.uncategorized");

      if (!deptAcc[deptName]) {
        deptAcc[deptName] = [];
      }
      deptAcc[deptName].push(docSchedule);
      return deptAcc;
    }, {} as Record<string, DoctorDaySchedule[]>);

    acc[date] = Object.keys(schedulesByDept)
      .sort()
      .flatMap((deptName) => schedulesByDept[deptName]);

    return acc;
  }, {} as Record<string, DoctorDaySchedule[]>);

  // Lấy thông tin tên tháng, ngày đầy đủ để hiển thị ở header
  const getMonthAndDate = (
    weekStart: string
  ): { month: string; shortMonth: string; date: string } => {
    const date = new Date(weekStart);
    const months = [
      t("list.months.january"),
      t("list.months.february"),
      t("list.months.march"),
      t("list.months.april"),
      t("list.months.may"),
      t("list.months.june"),
      t("list.months.july"),
      t("list.months.august"),
      t("list.months.september"),
      t("list.months.october"),
      t("list.months.november"),
      t("list.months.december"),
    ];
    const shortMonths = [
      t("list.shortMonths.jan"),
      t("list.shortMonths.feb"),
      t("list.shortMonths.mar"),
      t("list.shortMonths.apr"),
      t("list.shortMonths.may"),
      t("list.shortMonths.jun"),
      t("list.shortMonths.jul"),
      t("list.shortMonths.aug"),
      t("list.shortMonths.sep"),
      t("list.shortMonths.oct"),
      t("list.shortMonths.nov"),
      t("list.shortMonths.dec"),
    ];
    return {
      month: months[date.getMonth()],
      shortMonth: shortMonths[date.getMonth()],
      date: date.toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    };
  };

  const { month, date: headerDate } = currentWeekStart
    ? getMonthAndDate(currentWeekStart)
    : { month: "", date: "" };

  // Định dạng giờ hợp lệ cho giao diện
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
          <p className="mt-4 text-gray-600">{t("list.loading")}</p>
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
                <div className="text-2xl font-semibold text-gray-900">
                  {viewMode === "weekly"
                    ? month
                    : selectedDayInfo
                    ? `${selectedDayInfo.dayName}, ${selectedDayInfo.dayNum}`
                    : ""}
                </div>
                <div className="text-sm text-gray-600">
                  {viewMode === "weekly"
                    ? headerDate
                    : selectedDayInfo
                    ? new Date(selectedDate).toLocaleDateString(
                        i18n.language === "vi" ? "vi-VN" : "en-US",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }
                      )
                    : ""}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {viewMode === "weekly" ? (
                  <>
                    <button
                      onClick={() => navigateWeek("prev")}
                      className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                      aria-label={t("list.previousWeek")}
                      title={t("list.previousWeek")}
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                      onClick={() => navigateWeek("next")}
                      className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                      aria-label={t("list.nextWeek")}
                      title={t("list.nextWeek")}
                    >
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => navigateDay("prev")}
                      className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                      aria-label={t("list.previousDay")}
                      title={t("list.previousDay")}
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                      onClick={() => navigateDay("next")}
                      className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                      aria-label={t("list.nextDay")}
                      title={t("list.nextDay")}
                    >
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Chuyển đổi giữa daily/weekly view */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => handleViewModeChange("daily")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === "daily"
                      ? "bg-white text-purple-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {t("list.viewMode.daily")}
                </button>
                <button
                  onClick={() => handleViewModeChange("weekly")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === "weekly"
                      ? "bg-white text-purple-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {t("list.viewMode.weekly")}
                </button>
              </div>
              {viewMode === "daily" && (
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  title={t("list.selectDate")}
                />
              )}
              <button
                onClick={() => navigate("/hr/schedules/create")}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition shadow-sm"
              >
                <Plus className="w-5 h-5" />
                {t("list.createNewSchedule")}
              </button>
            </div>
          </div>

          {viewMode === "daily" ? (
            <DailyScheduleView
              selectedDate={selectedDate}
              selectedDayInfo={selectedDayInfo}
              schedulesByDate={schedulesByDate}
              doctorDepartmentMap={doctorDepartmentMap}
              formatTime={formatTime}
            />
          ) : (
            <WeeklyScheduleView
              weekDays={weekDays}
              schedulesByDateAndDoctor={schedulesByDateAndDoctor}
              doctorDepartmentMap={doctorDepartmentMap}
              formatTime={formatTime}
            />
          )}
        </div>
      </div>
    </>
  );
}

export default ScheduleList;

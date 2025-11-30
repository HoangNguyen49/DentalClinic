import { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "../../widgets/Header/Header";
import Footer from "../../widgets/Footer/Footer";
import { useNotification } from "../../app/providers/NotificationContext";

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";

type AttendanceResponse = {
  id: number;
  userId: number;
  userName: string;
  userAvatarUrl?: string;
  clinicId: number;
  clinicName?: string;
  workDate: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  attendanceStatus?: string | null;
  note?: string | null;
  verificationStatus?: string | null;
  faceMatchScore?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  // Thông tin tính toán giờ làm việc và đi trễ/ra sớm
  shiftType?: string | null; // MORNING, AFTERNOON, FULL_DAY
  actualWorkHours?: number | null; // Số giờ làm việc thực tế (đã trừ đi trễ, ra sớm, nghỉ trưa)
  expectedWorkHours?: number | null; // Số giờ làm việc theo lịch
  lateMinutes?: number | null; // Số phút đi trễ
  earlyMinutes?: number | null; // Số phút ra sớm
  lunchBreakMinutes?: number | null; // Số phút nghỉ trưa
};

type ExplanationResponse = {
  attendanceId: number;
  userId: number;
  userName?: string;
  clinicId: number;
  clinicName?: string;
  workDate: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  attendanceStatus?: string | null;
  explanationType?: string | null;
  employeeReason?: string | null;
  explanationStatus?: string | null;
  adminNote?: string | null;
  note?: string | null;
};

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatDateDisplay(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatTime(value?: string | null): string {
  if (!value) return "-";
  try {
    const date = new Date(value);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return value;
  }
}

function getStatusColor(status?: string | null): string {
  if (!status) return "bg-gray-100 text-gray-800";
  switch (status.toUpperCase()) {
    case "ON_TIME":
    case "APPROVED_LATE":
    case "APPROVED_ABSENCE":
      return "bg-green-100 text-green-800";
    case "LATE":
      return "bg-yellow-100 text-yellow-800";
    case "ABSENT":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getExplanationStatusColor(status?: string | null): string {
  if (!status) return "bg-gray-100 text-gray-800";
  switch (status.toUpperCase()) {
    case "APPROVED":
      return "bg-green-100 text-green-800";
    case "REJECTED":
      return "bg-red-100 text-red-800";
    case "PENDING":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function calculateWorkedHours(attendance: AttendanceResponse): number {
  if (!attendance.checkInTime || !attendance.checkOutTime) return 0;
  const start = new Date(attendance.checkInTime).getTime();
  const end = new Date(attendance.checkOutTime).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0;
  const diffMs = end - start;
  return diffMs / (1000 * 60 * 60);
}

function formatHourValue(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "-";
  return `${value.toFixed(1)}h`;
}

export default function EmployeeAttendanceView() {
  const { t } = useTranslation("web");
  const navigate = useNavigate();
  const accessToken = localStorage.getItem("accessToken");
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const userId = user?.userId || user?.id;

  const { notifications } = useNotification();
  const lastNotificationIdRef = useRef<number | null>(null);

  // Kiểm tra quyền admin và điều hướng (admin không được quyền truy cập màn này)
  useEffect(() => {
    if (user?.roles) {
      const roles = Array.isArray(user.roles) ? user.roles : [user.roles];
      const isAdmin = roles.some((r: string) => r.toUpperCase() === "ADMIN");
      if (isAdmin) {
        navigate("/admin/attendance");
        return;
      }
    }
    if (!accessToken || !userId) {
      navigate("/login");
    }
  }, [user, accessToken, userId, navigate]);

  // Effect lắng nghe notifications để tự động refresh dữ liệu
  useEffect(() => {
    if (!notifications || notifications.length === 0) return;
    if (!accessToken || !userId) return;

    const latestNotification = notifications[0];
    if (!latestNotification || latestNotification.notificationId === lastNotificationIdRef.current) {
      return;
    }

    // Nếu có thông báo về giải trình được duyệt hoặc từ chối
    if (
      (latestNotification.type === "EXPLANATION_APPROVED" ||
        latestNotification.type === "EXPLANATION_REJECTED") &&
      latestNotification.relatedEntityType === "ATTENDANCE"
    ) {
      lastNotificationIdRef.current = latestNotification.notificationId;

      // Refresh dữ liệu ngay lập tức
      fetchExplanationsNeeding();
      fetchMonthlyAttendances();
      fetchTodayAttendance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]);

  const [todayAttendance, setTodayAttendance] = useState<AttendanceResponse | null>(null);
  const [explanationsNeeding, setExplanationsNeeding] = useState<ExplanationResponse[]>([]);
  const [monthlyAttendances, setMonthlyAttendances] = useState<AttendanceResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [showExplanationDialog, setShowExplanationDialog] = useState(false);
  const [selectedExplanation, setSelectedExplanation] = useState<ExplanationResponse | null>(null);
  const [explanationReason, setExplanationReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedExplanationDate, setSelectedExplanationDate] = useState<string>(new Date().toISOString().split("T")[0]);

  const monthlySummary = useMemo(() => {
    if (!monthlyAttendances.length) {
      return {
        totalDays: 0,
        presentDays: 0,
        lateDays: 0,
        absentDays: 0,
        approvedDays: 0,
        totalHours: 0,
        avgHours: 0,
        totalLateMinutes: 0, // Tổng số phút đi trễ trong tháng
        totalEarlyMinutes: 0, // Tổng số phút ra sớm trong tháng
        totalActualWorkHours: 0, // Tổng giờ làm thực tế
      };
    }

    const stats = monthlyAttendances.reduce(
      (acc, attendance) => {
        const status = (attendance.attendanceStatus || "").toUpperCase();
        acc.totalDays += 1;
        if (status === "ABSENT") {
          acc.absentDays += 1;
        } else {
          acc.presentDays += 1;
        }
        if (status === "LATE" || status === "APPROVED_LATE") {
          acc.lateDays += 1;
        }
        if (status.startsWith("APPROVED")) {
          acc.approvedDays += 1;
        }
        acc.totalHours += calculateWorkedHours(attendance);

        // Tính tổng số phút đi trễ và ra sớm
        acc.totalLateMinutes += attendance.lateMinutes || 0;
        acc.totalEarlyMinutes += attendance.earlyMinutes || 0;

        // Sử dụng actualWorkHours nếu có, nếu không thì dùng calculateWorkedHours
        if (attendance.actualWorkHours != null && attendance.actualWorkHours > 0) {
          acc.totalActualWorkHours += attendance.actualWorkHours;
        } else {
          acc.totalActualWorkHours += calculateWorkedHours(attendance);
        }

        return acc;
      },
      {
        totalDays: 0,
        presentDays: 0,
        lateDays: 0,
        absentDays: 0,
        approvedDays: 0,
        totalHours: 0,
        avgHours: 0,
        totalLateMinutes: 0,
        totalEarlyMinutes: 0,
        totalActualWorkHours: 0,
      }
    );

    const avgHours =
      stats.presentDays > 0 ? stats.totalHours / stats.presentDays : 0;

    return { ...stats, avgHours };
  }, [monthlyAttendances]);

  // Lấy dữ liệu chấm công hiện tại, giải trình cần thiết, và lịch sử hàng tháng khi có userId
  useEffect(() => {
    if (userId) {
      fetchTodayAttendance();
      fetchExplanationsNeeding();
      fetchMonthlyAttendances();
    }
  }, [userId]);

  // Lấy lại dữ liệu lịch sử khi thay đổi tháng, năm
  useEffect(() => {
    if (userId) {
      fetchMonthlyAttendances();
    }
  }, [selectedMonth, selectedYear, userId]);

  // Lấy chấm công ngày hôm nay
  const fetchTodayAttendance = async () => {
    if (!accessToken || !userId) return;
    setLoading(true);
    try {
      const response = await axios.get<AttendanceResponse | null>(
        `${apiBase}/api/hr/attendance/today`,
        {
          params: { userId },
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      // Backend trả về 200 với null body nếu không có attendance hôm nay (trường hợp hợp lệ)
      // Double check: đảm bảo attendance trả về là của user hiện tại
      if (response.data && response.data.userId === userId) {
        setTodayAttendance(response.data);
      } else {
        setTodayAttendance(null);
      }
    } catch (error: any) {
      // Handle cả 404 (nếu backend vẫn throw) và các lỗi khác
      if (error.response?.status === 404) {
        setTodayAttendance(null);
      } else {
        toast.error(t("attendance.monthlyHistory.loadFailed", "Cannot load today's attendance"));
      }
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách giải trình cần gửi
  const fetchExplanationsNeeding = async () => {
    if (!accessToken || !userId) return;
    try {
      const response = await axios.get<ExplanationResponse[]>(
        `${apiBase}/api/hr/attendance/explanations/needing`,
        {
          params: { userId },
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      // Đảm bảo chỉ lấy explanations của user hiện tại
      const today = new Date().toISOString().split("T")[0];
      const filtered = (response.data || []).filter(
        (exp) => {
          // Loại trừ MISSING_CHECK_OUT cho ngày hôm nay
          // Vì nhân viên có thể vẫn đang làm việc
          const workDate = exp.workDate ? new Date(exp.workDate).toISOString().split("T")[0] : null;
          if (workDate === today && exp.explanationType === "MISSING_CHECK_OUT") {
            return false;
          }
          return exp.userId === userId;
        }
      );
      // Sắp xếp theo ngày từ mới nhất đến cũ nhất
      const sorted = filtered.sort((a, b) => {
        const dateA = new Date(a.workDate).getTime();
        const dateB = new Date(b.workDate).getTime();
        return dateB - dateA; // Mới nhất trước
      });
      setExplanationsNeeding(sorted);
    } catch (error: any) {
      console.error("Failed to fetch explanations:", error);
      setExplanationsNeeding([]);
    }
  };

  // Lấy lịch sử chấm công theo tháng
  const fetchMonthlyAttendances = async () => {
    if (!accessToken || !userId) return;
    setLoadingMonthly(true);
    try {
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`;
      const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split("T")[0];

      const response = await axios.get<{
        content: AttendanceResponse[];
        totalPages: number;
        totalElements: number;
        number: number;
        size: number;
      }>(
        `${apiBase}/api/hr/attendance/history`,
        {
          params: {
            userId,
            startDate,
            endDate,
            page: 0,
            size: 100,
          },
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      // API trả về Page object với cấu trúc { content: [...], totalPages, ... }
      const attendances: AttendanceResponse[] = response.data?.content || [];

      // Đảm bảo chỉ hiển thị chấm công của đúng user (double check)
      const filtered = attendances.filter((att) => att && att.userId === userId);
      setMonthlyAttendances(filtered);
    } catch (error: any) {
      console.error("Failed to fetch monthly attendances:", error);
      if (error.response?.status === 403) {
        toast.error(t("attendance.monthlyHistory.loadFailed", "Unable to load attendance history. Please contact HR."));
      }
      setMonthlyAttendances([]);
    } finally {
      setLoadingMonthly(false);
    }
  };

  // Gửi hoặc cập nhật giải trình
  const handleSubmitExplanation = async () => {
    if (!selectedExplanation || !explanationReason.trim()) {
      toast.error(t("attendance.explanationsNeeded.enterReason", "Please enter explanation reason"));
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(
        `${apiBase}/api/hr/attendance/explanations/submit`,
        {
          attendanceId: selectedExplanation.attendanceId,
          explanationType: selectedExplanation.explanationType,
          reason: explanationReason.trim(),
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      toast.success(t("attendance.explanationsNeeded.submitSuccess", "Explanation submitted successfully"));
      setShowExplanationDialog(false);
      setExplanationReason("");
      setSelectedExplanation(null);
      await fetchExplanationsNeeding();
      await fetchTodayAttendance();
    } catch (error: any) {
      const message = error.response?.data?.message || t("attendance.explanationsNeeded.submitFailed", "Failed to submit explanation");
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Mở dialog gửi giải trình
  const openExplanationDialog = (explanation: ExplanationResponse) => {
    setSelectedExplanation(explanation);
    setExplanationReason(explanation.employeeReason || "");
    setShowExplanationDialog(true);
  };

  if (!accessToken || !userId) {
    return null;
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-100">
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          <ToastContainer position="top-right" autoClose={3000} />

          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">{t("attendance.title", "My Attendance")}</h1>
            <button
              onClick={() => {
                fetchTodayAttendance();
                fetchExplanationsNeeding();
                fetchMonthlyAttendances();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              {t("attendance.refresh", "Refresh")}
            </button>
          </div>

          {/* Today's Attendance Card */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">{t("attendance.today", "Today")}</h2>
            {loading ? (
              <div className="text-center py-8">{t("attendance.loading", "Loading...")}</div>
            ) : todayAttendance ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">{t("attendance.checkIn", "Check-in Time")}</p>
                  <p className="text-lg font-semibold">
                    {formatTime(todayAttendance.checkInTime)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t("attendance.checkOut", "Check-out Time")}</p>
                  <p className="text-lg font-semibold">
                    {formatTime(todayAttendance.checkOutTime)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t("attendance.statusLabel", "Status")}</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                      todayAttendance.attendanceStatus
                    )}`}
                  >
                    {t(`attendance.statusOptions.${todayAttendance.attendanceStatus || "UNKNOWN"}`, todayAttendance.attendanceStatus || "N/A")}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {t("attendance.noAttendanceToday", "No attendance record for today")}
              </div>
            )}
          </div>

          {/* Explanations Section */}
          {explanationsNeeding.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-6 h-6 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <h2 className="text-xl font-semibold text-orange-900">
                    {t("attendance.explanationsNeeded.title", "Attendance Explanations Needed")}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="explanation-date-picker" className="text-sm font-medium text-gray-700">
                    {t("attendance.explanationsNeeded.date", "Ngày")}:
                  </label>
                  <input
                    id="explanation-date-picker"
                    type="date"
                    value={selectedExplanationDate}
                    onChange={(e) => setSelectedExplanationDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    max={new Date().toISOString().split("T")[0]}
                    title={t("attendance.explanationsNeeded.date", "Chọn ngày")}
                  />
                </div>
              </div>
              <div className="space-y-4">
                {explanationsNeeding
                  .filter((explanation) => {
                    const explanationDate = new Date(explanation.workDate).toISOString().split("T")[0];
                    return explanationDate === selectedExplanationDate;
                  })
                  .map((explanation) => (
                    <div
                      key={explanation.attendanceId}
                      className="border rounded-lg p-5 bg-white shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <p className="text-lg font-bold text-gray-900 mb-2">
                            {t(`attendance.explanationType.${explanation.explanationType || "UNKNOWN"}`, explanation.explanationType || "")}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            <span className="font-semibold">{t("attendance.explanationsNeeded.date", "Ngày")}:</span> {formatDateDisplay(explanation.workDate)}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-semibold">{t("attendance.explanationsNeeded.status", "Trạng thái")}:</span> {t(`attendance.statusOptions.${explanation.attendanceStatus || "UNKNOWN"}`, explanation.attendanceStatus || "N/A")}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-4 ${getExplanationStatusColor(
                            explanation.explanationStatus
                          )}`}
                        >
                          {t(`attendance.explanationStatus.${explanation.explanationStatus || "PENDING"}`, explanation.explanationStatus || "Pending")}
                        </span>
                      </div>
                      {explanation.employeeReason && (
                        <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
                          <p className="text-xs font-semibold text-gray-700 mb-1">{t("attendance.explanationsNeeded.reason", "Lý do")}:</p>
                          <p className="text-sm text-gray-800">{explanation.employeeReason}</p>
                        </div>
                      )}
                      {explanation.adminNote && (
                        <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                          <p className="text-xs font-semibold text-blue-700 mb-1">{t("attendance.explanationsNeeded.adminNote", "Ghi chú từ admin")}:</p>
                          <p className="text-sm text-blue-800">{explanation.adminNote}</p>
                        </div>
                      )}
                      {explanation.explanationStatus === "PENDING" && (
                        <button
                          onClick={() => openExplanationDialog(explanation)}
                          className="mt-4 w-full px-4 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors shadow-md hover:shadow-lg"
                        >
                          {explanation.employeeReason ? t("attendance.explanationsNeeded.update", "Cập nhật giải trình") : t("attendance.explanationsNeeded.submit", "Gửi giải trình")}
                        </button>
                      )}
                    </div>
                  ))}
                {explanationsNeeding.filter((explanation) => {
                  const explanationDate = new Date(explanation.workDate).toISOString().split("T")[0];
                  return explanationDate === selectedExplanationDate;
                }).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>{t("attendance.explanationsNeeded.noExplanationsForDate", "Không có giải trình cần xử lý cho ngày này")}</p>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Monthly Attendance List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{t("attendance.monthlyHistory.title", "Monthly Attendance History")}</h2>
              <div className="flex gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-3 py-2 border rounded-lg"
                  title={t("attendance.monthlyHistory.selectMonth", "Select Month")}
                  aria-label={t("attendance.monthlyHistory.selectMonth", "Select Month")}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>
                      {t("attendance.monthlyHistory.month", "Month")} {month}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-2 border rounded-lg"
                  title={t("attendance.monthlyHistory.selectYear", "Select Year")}
                  aria-label={t("attendance.monthlyHistory.selectYear", "Select Year")}
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(
                    (year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
            {monthlyAttendances.length > 0 && (
              <div className="mb-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                  <div className="rounded-xl border border-gray-200 p-4 bg-gradient-to-br from-blue-50 to-blue-100">
                    <p className="text-sm font-medium text-blue-700">{t("attendance.monthlyHistory.summary.totalDays", "Days Logged")}</p>
                    <p className="text-3xl font-bold text-blue-900 mt-2">{monthlySummary.totalDays}</p>
                    <p className="text-xs text-blue-800 mt-1">
                      {t("attendance.monthlyHistory.summary.presentHelper", "Present days: {{value}}", {
                        value: monthlySummary.presentDays,
                      })}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4 bg-gradient-to-br from-amber-50 to-amber-100">
                    <p className="text-sm font-medium text-amber-700">{t("attendance.monthlyHistory.summary.lateDays", "Late days")}</p>
                    <p className="text-3xl font-bold text-amber-900 mt-2">{monthlySummary.lateDays}</p>
                    <p className="text-xs text-amber-800 mt-1">
                      {t("attendance.monthlyHistory.summary.approvedHelper", "Approved entries: {{value}}", {
                        value: monthlySummary.approvedDays,
                      })}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4 bg-gradient-to-br from-red-50 to-red-100">
                    <p className="text-sm font-medium text-red-700">{t("attendance.monthlyHistory.summary.totalLateMinutes", "Tổng phút đi trễ")}</p>
                    <p className="text-3xl font-bold text-red-900 mt-2">
                      {monthlySummary.totalLateMinutes > 0 ? `${monthlySummary.totalLateMinutes} phút` : "0"}
                    </p>
                    <p className="text-xs text-red-800 mt-1">
                      {t("attendance.monthlyHistory.summary.lateHours", "≈ {{hours}} giờ", {
                        hours: (monthlySummary.totalLateMinutes / 60).toFixed(1),
                      })}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-sm font-medium text-rose-700">{t("attendance.monthlyHistory.summary.absentDays", "Absent days")}</p>
                    <p className="text-3xl font-bold text-rose-900 mt-2">{monthlySummary.absentDays}</p>
                    <p className="text-xs text-rose-800 mt-1">
                      {t("attendance.monthlyHistory.summary.absentHelper", "Impact days: {{value}}", {
                        value: monthlySummary.absentDays,
                      })}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-sm font-medium text-gray-600">{t("attendance.monthlyHistory.summary.totalHours", "Total hours")}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{formatHourValue(monthlySummary.totalActualWorkHours || monthlySummary.totalHours)}</p>
                    <p className="text-xs text-gray-500 mt-1">{t("attendance.monthlyHistory.summary.avgHours", "Avg hours/day")}: {formatHourValue(monthlySummary.avgHours)}</p>
                  </div>
                </div>
              </div>
            )}
            {loadingMonthly ? (
              <div className="text-center py-8">{t("attendance.loading", "Loading...")}</div>
            ) : monthlyAttendances.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("attendance.monthlyHistory.date", "Date")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("attendance.monthlyHistory.clinic", "Clinic / Location")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("attendance.monthlyHistory.checkIn", "Check-in")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("attendance.monthlyHistory.checkOut", "Check-out")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("attendance.monthlyHistory.hours", "Worked Hours")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("attendance.monthlyHistory.lateMinutes", "Đi trễ (phút)")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("attendance.monthlyHistory.earlyMinutes", "Ra sớm (phút)")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("attendance.monthlyHistory.status", "Status")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("attendance.monthlyHistory.remarks", "Remarks")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {monthlyAttendances.map((attendance) => {
                      // Sử dụng actualWorkHours nếu có, nếu không thì tính từ checkIn/checkOut
                      const workedHours = attendance.actualWorkHours != null && attendance.actualWorkHours > 0
                        ? attendance.actualWorkHours
                        : calculateWorkedHours(attendance);

                      return (
                        <tr key={attendance.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(new Date(attendance.workDate))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {attendance.clinicName || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatTime(attendance.checkInTime)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatTime(attendance.checkOutTime)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatHourValue(workedHours)}
                            {attendance.expectedWorkHours && (
                              <span className="text-xs text-gray-500 ml-1">
                                / {formatHourValue(attendance.expectedWorkHours)}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {attendance.lateMinutes && attendance.lateMinutes > 0 ? (
                              <span className="text-red-600 font-semibold">
                                {attendance.lateMinutes} phút
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {attendance.earlyMinutes && attendance.earlyMinutes > 0 ? (
                              <span className="text-orange-600 font-semibold">
                                {attendance.earlyMinutes} phút
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                attendance.attendanceStatus
                              )}`}
                            >
                              {t(`attendance.status.${attendance.attendanceStatus || "UNKNOWN"}`, attendance.attendanceStatus || "N/A")}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-sm">
                            {attendance.note ? (
                              <div className="truncate" title={attendance.note}>
                                {attendance.note}
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {t("attendance.monthlyHistory.noData", "No attendance data for this month")}
              </div>
            )}
          </div>

          {/* Explanation Dialog */}
          {showExplanationDialog && selectedExplanation && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-xl font-semibold mb-4">{t("attendance.explanationsNeeded.dialogTitle", "Submit Explanation")}</h3>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    {t("attendance.explanationsNeeded.type", "Type")}: <span className="font-semibold">
                      {t(`attendance.explanationType.${selectedExplanation.explanationType || "UNKNOWN"}`, selectedExplanation.explanationType || "")}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("attendance.explanationsNeeded.date", "Date")}: {formatDate(new Date(selectedExplanation.workDate))}
                  </p>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("attendance.explanationsNeeded.reasonLabel", "Explanation Reason *")}
                  </label>
                  <textarea
                    value={explanationReason}
                    onChange={(e) => setExplanationReason(e.target.value)}
                    placeholder={t("attendance.explanationsNeeded.reasonPlaceholder", "Please explain the reason...")}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setShowExplanationDialog(false);
                      setExplanationReason("");
                      setSelectedExplanation(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    disabled={submitting}
                  >
                    {t("attendance.explanationsNeeded.cancel", "Cancel")}
                  </button>
                  <button
                    onClick={handleSubmitExplanation}
                    disabled={submitting || !explanationReason.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? t("attendance.explanationsNeeded.submitting", "Submitting...") : t("attendance.explanationsNeeded.submitButton", "Submit")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}


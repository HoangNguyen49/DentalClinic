import { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Header from "../../widgets/Header/Header";
import Footer from "../../widgets/Footer/Footer";

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

export default function EmployeeAttendanceView() {
  const { t } = useTranslation("web");
  const navigate = useNavigate();
  const accessToken = localStorage.getItem("accessToken");
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const userId = user?.userId || user?.id;
  
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
      const filtered = (response.data || []).filter(
        (exp) => exp.userId === userId
      );
      setExplanationsNeeding(filtered);
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
      
      const response = await axios.get<{ content?: AttendanceResponse[] } | AttendanceResponse[]>(
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
      
      let attendances: AttendanceResponse[] = [];
      
      if (Array.isArray(response.data)) {
        attendances = response.data;
      } else if (response.data && typeof response.data === 'object' && 'content' in response.data) {
        attendances = (response.data as { content: AttendanceResponse[] }).content || [];
      }
      
      // Đảm bảo chỉ hiển thị chấm công của đúng user
      const filtered = attendances.filter((att) => att.userId === userId);
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
              <p className="text-sm text-gray-600">{t("attendance.status", "Status")}</p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                  todayAttendance.attendanceStatus
                )}`}
              >
                {t(`attendance.status.${todayAttendance.attendanceStatus || "UNKNOWN"}`, todayAttendance.attendanceStatus || "N/A")}
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
          <div className="flex items-center gap-2 mb-4">
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
          <div className="space-y-4">
            {explanationsNeeding.map((explanation) => (
              <div
                key={explanation.attendanceId}
                className="border rounded-lg p-4 bg-gray-50"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">
                      {t(`attendance.explanationType.${explanation.explanationType || "UNKNOWN"}`, explanation.explanationType || "")}
                    </p>
                    <p className="text-sm text-gray-600">
                      {t("attendance.explanationsNeeded.date", "Date")}: {formatDate(new Date(explanation.workDate))}
                    </p>
                    <p className="text-sm text-gray-600">
                      {t("attendance.explanationsNeeded.status", "Status")}: {t(`attendance.status.${explanation.attendanceStatus || "UNKNOWN"}`, explanation.attendanceStatus || "N/A")}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getExplanationStatusColor(
                      explanation.explanationStatus
                    )}`}
                  >
                    {t(`attendance.explanationStatus.${explanation.explanationStatus || "PENDING"}`, explanation.explanationStatus || "Pending")}
                  </span>
                </div>
                {explanation.employeeReason && (
                  <div className="mt-2 p-2 bg-white rounded border">
                    <p className="text-xs font-semibold text-gray-700 mb-1">{t("attendance.explanationsNeeded.reason", "Reason")}:</p>
                    <p className="text-sm text-gray-800">{explanation.employeeReason}</p>
                  </div>
                )}
                {explanation.adminNote && (
                  <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                    <p className="text-xs font-semibold text-blue-700 mb-1">{t("attendance.explanationsNeeded.adminNote", "Admin Note")}:</p>
                    <p className="text-sm text-blue-800">{explanation.adminNote}</p>
                  </div>
                )}
                {explanation.explanationStatus === "PENDING" && (
                  <button
                    onClick={() => openExplanationDialog(explanation)}
                    className="mt-3 w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                  >
                    {explanation.employeeReason ? t("attendance.explanationsNeeded.update", "Update Explanation") : t("attendance.explanationsNeeded.submit", "Submit Explanation")}
                  </button>
                )}
              </div>
            ))}
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
                    {t("attendance.monthlyHistory.checkIn", "Check-in")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("attendance.monthlyHistory.checkOut", "Check-out")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("attendance.monthlyHistory.status", "Status")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("attendance.monthlyHistory.note", "Note")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {monthlyAttendances.map((attendance) => (
                  <tr key={attendance.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(new Date(attendance.workDate))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(attendance.checkInTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(attendance.checkOutTime)}
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
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {attendance.note ? (
                        <div className="max-w-xs truncate" title={attendance.note}>
                          {attendance.note}
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
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


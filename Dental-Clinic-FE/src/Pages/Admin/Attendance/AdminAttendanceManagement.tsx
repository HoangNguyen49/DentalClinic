import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from "react-i18next";

type AdminClinic = {
  id: number;
  clinicName: string;
};

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
};

type AttendanceExplanationResponse = {
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

type StatusOption = {
  value: string;
  label: string;
};

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";

const STATUS_OPTIONS: StatusOption[] = [
  { value: "LATE", label: "Late" },
  { value: "ABSENT", label: "Absent" },
  { value: "APPROVED_ABSENCE", label: "Approved Leave" },
  { value: "APPROVED_LATE", label: "Approved Late" },
  { value: "ON_TIME", label: "On Time" },
];

// Format date for input[type="date"]
function formatDateInput(date: Date) {
  return date.toISOString().split("T")[0];
}

// Format time for table display
function formatDateTime(value?: string | null) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

// Chuẩn hoá trạng thái
function normalizeStatus(status?: string | null) {
  if (!status) return "-";
  switch (status) {
    case "ON_TIME":
      return "On Time";
    case "LATE":
      return "Late";
    case "ABSENT":
      return "Absent";
    case "APPROVED_ABSENCE":
      return "Approved Leave";
    case "APPROVED_LATE":
      return "Approved Late";
    default:
      return status;
  }
}

export default function AdminAttendanceManagement() {
  const { t } = useTranslation("admin");
  const accessToken = localStorage.getItem("accessToken");
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const adminUserId = user?.userId || user?.id;

  const [clinics, setClinics] = useState<AdminClinic[]>([]);
  const [attendances, setAttendances] = useState<AttendanceResponse[]>([]);
  const [pendingExplanations, setPendingExplanations] = useState<AttendanceExplanationResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingExplanations, setLoadingExplanations] = useState(false);
  const [activeTab, setActiveTab] = useState<"attendance" | "explanations">("attendance");
  const [filters, setFilters] = useState({
    date: formatDateInput(new Date()),
    clinicId: "all",
    status: "LATE",
  });
  const [explanationClinicFilter, setExplanationClinicFilter] = useState<string>("all");

  // Filter status options with i18n support
  const filteredStatusOptions = useMemo(() => {
    return STATUS_OPTIONS.map((opt) => ({
      ...opt,
      label: t(`attendance.status.${opt.value}`, opt.label),
    }));
  }, [t]);

  // Lấy danh sách phòng khám
  const fetchClinics = async () => {
    if (!accessToken) return;
    try {
      const response = await axios.get<AdminClinic[]>(`${apiBase}/api/admin/clinics`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setClinics(response.data || []);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t("attendance.messages.loadClinicsFailed", "Unable to load clinics");
      toast.error(message);
    }
  };

  // Lấy danh sách chấm công theo filter
  const fetchAttendance = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filters.date) params.date = filters.date;
      if (filters.status && filters.status !== "all") params.status = filters.status;
      if (filters.clinicId && filters.clinicId !== "all") params.clinicId = filters.clinicId;

      const response = await axios.get<AttendanceResponse[]>(`${apiBase}/api/admin/attendance`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params,
      });
      setAttendances(response.data || []);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t("attendance.messages.loadFailed", "Unable to load attendance records");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // effect lấy clinics
  useEffect(() => {
    if (!accessToken) {
      toast.error(t("attendance.messages.noAccessToken", "Missing access token"));
      return;
    }
    fetchClinics();
  }, [accessToken]);

  // effect lấy attendance khi filter thay đổi
  useEffect(() => {
    if (!accessToken) return;
    fetchAttendance();
  }, [filters]);

  // Lấy danh sách giải trình đang chờ xét duyệt
  const fetchPendingExplanations = async () => {
    if (!accessToken) return;
    setLoadingExplanations(true);
    try {
      const params: Record<string, string> = {};
      if (explanationClinicFilter && explanationClinicFilter !== "all") {
        params.clinicId = explanationClinicFilter;
      }

      const response = await axios.get<AttendanceExplanationResponse[]>(
        `${apiBase}/api/admin/attendance/explanations/pending`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params,
        }
      );
      setPendingExplanations(response.data || []);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t("attendance.messages.loadExplanationsFailed", "Unable to load pending explanations");
      toast.error(message);
    } finally {
      setLoadingExplanations(false);
    }
  };

  // effect lấy giải trình khi chọn sang tab giải trình 
  useEffect(() => {
    if (!accessToken) return;
    if (activeTab === "explanations") {
      fetchPendingExplanations();
    }
  }, [activeTab, explanationClinicFilter, accessToken]);

  // Xử lý thay đổi filter
  const handleFilterChange = (field: "date" | "clinicId" | "status", value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Xử lý duyệt cho attendance lẻ
  const handleApprove = async (attendance: AttendanceResponse, targetStatus: string) => {
    if (!accessToken) return;
    const adminNote = prompt(
      t("attendance.messages.enterAdminNote", "Enter approval note (optional)"),
      ""
    );

    try {
      await axios.patch(
        `${apiBase}/api/admin/attendance/${attendance.id}`,
        {
          newStatus: targetStatus,
          adminNote: adminNote || "",
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      toast.success(t("attendance.messages.updateSuccess", "Attendance updated"));
      fetchAttendance();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t("attendance.messages.updateFailed", "Unable to update attendance");
      toast.error(message);
    }
  };

  // Hiển thị nút tác vụ của từng attendance dòng
  const renderActionButton = (attendance: AttendanceResponse) => {
    const status = attendance.attendanceStatus?.toUpperCase();
    if (status === "LATE") {
      return (
        <button
          onClick={() => handleApprove(attendance, "ON_TIME")}
          className="px-3 py-1.5 text-sm font-medium rounded bg-green-600 text-white hover:bg-green-700 transition"
        >
          {t("attendance.actions.approveLate", "Approve Late")}
        </button>
      );
    }
    if (status === "ABSENT") {
      return (
        <button
          onClick={() => handleApprove(attendance, "APPROVED_ABSENCE")}
          className="px-3 py-1.5 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          {t("attendance.actions.approveLeave", "Approve Leave")}
        </button>
      );
    }
    return <span className="text-sm text-gray-400">{t("attendance.actions.noAction", "—")}</span>;
  };

  // Xử lý duyệt hoặc từ chối giải trình
  const handleProcessExplanation = async (explanation: AttendanceExplanationResponse, action: "APPROVE" | "REJECT") => {
    if (!accessToken || !adminUserId) return;
    
    const adminNote = prompt(
      action === "APPROVE"
        ? t("attendance.messages.enterApprovalNote", "Enter approval note (optional)")
        : t("attendance.messages.enterRejectionNote", "Enter rejection reason (optional)"),
      ""
    );

    if (adminNote === null) return;

    try {
      const response = await axios.post<AttendanceResponse>(
        `${apiBase}/api/admin/attendance/explanations/process`,
        {
          attendanceId: explanation.attendanceId,
          action: action,
          adminNote: adminNote || "",
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Thông báo chi tiết trạng thái mới
      const newStatus = response.data.attendanceStatus;
      if (action === "APPROVE") {
        let statusMessage = "";
        if (explanation.explanationType === "LATE") {
          statusMessage = `Status updated: LATE → ${newStatus || "APPROVED_LATE"}`;
        } else if (explanation.explanationType === "ABSENT" || explanation.explanationType === "MISSING_CHECK_IN") {
          statusMessage = `Status updated: ${explanation.attendanceStatus} → ${newStatus || "APPROVED_ABSENCE"}`;
        } else if (explanation.explanationType === "MISSING_CHECK_OUT") {
          statusMessage = `Explanation approved. Status unchanged: ${newStatus || explanation.attendanceStatus}`;
        }
        
        toast.success(
          `${t("attendance.messages.explanationApproved", "Explanation approved successfully")}\n${statusMessage}`,
          { autoClose: 5000 }
        );
      } else {
        toast.success(
          `${t("attendance.messages.explanationRejected", "Explanation rejected")}\nStatus unchanged: ${explanation.attendanceStatus}`,
          { autoClose: 5000 }
        );
      }

      await fetchPendingExplanations();
      await fetchAttendance();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t("attendance.messages.processFailed", "Unable to process explanation");
      toast.error(message);
    }
  };

  // Lấy nhãn loại giải trình
  const getExplanationTypeLabel = (type?: string | null): string => {
    if (!type) return "-";
    switch (type.toUpperCase()) {
      case "LATE":
        return t("attendance.explanation.typeLate", "Late Arrival");
      case "ABSENT":
        return t("attendance.explanation.typeAbsent", "Absent");
      case "MISSING_CHECK_IN":
        return t("attendance.explanation.typeMissingCheckIn", "Missing Check-In");
      case "MISSING_CHECK_OUT":
        return t("attendance.explanation.typeMissingCheckOut", "Missing Check-Out");
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900">
          Attendance Management
        </h1>
        <p className="text-sm text-gray-600">
          Review late check-ins or leave requests submitted by employees, update their status, and append admin notes.
        </p>
      </div>
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("attendance")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "attendance"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Attendance Records
          </button>
          <button
            onClick={() => setActiveTab("explanations")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "explanations"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Pending Explanations
            {pendingExplanations.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                {pendingExplanations.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {activeTab === "attendance" ? (
        <>
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                Date
                <input
                  type="date"
                  value={filters.date}
                  onChange={(e) => handleFilterChange("date", e.target.value)}
                  className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                Clinic
                <select
                  value={filters.clinicId}
                  onChange={(e) => handleFilterChange("clinicId", e.target.value)}
                  className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All clinics</option>
                  {clinics.map((clinic) => (
                    <option key={clinic.id} value={clinic.id}>
                      {clinic.clinicName}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                Status
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All statuses</option>
                  {filteredStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Clinic
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Work Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Check-in
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Check-out
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Note
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                      Loading attendance records...
                    </td>
                  </tr>
                ) : attendances.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                      No attendance records found
                    </td>
                  </tr>
                ) : (
                  attendances.map((attendance) => (
                    <tr key={attendance.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="font-semibold">{attendance.userName || `#${attendance.userId}`}</div>
                        <div className="text-xs text-gray-500">ID: {attendance.userId}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {attendance.clinicName || "Unknown clinic"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{attendance.workDate}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatDateTime(attendance.checkInTime)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatDateTime(attendance.checkOutTime)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">
                        {normalizeStatus(attendance.attendanceStatus)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-pre-line">
                        {attendance.note && attendance.note.trim().length > 0
                          ? attendance.note
                          : "No note provided"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">{renderActionButton(attendance)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
                Clinic
                <select
                  value={explanationClinicFilter}
                  onChange={(e) => setExplanationClinicFilter(e.target.value)}
                  className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All clinics</option>
                  {clinics.map((clinic) => (
                    <option key={clinic.id} value={clinic.id}>
                      {clinic.clinicName}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-end">
                <button
                  onClick={fetchPendingExplanations}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
            {loadingExplanations ? (
              <div className="px-4 py-6 text-center text-gray-500">
                Loading...
              </div>
            ) : pendingExplanations.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500">
                No pending explanations
              </div>
            ) : (
              <table className="min-w-full border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Clinic
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Work Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pendingExplanations.map((explanation) => (
                    <tr key={explanation.attendanceId} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="font-semibold">{explanation.userName || `#${explanation.userId}`}</div>
                        <div className="text-xs text-gray-500">ID: {explanation.userId}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {explanation.clinicName || "Unknown clinic"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{explanation.workDate}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">
                        {getExplanationTypeLabel(explanation.explanationType)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-xs">
                        <div className="truncate" title={explanation.employeeReason || ""}>
                          {explanation.employeeReason || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs">
                          Pending
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right space-x-2">
                        <button
                          onClick={() => handleProcessExplanation(explanation, "APPROVE")}
                          className="px-3 py-1.5 text-sm font-medium rounded bg-green-600 text-white hover:bg-green-700 transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleProcessExplanation(explanation, "REJECT")}
                          className="px-3 py-1.5 text-sm font-medium rounded bg-red-600 text-white hover:bg-red-700 transition"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from "react-i18next";
import { Calendar, Building2, SlidersHorizontal, CheckCircle2, Clock3, XCircle, FileText } from "lucide-react";

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
function normalizeStatus(
  status?: string | null,
  translate?: (key: string, defaultValue?: string) => string
) {
  if (!status) return "-";
  switch (status) {
    case "ON_TIME":
      return translate
        ? translate("attendance.status.ON_TIME", "On Time")
        : "On Time";
    case "LATE":
      return translate ? translate("attendance.status.LATE", "Late") : "Late";
    case "ABSENT":
      return translate
        ? translate("attendance.status.ABSENT", "Absent")
        : "Absent";
    case "APPROVED_ABSENCE":
      return translate
        ? translate("attendance.status.APPROVED_ABSENCE", "Approved Leave")
        : "Approved Leave";
    case "APPROVED_LATE":
      return translate
        ? translate("attendance.status.APPROVED_LATE", "Approved Late")
        : "Approved Late";
    default:
      return translate
        ? translate("attendance.status.UNKNOWN", status)
        : status;
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
    status: "all",
  });
  const [explanationClinicFilter, setExplanationClinicFilter] = useState<string>("all");
  const [actionNotes, setActionNotes] = useState<Record<number, string>>({});

  const translateStatusLabel = (key: string, defaultValue?: string) =>
    t(key, defaultValue ?? key);

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

  // Xử lý duyệt hoặc từ chối giải trình
  const handleProcessExplanation = async (explanation: AttendanceExplanationResponse, action: "APPROVE" | "REJECT") => {
    if (!accessToken || !adminUserId) return;
    const adminNote = (actionNotes[explanation.attendanceId] || "").trim();

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
      setActionNotes((prev) => {
        const updated = { ...prev };
        delete updated[explanation.attendanceId];
        return updated;
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t("attendance.messages.processFailed", "Unable to process explanation");
      toast.error(message);
    }
  };

  const handleNoteChange = (attendanceId: number, value: string) => {
    setActionNotes((prev) => ({
      ...prev,
      [attendanceId]: value,
    }));
  };

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

  const palette = {
    background: "bg-slate-50",
    surface: "bg-white",
    border: "border-slate-200",
    subtleText: "text-slate-500",
    heading: "text-slate-900",
  };

  const tabClasses = (isActive: boolean) =>
    `flex-1 rounded-2xl px-6 py-3 text-sm font-semibold transition ${
      isActive
        ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-[0_12px_24px_rgba(59,130,246,0.35)]"
        : "text-slate-500 hover:text-slate-900"
    }`;

  const statusBadgeClass = (status?: string | null) => {
    switch (status) {
      case "ON_TIME":
        return "bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 border border-emerald-200";
      case "LATE":
        return "bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 border border-amber-200";
      case "ABSENT":
        return "bg-gradient-to-r from-rose-100 to-rose-50 text-rose-700 border border-rose-200";
      case "APPROVED_ABSENCE":
      case "APPROVED_LATE":
        return "bg-gradient-to-r from-sky-100 to-slate-50 text-sky-700 border border-sky-200";
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200";
    }
  };

  const attendanceSummary = useMemo(() => {
    const summary = {
      total: attendances.length,
      onTime: 0,
      late: 0,
      absent: 0,
      pending: pendingExplanations.length,
    };

    attendances.forEach((record) => {
      switch (record.attendanceStatus) {
        case "ON_TIME":
          summary.onTime += 1;
          break;
        case "LATE":
        case "APPROVED_LATE":
          summary.late += 1;
          break;
        case "ABSENT":
        case "APPROVED_ABSENCE":
          summary.absent += 1;
          break;
        default:
          break;
      }
    });

    return summary;
  }, [attendances, pendingExplanations.length]);

  const FilterField = ({
    label,
    icon,
    children,
  }: {
    label: string;
    icon: ReactNode;
    children: ReactNode;
  }) => (
    <label className="flex flex-col gap-2 text-base font-semibold text-slate-700">
      <span>{label}</span>
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 shadow-inner">
        <span className="text-slate-400">{icon}</span>
        {children}
      </div>
    </label>
  );

  const SummaryCard = ({
    icon,
    label,
    value,
    tone,
  }: {
    icon: ReactNode;
    label: string;
    value: string | number;
    tone: "emerald" | "amber" | "rose" | "slate";
  }) => {
    const toneMap: Record<
      "emerald" | "amber" | "rose" | "slate",
      { bg: string; text: string; border: string }
    > = {
      emerald: {
        bg: "from-emerald-50 to-white",
        text: "text-emerald-700",
        border: "border-emerald-100",
      },
      amber: {
        bg: "from-amber-50 to-white",
        text: "text-amber-700",
        border: "border-amber-100",
      },
      rose: {
        bg: "from-rose-50 to-white",
        text: "text-rose-700",
        border: "border-rose-100",
      },
      slate: {
        bg: "from-slate-50 to-white",
        text: "text-slate-700",
        border: "border-slate-100",
      },
    };

    const tones = toneMap[tone];

    return (
      <div
        className={`rounded-2xl border ${tones.border} bg-gradient-to-br ${tones.bg} p-5 shadow-sm flex flex-col gap-3`}
      >
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-white shadow-inner flex items-center justify-center text-slate-500">
            {icon}
          </div>
          <span className={`text-xs font-semibold uppercase tracking-[0.3em] ${tones.text}`}>{label}</span>
        </div>
        <span className="text-4xl font-bold text-slate-900">{value}</span>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${palette.background} p-6`}>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-7xl mx-auto space-y-8">
        <section className="space-y-4">
          <p className="text-xs font-semibold tracking-[0.35em] uppercase text-slate-400">
            {t("attendance.sectionLabel", "Operations • Attendance")}
          </p>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <h1 className={`text-4xl font-bold ${palette.heading}`}>
          {t("pageTitles.attendanceManagement", "Attendance Management")}
        </h1>
              <p className={`text-base leading-relaxed ${palette.subtleText}`}>
          {t(
            "attendance.pageDescription",
            "Review late check-ins or leave requests submitted by employees, update their status, and append admin notes."
          )}
        </p>
      </div>
            <div className="flex gap-3">
              <button
                onClick={() => fetchAttendance()}
                className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-base font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                {t("attendance.actions.refresh", "Refresh")}
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            onClick={() => setActiveTab("attendance")}
            className={tabClasses(activeTab === "attendance")}
          >
            {t("attendance.tabs.attendance", "Attendance Records")}
          </button>
          <button
            onClick={() => setActiveTab("explanations")}
            className={tabClasses(activeTab === "explanations")}
          >
            <span className="flex items-center justify-center gap-2">
            {t("attendance.tabs.explanations", "Pending Explanations")}
            {pendingExplanations.length > 0 && (
                <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                {pendingExplanations.length}
              </span>
            )}
            </span>
          </button>
        </section>

      {activeTab === "attendance" ? (
        <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                icon={<FileText className="h-5 w-5" />}
                label={t("attendance.summary.total", "TOTAL RECORDS")}
                value={attendanceSummary.total}
                tone="slate"
              />
              <SummaryCard
                icon={<CheckCircle2 className="h-5 w-5" />}
                label={t("attendance.summary.onTime", "ON TIME")}
                value={attendanceSummary.onTime}
                tone="emerald"
              />
              <SummaryCard
                icon={<Clock3 className="h-5 w-5" />}
                label={t("attendance.summary.late", "LATE")}
                value={attendanceSummary.late}
                tone="amber"
              />
              <SummaryCard
                icon={<XCircle className="h-5 w-5" />}
                label={t("attendance.summary.absent", "ABSENT")}
                value={attendanceSummary.absent}
                tone="rose"
              />
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <FilterField
                  label={t("attendance.filters.date", "Date")}
                  icon={<Calendar className="h-4 w-4" />}
                >
                <input
                  type="date"
                  value={filters.date}
                  onChange={(e) => handleFilterChange("date", e.target.value)}
                    className="w-full border-none bg-transparent text-lg text-slate-900 focus:outline-none"
                    aria-label={t("attendance.filters.date", "Date")}
                />
                </FilterField>
                <FilterField
                  label={t("attendance.filters.clinic", "Clinic")}
                  icon={<Building2 className="h-4 w-4" />}
                >
                <select
                  value={filters.clinicId}
                  onChange={(e) => handleFilterChange("clinicId", e.target.value)}
                    className="w-full border-none bg-transparent text-lg text-slate-900 focus:outline-none"
                    aria-label={t("attendance.filters.clinic", "Clinic")}
                >
                  <option value="all">{t("attendance.filters.allClinics", "All clinics")}</option>
                  {clinics.map((clinic) => (
                    <option key={clinic.id} value={clinic.id}>
                      {clinic.clinicName}
                    </option>
                  ))}
                </select>
                </FilterField>
                <FilterField
                  label={t("attendance.filters.status", "Status")}
                  icon={<SlidersHorizontal className="h-4 w-4" />}
                >
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                    className="w-full border-none bg-transparent text-lg text-slate-900 focus:outline-none"
                    aria-label={t("attendance.filters.status", "Status")}
                >
                  <option value="all">{t("attendance.filters.allStatus", "All statuses")}</option>
                  {filteredStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                </FilterField>
            </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
                  <thead className="bg-slate-50">
                <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                    {t("attendance.table.employee", "Employee")}
                  </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                    {t("attendance.table.clinic", "Clinic")}
                  </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                    {t("attendance.table.workDate", "Work Date")}
                  </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                    {t("attendance.table.checkIn", "Check-in")}
                  </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                    {t("attendance.table.checkOut", "Check-out")}
                  </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                    {t("attendance.table.status", "Status")}
                  </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                    {t("attendance.table.note", "Note")}
                  </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold uppercase tracking-wide text-slate-500" />
                </tr>
              </thead>
                  <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                        <td colSpan={8} className="px-5 py-8 text-center text-slate-500">
                      {t("attendance.messages.loading", "Loading attendance records...")}
                    </td>
                  </tr>
                ) : attendances.length === 0 ? (
                  <tr>
                        <td colSpan={8} className="px-5 py-8 text-center text-slate-500">
                      {t("attendance.messages.noData", "No attendance records found")}
                    </td>
                  </tr>
                ) : (
                  attendances.map((attendance) => (
                        <tr key={attendance.id} className="transition hover:bg-slate-50">
                          <td className="px-6 py-5 text-base text-slate-900">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-lg font-semibold text-slate-500">
                                {(attendance.userName || attendance.userId.toString()).charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="text-base font-semibold text-slate-900">
                                  {attendance.userName || `#${attendance.userId}`}
                                </div>
                                <div className="text-xs uppercase tracking-wide text-slate-400">
                                  {t("attendance.table.employeeId", { defaultValue: "ID" })}: {attendance.userId}
                                </div>
                              </div>
                            </div>
                      </td>
                          <td className="px-6 py-5 text-base text-slate-700">
                        {attendance.clinicName || t("attendance.table.unknownClinic", "Unknown clinic")}
                      </td>
                          <td className="px-6 py-5 text-base text-slate-700">{attendance.workDate}</td>
                          <td className="px-6 py-5 text-base text-slate-700">
                        {formatDateTime(attendance.checkInTime)}
                      </td>
                          <td className="px-6 py-5 text-base text-slate-700">
                        {formatDateTime(attendance.checkOutTime)}
                      </td>
                          <td className="px-6 py-5 text-base font-medium">
                            <span
                              className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold ${statusBadgeClass(
                                attendance.attendanceStatus
                              )}`}
                            >
                              {normalizeStatus(attendance.attendanceStatus, translateStatusLabel)}
                            </span>
                      </td>
                          <td className="px-6 py-5 text-base text-slate-700 whitespace-pre-line">
                        {attendance.note && attendance.note.trim().length > 0
                          ? attendance.note
                          : t("attendance.table.noNote", "No note provided")}
                      </td>
                          <td className="px-6 py-5 text-sm text-right" />
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
            </section>
        </>
      ) : (
        <>
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                {t("attendance.filters.clinic", "Clinic")}
                <select
                  value={explanationClinicFilter}
                  onChange={(e) => setExplanationClinicFilter(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    aria-label={t("attendance.filters.clinic", "Clinic")}
                >
                  <option value="all">{t("attendance.filters.allClinics", "All clinics")}</option>
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
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:-translate-y-0.5 hover:bg-blue-700"
                >
                  {t("attendance.actions.refresh", "Refresh")}
                </button>
              </div>
            </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {loadingExplanations ? (
                <div className="px-5 py-8 text-center text-slate-500">
                {t("attendance.messages.loading", "Loading attendance records...")}
              </div>
            ) : pendingExplanations.length === 0 ? (
                <div className="px-5 py-8 text-center text-slate-500">
                {t("attendance.messages.noPendingExplanations", "No pending explanations")}
              </div>
            ) : (
                <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                      {t("attendance.table.employee", "Employee")}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                      {t("attendance.table.clinic", "Clinic")}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                      {t("attendance.table.workDate", "Work Date")}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                      {t("attendance.explanation.type", "Type")}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                      {t("attendance.explanation.reason", "Reason")}
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wide text-slate-500">
                      {t("attendance.table.status", "Status")}
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-semibold uppercase tracking-wide text-slate-500">
                      {t("attendance.table.actions", "Actions")}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingExplanations.map((explanation) => (
                    <tr key={explanation.attendanceId} className="transition hover:bg-slate-50">
                      <td className="px-6 py-5 text-base text-slate-900">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-lg font-semibold text-slate-500">
                            {(explanation.userName || explanation.userId.toString()).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-base font-semibold text-slate-900">
                              {explanation.userName || `#${explanation.userId}`}
                            </div>
                            <div className="text-xs uppercase tracking-wide text-slate-400">
                              {t("attendance.table.employeeId", { defaultValue: "ID" })}: {explanation.userId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-base text-slate-700">
                        {explanation.clinicName || t("attendance.table.unknownClinic", "Unknown clinic")}
                      </td>
                      <td className="px-6 py-5 text-base text-slate-700">{explanation.workDate}</td>
                      <td className="px-6 py-5 text-base font-medium text-slate-900">
                        {getExplanationTypeLabel(explanation.explanationType)}
                      </td>
                      <td className="px-6 py-5 text-base text-slate-700 max-w-xs">
                        <div className="truncate" title={explanation.employeeReason || ""}>
                          {explanation.employeeReason || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-base font-medium">
                        <span className="inline-flex items-center rounded-full border border-amber-100 bg-amber-50 px-4 py-1.5 text-sm font-semibold text-amber-700">
                          {t("attendance.explanation.status.pending", "Pending")}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-base text-right space-y-3">
                        <textarea
                          rows={2}
                              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                          placeholder={t("attendance.messages.addAdminNotePlaceholder", "Add admin note (optional)")}
                          value={actionNotes[explanation.attendanceId] || ""}
                          onChange={(e) => handleNoteChange(explanation.attendanceId, e.target.value)}
                        />
                            <div className="flex flex-col gap-2 md:flex-row md:justify-end">
                          <button
                            onClick={() => handleProcessExplanation(explanation, "APPROVE")}
                                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5 hover:bg-emerald-700"
                          >
                            {t("attendance.actions.approve", "Approve")}
                          </button>
                          <button
                            onClick={() => handleProcessExplanation(explanation, "REJECT")}
                                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:-translate-y-0.5 hover:bg-rose-700"
                          >
                            {t("attendance.actions.rejectExplanation", "Reject")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
                </div>
            )}
            </section>
        </>
      )}
      </div>
    </div>
  );
}

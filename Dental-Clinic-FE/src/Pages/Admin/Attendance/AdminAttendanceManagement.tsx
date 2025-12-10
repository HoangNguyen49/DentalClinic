import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import type { ReactNode } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from "react-i18next";
import { Calendar, Building2, SlidersHorizontal, CheckCircle2, Clock3, XCircle, FileText } from "lucide-react";
import { useNotification } from "../../../app/providers/NotificationContext";
import { adminApi, type AdminClinic, type AttendanceResponse } from "../../../services/admin/adminApi";
import { formatTime, formatDateInput } from "../../../utils/adminUtils";
import { useAdminApi } from "../../../hooks/useAdminApi";

// Định nghĩa option trạng thái chấm công
type StatusOption = {
  value: string;
  label: string;
};

const STATUS_OPTIONS: StatusOption[] = [
  { value: "LATE", label: "Late" },
  { value: "ABSENT", label: "Absent" },
  { value: "APPROVED_ABSENCE", label: "Approved Leave" },
  { value: "APPROVED_LATE", label: "Approved Late" },
  { value: "ON_TIME", label: "On Time" },
];

// Chuẩn hoá nhãn trạng thái chấm công (có hỗ trợ dịch)
function normalizeStatus(
  status?: string | null,
  translate?: (key: string, defaultValue?: string) => string
) {
  if (!status) return "-";
  switch (status) {
    case "ON_TIME":
      return translate
        ? translate("attendance.statusOptions.ON_TIME", "On Time")
        : "On Time";
    case "LATE":
      return translate ? translate("attendance.statusOptions.LATE", "Late") : "Late";
    case "ABSENT":
      return translate
        ? translate("attendance.statusOptions.ABSENT", "Absent")
        : "Absent";
    case "APPROVED_ABSENCE":
      return translate
        ? translate("attendance.statusOptions.APPROVED_ABSENCE", "Approved Leave")
        : "Approved Leave";
    case "APPROVED_LATE":
      return translate
        ? translate("attendance.statusOptions.APPROVED_LATE", "Approved Late")
        : "Approved Late";
    default:
      return translate
        ? translate("attendance.statusOptions.UNKNOWN", status)
        : status;
  }
}

export default function AdminAttendanceManagement() {
  const { t } = useTranslation("admin");

  // State lưu danh sách phòng khám
  const [clinics, setClinics] = useState<AdminClinic[]>([]);
  // State lưu danh sách chấm công
  const [attendances, setAttendances] = useState<AttendanceResponse[]>([]);
  // State cho các filter hiện tại
  const [filters, setFilters] = useState({
    date: formatDateInput(new Date()),
    clinicId: "all",
    status: "all",
  });

  const translateStatusLabel = (key: string, defaultValue?: string) =>
    t(key, defaultValue ?? key);

  // Danh sách trạng thái filter có dịch i18n
  const filteredStatusOptions = useMemo(() => {
    return STATUS_OPTIONS.map((opt) => ({
      ...opt,
      label: t(`attendance.statusOptions.${opt.value}`, opt.label),
    }));
  }, [t]);

  const { execute: executeClinics } = useAdminApi<AdminClinic[]>();
  const { loading, execute } = useAdminApi<AttendanceResponse[]>();

  // Hàm lấy danh sách phòng khám
  const fetchClinics = async () => {
    await executeClinics(
      () => adminApi.clinics.getAll(),
      {
        showErrorToast: true,
        errorMessage: t("attendance.messages.loadClinicsFailed", "Unable to load clinics"),
        onSuccess: (data) => {
          setClinics(data || []);
        },
      }
    );
  };

  // Hàm lấy danh sách chấm công theo filter
  const fetchAttendance = async () => {
    const params: {
      date?: string;
      clinicId?: number;
      status?: string;
    } = {};
    if (filters.date) params.date = filters.date;
    if (filters.status && filters.status !== "all") params.status = filters.status;
    if (filters.clinicId && filters.clinicId !== "all") params.clinicId = parseInt(filters.clinicId, 10);

    await execute(
      () => adminApi.attendance.getAll(params),
      {
        showErrorToast: true,
        errorMessage: t("attendance.messages.loadFailed", "Unable to load attendance records"),
        onSuccess: (data) => {
          setAttendances(data || []);
        },
      }
    );
  };

  // Lấy danh sách phòng khám khi component mount
  useEffect(() => {
    fetchClinics();
  }, []);

  // Lấy danh sách chấm công khi các filter thay đổi
  useEffect(() => {
    fetchAttendance();
  }, [filters]);

  const { notifications } = useNotification();
  const lastNotificationIdRef = useRef<number | null>(null);

  // Theo dõi thông báo để tự động làm mới danh sách chấm công khi có thay đổi/chấm công mới
  useEffect(() => {
    if (!notifications || notifications.length === 0) return;

    const latestNotification = notifications[0];
    if (!latestNotification || latestNotification.notificationId === lastNotificationIdRef.current) {
      return;
    }

    // Nếu thông báo liên quan đến chấm công
    if (latestNotification.relatedEntityType === "ATTENDANCE") {
      lastNotificationIdRef.current = latestNotification.notificationId;
      // Làm mới lại dữ liệu ngay lập tức
      fetchAttendance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]);

  // Bảng màu (chủ đề UI)
  const palette = {
    background: "bg-slate-50",
    surface: "bg-white",
    border: "border-slate-200",
    subtleText: "text-slate-500",
    heading: "text-slate-900",
  };

  // Đổi class hiển thị badge trạng thái theo loại trạng thái chấm công
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

  // Tính toán tổng kết (summary) số lượng record từng loại
  const attendanceSummary = useMemo(() => {
    const summary = {
      total: attendances.length,
      onTime: 0,
      late: 0,
      absent: 0,
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
  }, [attendances]);

  // Xử lý thay đổi giá trị filter (ngày, phòng khám, trạng thái)
  const handleFilterChange = useCallback((field: "date" | "clinicId" | "status", value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Component chung cho mỗi filter (có nhãn, icon, và nội dung control)
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

  // Component thẻ tổng kết (SummaryCard) cho từng loại số liệu trạng thái chấm công
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

        {/* Bảng danh sách chấm công */}
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
                  // Render từng dòng dữ liệu chấm công
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
                        {formatTime(attendance.checkInTime)}
                      </td>
                      <td className="px-6 py-5 text-base text-slate-700">
                        {formatTime(attendance.checkOutTime)}
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
      </div>
    </div>
  );
}

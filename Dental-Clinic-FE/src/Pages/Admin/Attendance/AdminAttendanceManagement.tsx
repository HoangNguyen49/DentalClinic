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

  // Đổi class hiển thị badge trạng thái theo loại trạng thái chấm công
  const statusBadgeClass = (status?: string | null) => {
    switch (status) {
      case "ON_TIME":
        return "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-200/50";
      case "LATE":
        return "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-200/50";
      case "ABSENT":
        return "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-200/50";
      case "APPROVED_ABSENCE":
      case "APPROVED_LATE":
        return "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200/50";
      default:
        return "bg-gradient-to-r from-slate-500 to-gray-600 text-white shadow-lg shadow-slate-200/50";
    }
  };

  // Type mở rộng để lưu thông tin về các ca
  type ExtendedAttendanceResponse = AttendanceResponse & {
    _shiftsInfo?: Array<{
      status: string;
      checkIn: string | null | undefined;
      checkOut: string | null | undefined;
      id: number;
    }>;
    _hasMultipleShifts?: boolean;
  };

  // Group và merge các bản ghi của cùng một nhân viên trong cùng một ngày thành một dòng
  const groupedAttendances = useMemo(() => {
    const grouped = new Map<string, AttendanceResponse[]>();
    
    attendances.forEach((item) => {
      // Key: userId + workDate để group các bản ghi của cùng một nhân viên trong cùng một ngày
      const key = `${item.userId}-${item.workDate}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(item);
    });
    
    // Merge các bản ghi của cùng một nhân viên trong cùng một ngày thành một item duy nhất
    const result: ExtendedAttendanceResponse[] = [];
    grouped.forEach((items) => {
      // Sắp xếp theo id để có thứ tự nhất quán
      items.sort((a, b) => (a.id || 0) - (b.id || 0));
      
      // Nếu chỉ có 1 item, giữ nguyên
      if (items.length === 1) {
        result.push(items[0]);
      } else {
        // Merge nhiều items thành một
        const firstItem = items[0];
        
        // Xác định status chính (ưu tiên: ON_TIME > APPROVED_LATE > LATE > APPROVED_ABSENCE > ABSENT)
        const statusPriority: Record<string, number> = {
          "ON_TIME": 1,
          "APPROVED_LATE": 2,
          "LATE": 3,
          "APPROVED_ABSENCE": 4,
          "ABSENT": 5,
        };
        const mainStatus = items.reduce((prev, curr) => {
          const prevPriority = statusPriority[prev.attendanceStatus || ""] || 99;
          const currPriority = statusPriority[curr.attendanceStatus || ""] || 99;
          return currPriority < prevPriority ? curr : prev;
        });
        
        // Lưu thông tin về các ca để hiển thị
        const shiftsInfo = items.map(item => ({
          status: item.attendanceStatus || "",
          checkIn: item.checkInTime,
          checkOut: item.checkOutTime,
          id: item.id,
        }));
        
        // Gộp notes
        const notes = items
          .map(item => item.note)
          .filter(n => n && n.trim() !== "");
        const mergedNote = notes.join("; ") || firstItem.note || "";
        
        const mergedItem: ExtendedAttendanceResponse = {
          ...firstItem,
          // Sử dụng status chính (nếu có nhiều status khác nhau, vẫn dùng status chính)
          attendanceStatus: mainStatus.attendanceStatus,
          // Gộp check-in/check-out (lấy sớm nhất và muộn nhất)
          checkInTime: items
            .map(item => item.checkInTime)
            .filter(Boolean)
            .sort()
            [0] || null,
          checkOutTime: items
            .map(item => item.checkOutTime)
            .filter(Boolean)
            .sort()
            .reverse()
            [0] || null,
          // Gộp notes
          note: mergedNote,
          // Lưu thông tin về các ca
          _shiftsInfo: shiftsInfo,
          _hasMultipleShifts: items.length > 1,
        };
        result.push(mergedItem);
      }
    });
    
    return result;
  }, [attendances]);

  // Tính toán tổng kết (summary) số lượng record từng loại dựa trên grouped list
  const attendanceSummary = useMemo(() => {
    const summary = {
      total: groupedAttendances.length,
      onTime: 0,
      late: 0,
      absent: 0,
    };

    groupedAttendances.forEach((record) => {
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
  }, [groupedAttendances]);

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
    <label className="flex flex-col gap-2 group">
      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-3 rounded-xl border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50 px-4 py-3.5 shadow-sm group-focus-within:border-blue-500 group-focus-within:ring-4 group-focus-within:ring-blue-100 group-focus-within:shadow-md transition-all duration-200">
        <span className="text-slate-400 group-focus-within:text-blue-500 transition-colors">{icon}</span>
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
      { gradient: string; iconBg: string; ring: string }
    > = {
      emerald: {
        gradient: "from-green-50 via-emerald-50 to-teal-50", 
        iconBg: "from-green-500 to-emerald-600", 
        ring: "ring-green-100"
      },
      amber: {
        gradient: "from-orange-50 via-amber-50 to-yellow-50", 
        iconBg: "from-orange-500 to-amber-600", 
        ring: "ring-orange-100"
      },
      rose: {
        gradient: "from-red-50 via-rose-50 to-pink-50", 
        iconBg: "from-red-500 to-rose-600", 
        ring: "ring-red-100"
      },
      slate: {
        gradient: "from-slate-50 via-gray-50 to-slate-50", 
        iconBg: "from-slate-600 to-gray-700", 
        ring: "ring-slate-100"
      },
    };

    const tones = toneMap[tone];

    return (
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${tones.gradient} p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-white/50`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/30 rounded-full -mr-16 -mt-16"></div>
        <div className="relative flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">{label}</p>
            <p className="text-4xl font-bold text-slate-900 mb-1">{value}</p>
          </div>
          <div className={`p-4 rounded-2xl bg-gradient-to-br ${tones.iconBg} shadow-lg ring-4 ${tones.ring}`}>
            <span className="text-white">{icon}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 p-8">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-7xl mx-auto space-y-8">
        <section className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg ring-4 ring-blue-100">
            <Calendar className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {t("pageTitles.attendanceManagement", "Attendance Management")}
              </h1>
            <p className="text-sm text-gray-600 font-medium mt-1">{t("attendance.pageDescription", "Track and manage employee attendance")}</p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={<FileText className="h-5 w-5" />}
            label={t("attendance.summary.total", "Total Records")}
            value={attendanceSummary.total}
            tone="slate"
          />
          <SummaryCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            label={t("attendance.summary.onTime", "On Time")}
            value={attendanceSummary.onTime}
            tone="emerald"
          />
          <SummaryCard
            icon={<Clock3 className="h-5 w-5" />}
            label={t("attendance.summary.late", "Late")}
            value={attendanceSummary.late}
            tone="amber"
          />
          <SummaryCard
            icon={<XCircle className="h-5 w-5" />}
            label={t("attendance.summary.absent", "Absent")}
            value={attendanceSummary.absent}
            tone="rose"
          />
        </section>

        <section className="rounded-2xl border border-slate-200/60 bg-white/90 backdrop-blur-sm p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
              <SlidersHorizontal className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Filter Options</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <FilterField
              label={t("attendance.filters.date", "Date")}
              icon={<Calendar className="h-4 w-4" />}
            >
              <input
                type="date"
                value={filters.date}
                onChange={(e) => handleFilterChange("date", e.target.value)}
                className="w-full border-none bg-transparent text-sm text-slate-900 focus:outline-none"
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
                className="w-full border-none bg-transparent text-sm text-slate-900 focus:outline-none"
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
                className="w-full border-none bg-transparent text-sm text-slate-900 focus:outline-none"
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
        <section className="rounded-2xl border border-slate-200/60 bg-white/90 backdrop-blur-sm shadow-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200/60 bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Attendance Records</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
                    {t("attendance.table.employee", "Employee")}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
                    {t("attendance.table.clinic", "Clinic")}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
                    {t("attendance.table.workDate", "Work Date")}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
                    {t("attendance.table.checkIn", "Check-in")}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
                    {t("attendance.table.checkOut", "Check-out")}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
                    {t("attendance.table.status", "Status")}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-700">
                    {t("attendance.table.note", "Note")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        <span>{t("attendance.messages.loading", "Loading attendance records...")}</span>
                      </div>
                    </td>
                  </tr>
                ) : groupedAttendances.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      {t("attendance.messages.noData", "No attendance records found")}
                    </td>
                  </tr>
                ) : (
                  // Render từng dòng dữ liệu chấm công (đã được group và merge)
                  groupedAttendances.map((attendance) => (
                    <tr key={attendance.id} className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/20 transition-all duration-200">
                      <td className="px-6 py-5 text-sm text-slate-900">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-base font-bold text-white shadow-lg ring-4 ring-blue-100">
                            {(attendance.userName || attendance.userId.toString()).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-base">
                              {attendance.userName || `#${attendance.userId}`}
                            </div>
                            <div className="text-sm text-slate-500">
                              ID: {attendance.userId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-700">
                        {attendance.clinicName || t("attendance.table.unknownClinic", "Unknown clinic")}
                      </td>
                      <td className="px-6 py-5 text-sm font-medium text-slate-700">{attendance.workDate}</td>
                      <td className="px-6 py-5 text-sm text-slate-700">
                        <span className="font-mono">{formatTime(attendance.checkInTime)}</span>
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-700">
                        <span className="font-mono">{formatTime(attendance.checkOutTime)}</span>
                      </td>
                      <td className="px-6 py-5 text-sm">
                        {(() => {
                          const extendedAttendance = attendance as ExtendedAttendanceResponse;
                          const hasMultipleShifts = extendedAttendance._hasMultipleShifts;
                          const shiftsInfo = extendedAttendance._shiftsInfo;
                          
                          if (hasMultipleShifts && shiftsInfo && shiftsInfo.length > 1) {
                            // Hiển thị nhiều status nếu có nhiều ca
                            return (
                              <div className="flex flex-col gap-1.5">
                                <span
                                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(
                                    attendance.attendanceStatus
                                  )}`}
                                >
                                  {normalizeStatus(attendance.attendanceStatus, translateStatusLabel)}
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {shiftsInfo.map((shift, idx) => (
                                    <span
                                      key={shift.id || idx}
                                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(shift.status)}`}
                                      title={`${formatTime(shift.checkIn)} - ${formatTime(shift.checkOut)}`}
                                    >
                                      {normalizeStatus(shift.status, translateStatusLabel)}
                                    </span>
                                  ))}
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                  {shiftsInfo.map((shift, idx) => {
                                    const checkIn = shift.checkIn ? formatTime(shift.checkIn) : "-";
                                    const checkOut = shift.checkOut ? formatTime(shift.checkOut) : "-";
                                    return `Ca ${idx + 1}: ${checkIn} - ${checkOut}`;
                                  }).join(" | ")}
                                </div>
                              </div>
                            );
                          }
                          
                          // Hiển thị status bình thường nếu chỉ có 1 ca
                          return (
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(
                                attendance.attendanceStatus
                              )}`}
                            >
                              {normalizeStatus(attendance.attendanceStatus, translateStatusLabel)}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-5 text-sm text-slate-600">
                        {attendance.note && attendance.note.trim().length > 0
                          ? attendance.note
                          : <span className="italic text-slate-400">{t("attendance.table.noNote", "No note provided")}</span>}
                      </td>
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

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

type StatusOption = {
  value: string;
  label: string;
};

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";

const STATUS_OPTIONS: StatusOption[] = [
  { value: "LATE", label: "Late" },
  { value: "ABSENT", label: "Absent" },
  { value: "APPROVED_ABSENCE", label: "Approved Leave" },
  { value: "ON_TIME", label: "On Time" },
];

function formatDateInput(date: Date) {
  return date.toISOString().split("T")[0];
}

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
    default:
      return status;
  }
}

export default function AdminAttendanceManagement() {
  const { t } = useTranslation("admin");
  const accessToken = localStorage.getItem("accessToken");

  const [clinics, setClinics] = useState<AdminClinic[]>([]);
  const [attendances, setAttendances] = useState<AttendanceResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    date: formatDateInput(new Date()),
    clinicId: "all",
    status: "LATE",
  });

  const filteredStatusOptions = useMemo(() => {
    return STATUS_OPTIONS.map((opt) => ({
      ...opt,
      label: t(`attendance.status.${opt.value}`, opt.label),
    }));
  }, [t]);

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

  useEffect(() => {
    if (!accessToken) {
      toast.error(t("attendance.messages.noAccessToken", "Missing access token"));
      return;
    }
    fetchClinics();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    fetchAttendance();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleFilterChange = (field: "date" | "clinicId" | "status", value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

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

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("pageTitles.attendanceManagement", "Attendance Management")}
        </h1>
        <p className="text-sm text-gray-600">
          {t(
            "attendance.pageDescription",
            "Review late check-ins or leave requests submitted by employees, update their status, and append admin notes."
          )}
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
            {t("attendance.filters.date", "Date")}
            <input
              type="date"
              value={filters.date}
              onChange={(e) => handleFilterChange("date", e.target.value)}
              className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
            {t("attendance.filters.clinic", "Clinic")}
            <select
              value={filters.clinicId}
              onChange={(e) => handleFilterChange("clinicId", e.target.value)}
              className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t("attendance.filters.allClinics", "All clinics")}</option>
              {clinics.map((clinic) => (
                <option key={clinic.id} value={clinic.id}>
                  {clinic.clinicName}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
            {t("attendance.filters.status", "Status")}
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t("attendance.filters.allStatus", "All statuses")}</option>
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
                {t("attendance.table.employee", "Employee")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t("attendance.table.clinic", "Clinic")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t("attendance.table.workDate", "Work Date")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t("attendance.table.checkIn", "Check-in")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t("attendance.table.checkOut", "Check-out")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t("attendance.table.status", "Status")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t("attendance.table.note", "Note")}
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t("attendance.table.actions", "Actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                  {t("attendance.messages.loading", "Loading attendance records...")}
                </td>
              </tr>
            ) : attendances.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                  {t("attendance.messages.noData", "No attendance records found")}
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
                    {attendance.clinicName || t("attendance.table.unknownClinic", "Unknown clinic")}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{attendance.workDate}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {formatDateTime(attendance.checkInTime)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {formatDateTime(attendance.checkOutTime)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">
                    {t(`attendance.status.${attendance.attendanceStatus || "UNKNOWN"}`, normalizeStatus(attendance.attendanceStatus))}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 whitespace-pre-line">
                    {attendance.note && attendance.note.trim().length > 0
                      ? attendance.note
                      : t("attendance.table.noNote", "No note provided")}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">{renderActionButton(attendance)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


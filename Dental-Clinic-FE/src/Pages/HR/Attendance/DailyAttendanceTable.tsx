import { useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { X, Eye } from "lucide-react";
import { toast } from "react-toastify";

type DailyAttendanceItem = {
  id: number | null;
  userId: number;
  employeeName: string;
  jobTitle: string;
  avatarUrl?: string;
  status: string;
  statusColor: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  shiftDisplay: string;
  shiftHours: string;
  workedHours: number;
  workedMinutes: number;
  workedDisplay: string;
  remarks: string;
};

type AttendanceDetail = {
  id: number;
  userId: number;
  userName?: string;
  userAvatarUrl?: string;
  clinicId: number;
  clinicName?: string;
  workDate: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  checkInMethod?: string;
  attendanceStatus?: string;
  verificationStatus?: string;
  shiftType?: string;
  actualWorkHours?: number;
  expectedWorkHours?: number;
  isOvertime?: boolean;
  note?: string;
  faceMatchScore?: number;
};

type DailyAttendanceTableProps = {
  items: DailyAttendanceItem[];
  hasShift: boolean;
  hasWorked: boolean;
  hasRemarks: boolean;
};

export default function DailyAttendanceTable({
  items,
  hasShift,
  hasWorked,
  hasRemarks,
}: DailyAttendanceTableProps) {
  const { t } = useTranslation("attendance");
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const accessToken = localStorage.getItem("accessToken");
  const [selectedAttendanceId, setSelectedAttendanceId] = useState<number | null>(null);
  const [attendanceDetail, setAttendanceDetail] = useState<AttendanceDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  
  // Định dạng giờ vào dạng 12h
  const formatTime = (timeStr: string | null): string => {
    if (!timeStr) return "-";
    const date = new Date(timeStr);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? "pm" : "am";
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, "0")}${period}`;
  };

  // Gán class css cho badge trạng thái
  const getStatusColor = (color: string): string => {
    const colors: Record<string, string> = {
      green: "bg-green-100 text-green-800",
      red: "bg-red-100 text-red-800",
      orange: "bg-orange-100 text-orange-800",
      blue: "bg-blue-100 text-blue-800",
      purple: "bg-purple-100 text-purple-800",
      gray: "bg-gray-100 text-gray-800",
    };
    return colors[color] || "bg-gray-100 text-gray-800";
  };

  // Lấy chi tiết chấm công khi click vào dòng có id
  const fetchAttendanceDetail = async (id: number) => {
    if (!accessToken || !apiBase) return;
    
    setLoadingDetail(true);
    setSelectedAttendanceId(id);
    try {
      const response = await axios.get<AttendanceDetail>(
        `${apiBase}/api/hr/attendance/${id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setAttendanceDetail(response.data);
    } catch (err: any) {
      console.error("Error fetching attendance detail:", err);
      toast.error(t("detail.fetchFailed", "Failed to load attendance details"));
      setSelectedAttendanceId(null);
      setAttendanceDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Đóng modal chi tiết
  const closeModal = () => {
    setSelectedAttendanceId(null);
    setAttendanceDetail(null);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              {t("table.id")}
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              {t("table.employeeName")}
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
              {t("table.status")}
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
              {t("table.checkIn")}
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
              {t("table.checkOut")}
            </th>
            {hasShift && (
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                {t("table.shift")}
              </th>
            )}
            {hasWorked && (
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                {t("table.worked")}
              </th>
            )}
            {hasRemarks && (
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                {t("table.remarks")}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr 
              key={item.id ? `attendance-${item.id}` : `user-${item.userId}-${index}`} 
              className="border-b hover:bg-gray-50 cursor-pointer"
              onClick={() => item.id && fetchAttendanceDetail(item.id)}
            >
              <td className="px-4 py-3 text-sm text-gray-700">
                <div className="flex items-center justify-center gap-2">
                  <span className="font-medium text-gray-600">
                    {item.id ? `#${item.id}` : `#${index + 1}`}
                  </span>
                  {item.id && (
                    <Eye className="w-4 h-4 text-gray-400 hover:text-blue-600 transition-colors" />
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {item.avatarUrl ? (
                    <img
                      src={item.avatarUrl}
                      alt={item.employeeName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-sm font-semibold">
                        {item.employeeName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {item.employeeName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.jobTitle}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-center">
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                    item.statusColor
                  )}`}
                >
                  {item.status}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-center text-gray-700">
                {formatTime(item.checkInTime)}
              </td>
              <td className="px-4 py-3 text-sm text-center text-gray-700">
                {formatTime(item.checkOutTime)}
              </td>
              {hasShift && (
                <td className="px-4 py-3 text-center">
                  <div className="text-sm text-gray-700">
                    {item.shiftDisplay || "-"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.shiftHours || ""}
                  </div>
                </td>
              )}
              {hasWorked && (
                <td className="px-4 py-3 text-sm text-center text-gray-700">
                  {typeof item.workedHours === "number" && item.workedHours > 0
                    ? `${item.workedHours.toFixed(2)} h`
                    : item.workedDisplay && item.workedDisplay !== "0 hr 00 min"
                      ? item.workedDisplay
                      : "-"}
                </td>
              )}
              {hasRemarks && (
                <td className="px-4 py-3 text-sm text-gray-700">
                  {item.remarks && item.remarks !== "Fixed Attendance" ? item.remarks : "-"}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {t("table.noAttendanceRecordsFound")}
        </div>
      )}
      {/* Hiển thị popup modal chi tiết chấm công nếu có */}
      {selectedAttendanceId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                {t("detail.title", "Attendance Details")}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title={t("detail.close", "Close")}
                aria-label={t("detail.close", "Close")}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              {loadingDetail ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">{t("detail.loading", "Loading...")}</p>
                </div>
              ) : attendanceDetail ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">{t("detail.workDate", "Work Date")}</label>
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(attendanceDetail.workDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">{t("detail.status", "Status")}</label>
                      <div className="text-sm font-medium text-gray-900">
                        {attendanceDetail.attendanceStatus || "-"}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">{t("detail.checkIn", "Check In")}</label>
                      <div className="text-sm font-medium text-gray-900">
                        {attendanceDetail.checkInTime 
                          ? new Date(attendanceDetail.checkInTime).toLocaleString() 
                          : "-"}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">{t("detail.checkOut", "Check Out")}</label>
                      <div className="text-sm font-medium text-gray-900">
                        {attendanceDetail.checkOutTime 
                          ? new Date(attendanceDetail.checkOutTime).toLocaleString() 
                          : "-"}
                      </div>
                    </div>
                    {attendanceDetail.actualWorkHours !== undefined && 
                     attendanceDetail.actualWorkHours !== null && 
                     typeof attendanceDetail.actualWorkHours === 'number' && (
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">{t("detail.actualHours", "Actual Work Hours")}</label>
                        <div className="text-sm font-medium text-gray-900">
                          {attendanceDetail.actualWorkHours.toFixed(2)} {t("detail.hours", "hours")}
                        </div>
                      </div>
                    )}
                    {attendanceDetail.expectedWorkHours !== undefined &&
                     attendanceDetail.expectedWorkHours !== null &&
                     typeof attendanceDetail.expectedWorkHours === 'number' && (
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">{t("detail.expectedHours", "Expected Work Hours")}</label>
                        <div className="text-sm font-medium text-gray-900">
                          {attendanceDetail.expectedWorkHours.toFixed(2)} {t("detail.hours", "hours")}
                        </div>
                      </div>
                    )}
                    {attendanceDetail.shiftType && (
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">{t("detail.shiftType", "Shift Type")}</label>
                        <div className="text-sm font-medium text-gray-900">
                          {attendanceDetail.shiftType}
                        </div>
                      </div>
                    )}
                  </div>
                  {attendanceDetail.note && (
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">{t("detail.note", "Note")}</label>
                      <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                        {attendanceDetail.note}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {t("detail.notFound", "Attendance not found")}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

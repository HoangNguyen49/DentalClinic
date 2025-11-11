import { useTranslation } from "react-i18next";

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
  
  const formatTime = (timeStr: string | null): string => {
    if (!timeStr) return "Null";
    const date = new Date(timeStr);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? "pm" : "am";
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}.${minutes.toString().padStart(2, "0")}${period}`;
  };

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
            <tr key={item.userId} className="border-b hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-700">
                {item.id || index + 1}
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
                  {item.workedDisplay && item.workedDisplay !== "0 hr 00 min" ? item.workedDisplay : "-"}
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
    </div>
  );
}


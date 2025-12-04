import { useTranslation } from "react-i18next";

export type MonthlyAttendanceItem = {
  userId: number;
  employeeName: string;
  jobTitle: string;
  avatarUrl?: string;
  workingDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  leaveDays: number;
  offDays: number;
  totalWorkedHours: number;
  totalWorkedMinutes: number;
  totalWorkedDisplay: string;
  // Thông tin cho tính lương theo giờ
  totalLateMinutes?: number;   // Tổng số phút đi trễ trong tháng
  totalEarlyMinutes?: number;  // Tổng số phút ra sớm trong tháng
  actualWorkedDays?: number;   // Số ngày đi làm thực tế (có check-in)
};

type MonthlyAttendanceTableProps = {
  items: MonthlyAttendanceItem[];
};

const formatHourValue = (value: number) => {
  if (!Number.isFinite(value)) return "0";
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1);
};

const formatWorkedHours = (item: MonthlyAttendanceItem): string => {
  // Ưu tiên sử dụng totalWorkedDisplay từ backend
  if (item.totalWorkedDisplay) {
    return item.totalWorkedDisplay;
  }
  
  // Fallback: tính từ totalWorkedHours và totalWorkedMinutes
  const totalHours = (item.totalWorkedHours || 0) + (item.totalWorkedMinutes || 0) / 60;
  return `${formatHourValue(totalHours)} h`;
};

export default function MonthlyAttendanceTable({ items }: MonthlyAttendanceTableProps) {
  const { t } = useTranslation("attendance");

  const totals = items.reduce(
    (acc, item) => {
      const totalMinutes =
        (item.totalWorkedHours || 0) * 60 + (item.totalWorkedMinutes || 0);
      acc.workingDays += item.workingDays || 0;
      acc.presentDays += item.presentDays || 0;
      acc.absentDays += item.absentDays || 0;
      acc.leaveDays += item.leaveDays || 0;
      acc.lateDays += item.lateDays || 0;
      acc.workedHours += totalMinutes / 60;
      acc.totalLateMinutes += item.totalLateMinutes || 0;
      acc.totalEarlyMinutes += item.totalEarlyMinutes || 0;
      acc.actualWorkedDays += item.actualWorkedDays || 0;
      return acc;
    },
    {
      workingDays: 0,
      presentDays: 0,
      absentDays: 0,
      leaveDays: 0,
      lateDays: 0,
      workedHours: 0,
      totalLateMinutes: 0,
      totalEarlyMinutes: 0,
      actualWorkedDays: 0,
    }
  );
  
  const formatMinutes = (minutes: number): string => {
    if (!minutes || minutes === 0) return "0";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">{t("table.employeeName")}</th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">{t("table.actualWorkedDays", "Số ngày đi làm")}</th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">{t("table.presentDays")}</th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">{t("table.lateDays")}</th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">{t("table.absentDays")}</th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">{t("table.leaveDays")}</th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">{t("table.totalLateMinutes", "Tổng phút trễ")}</th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">{t("table.totalEarlyMinutes", "Tổng phút sớm")}</th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">{t("table.totalWorked", "Tổng giờ làm")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            return (
              <tr key={item.userId} className="border-b hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {item.avatarUrl ? (
                      <img
                        src={item.avatarUrl}
                        alt={item.employeeName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                        {item.employeeName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.employeeName}</p>
                      <p className="text-xs text-gray-500">{item.jobTitle || t("table.unknownRole")}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center text-blue-600 font-medium">{(item.actualWorkedDays ?? item.workingDays) ?? 0}</td>
                <td className="px-4 py-3 text-center text-green-600 font-medium">{item.presentDays || 0}</td>
                <td className="px-4 py-3 text-center text-orange-500 font-medium">{item.lateDays || 0}</td>
                <td className="px-4 py-3 text-center text-rose-600 font-medium">{item.absentDays || 0}</td>
                <td className="px-4 py-3 text-center text-amber-600 font-medium">{item.leaveDays || 0}</td>
                <td className="px-4 py-3 text-center text-red-600 font-medium">{formatMinutes(item.totalLateMinutes || 0)}</td>
                <td className="px-4 py-3 text-center text-orange-600 font-medium">{formatMinutes(item.totalEarlyMinutes || 0)}</td>
                <td className="px-4 py-3 text-center text-gray-900 font-semibold">
                  {formatWorkedHours(item)}
                </td>
              </tr>
            );
          })}
          {items.length > 0 && (
            <tr className="bg-gray-100 border-t-2 border-gray-300 font-semibold">
              <td className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                {t("table.monthlyTotal", "Monthly Total")}
              </td>
              <td className="px-4 py-3 text-center text-sm text-blue-700">{totals.actualWorkedDays || totals.workingDays}</td>
              <td className="px-4 py-3 text-center text-sm text-green-700">{totals.presentDays}</td>
              <td className="px-4 py-3 text-center text-sm text-orange-600">{totals.lateDays}</td>
              <td className="px-4 py-3 text-center text-sm text-rose-700">{totals.absentDays}</td>
              <td className="px-4 py-3 text-center text-sm text-amber-700">{totals.leaveDays}</td>
              <td className="px-4 py-3 text-center text-sm text-red-700">{formatMinutes(totals.totalLateMinutes)}</td>
              <td className="px-4 py-3 text-center text-sm text-orange-700">{formatMinutes(totals.totalEarlyMinutes)}</td>
              <td className="px-4 py-3 text-center text-sm text-gray-900">
                {formatHourValue(totals.workedHours)} h
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {items.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          {t("table.noAttendanceRecordsFound")}
        </div>
      )}
    </div>
  );
}


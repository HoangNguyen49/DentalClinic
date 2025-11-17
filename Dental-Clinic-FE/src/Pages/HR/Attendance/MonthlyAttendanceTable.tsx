import { useTranslation } from "react-i18next";

type MonthlyAttendanceItem = {
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
};

type MonthlyAttendanceTableProps = {
  items: MonthlyAttendanceItem[];
};

export default function MonthlyAttendanceTable({ items }: MonthlyAttendanceTableProps) {
  const { t } = useTranslation("attendance");
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b">
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
              {t("table.employeeName")}
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
              {t("table.workingDays")}
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
              {t("table.presentDays")}
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
              {t("table.lateDays")}
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
              {t("table.absentDays")}
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
              {t("table.leaveDays")}
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
              {t("table.offDays")}
            </th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
              {t("table.totalWorked")}
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.userId} className="border-b hover:bg-gray-50">
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
              <td className="px-4 py-3 text-sm text-center text-gray-700">
                {item.workingDays}
              </td>
              <td className="px-4 py-3 text-sm text-center text-gray-700">
                {item.presentDays}
              </td>
              <td className="px-4 py-3 text-sm text-center text-gray-700">
                {item.lateDays}
              </td>
              <td className="px-4 py-3 text-sm text-center text-gray-700">
                {item.absentDays}
              </td>
              <td className="px-4 py-3 text-sm text-center text-gray-700">
                {item.leaveDays}
              </td>
              <td className="px-4 py-3 text-sm text-center text-gray-700">
                {item.offDays}
              </td>
              <td className="px-4 py-3 text-sm text-center text-gray-700">
                {item.totalWorkedDisplay}
              </td>
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


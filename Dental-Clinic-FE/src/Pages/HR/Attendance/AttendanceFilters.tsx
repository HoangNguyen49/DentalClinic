import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";

type Department = {
  id: number;
  departmentName: string;
};

type AttendanceFiltersProps = {
  viewMode: "daily" | "monthly";
  workDate: string;
  selectedYear: number;
  selectedMonth: number;
  onWorkDateChange: (date: string) => void;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
};

// Bộ lọc giao diện trên đầu trang, chọn theo ngày hoặc theo tháng
export default function AttendanceFilters({
  viewMode,
  workDate,
  selectedYear,
  selectedMonth,
  onWorkDateChange,
  onYearChange,
  onMonthChange,
}: AttendanceFiltersProps) {
  const { t } = useTranslation("attendance");
  
  return (
    <>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          {viewMode === "daily" ? "Daily Attendance" : "Monthly Attendance"}
        </h1>
        <div className="flex items-center gap-4">
          {viewMode === "daily" ? (
            <input
              type="date"
              value={workDate}
              onChange={(e) => onWorkDateChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Select Work Date"
              aria-label="Select Work Date"
            />
          ) : (
            <div className="flex items-center gap-2">
              <select
                value={selectedYear}
                onChange={(e) => onYearChange(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Select Year"
                aria-label="Select Year"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <select
                value={selectedMonth}
                onChange={(e) => onMonthChange(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Select Month"
                aria-label="Select Month"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option key={month} value={month}>
                    {new Date(2000, month - 1).toLocaleString("en-US", { month: "long" })}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Bộ lọc bên danh sách bảng chấm công
export function AttendanceListFilter({
  viewMode,
  selectedDepartment,
  searchTerm,
  departments,
  selectedYear,
  selectedMonth,
  onViewModeChange,
  onDepartmentChange,
  onSearchChange,
}: {
  viewMode: "daily" | "monthly";
  selectedDepartment: number | null;
  searchTerm: string;
  departments: Department[];
  selectedYear: number;
  selectedMonth: number;
  onViewModeChange: (mode: "daily" | "monthly") => void;
  onDepartmentChange: (deptId: number | null) => void;
  onSearchChange: (term: string) => void;
}) {
  // Tính số ngày làm việc trong tháng, không tính chủ nhật
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  let workingDaysExcludingSunday = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(selectedYear, selectedMonth - 1, day);
    if (date.getDay() !== 0) {
      workingDaysExcludingSunday++;
    }
  }
  
  return (
    <div className="flex justify-between items-center mb-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">
          {viewMode === "daily" ? "Daily Attendance List" : "Monthly Attendance List"}
        </h2>
        {viewMode === "monthly" && (
          <p className="text-sm text-gray-500 mt-1">
            {new Date(selectedYear, selectedMonth - 1, 1).toLocaleDateString("en-US", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}{" "}
            –{" "}
            {new Date(selectedYear, selectedMonth, 0).toLocaleDateString("en-US", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}{" "}
            ·{" "}
            {`Total working days: ${workingDaysExcludingSunday} (no Sundays)`}
          </p>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
        </div>
        <select
          value={selectedDepartment || ""}
          onChange={(e) =>
            onDepartmentChange(
              e.target.value ? parseInt(e.target.value) : null
            )
          }
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Filter by Department"
          aria-label="Filter by Department"
        >
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.departmentName}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <select 
            value={viewMode}
            onChange={(e) => onViewModeChange(e.target.value as "daily" | "monthly")}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Select Period"
            aria-label="Select Period"
          >
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>
    </div>
  );
}

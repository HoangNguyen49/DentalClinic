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
      {/* Header Filter */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          {viewMode === "daily" ? t("filters.dailyAttendance") : t("filters.monthlyAttendance")}
        </h1>
        <div className="flex items-center gap-4">
          {viewMode === "daily" ? (
            <input
              type="date"
              value={workDate}
              onChange={(e) => onWorkDateChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              title={t("filters.selectWorkDate")}
              aria-label={t("filters.selectWorkDate")}
            />
          ) : (
            <div className="flex items-center gap-2">
              <select
                value={selectedYear}
                onChange={(e) => onYearChange(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                title={t("filters.selectYear")}
                aria-label={t("filters.selectYear")}
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
                title={t("filters.selectMonth")}
                aria-label={t("filters.selectMonth")}
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

// Separate component for list filter
export function AttendanceListFilter({
  viewMode,
  selectedDepartment,
  searchTerm,
  departments,
  onViewModeChange,
  onDepartmentChange,
  onSearchChange,
}: {
  viewMode: "daily" | "monthly";
  selectedDepartment: number | null;
  searchTerm: string;
  departments: Department[];
  onViewModeChange: (mode: "daily" | "monthly") => void;
  onDepartmentChange: (deptId: number | null) => void;
  onSearchChange: (term: string) => void;
}) {
  const { t } = useTranslation("attendance");
  
  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-semibold text-gray-800">
        {viewMode === "daily" ? t("table.dailyAttendanceList") : t("table.monthlyAttendanceList")}
      </h2>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={t("filters.search")}
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
          title={t("filters.filterByDepartment")}
          aria-label={t("filters.filterByDepartment")}
        >
          <option value="">{t("filters.allDepartments")}</option>
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
            title={t("filters.selectPeriod")}
            aria-label={t("filters.selectPeriod")}
          >
            <option value="daily">{t("filters.daily")}</option>
            <option value="monthly">{t("filters.monthly")}</option>
          </select>
        </div>
      </div>
    </div>
  );
}


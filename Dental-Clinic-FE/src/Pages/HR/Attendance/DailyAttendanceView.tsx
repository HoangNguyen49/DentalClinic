import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from "react-i18next";
import AttendanceFilters, { AttendanceListFilter } from "../../../components/hr/AttendanceFilters";
import SummaryCards from "../../../components/hr/AttendanceSummaryCards";
import MonthlyChart from "./MonthlyChart";
import DailyAttendanceTable from "./DailyAttendanceTable";
import MonthlyAttendanceTable from "./MonthlyAttendanceTable";
import type { MonthlyAttendanceItem } from "./MonthlyAttendanceTable";
import Pagination from "../../../components/hr/AttendancePagination";
import * as XLSX from "xlsx";
import { FiDownload } from "react-icons/fi";

const formatHourValue = (value: number) => {
  if (!Number.isFinite(value)) return "0";
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1);
};

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";

type DailySummary = {
  departmentId: number;
  departmentName: string;
  totalEmployees: number;
  present: number;
  late: number;
  absent: number;
  leave: number;
  offday: number;
};

type MonthlySummary = {
  departmentId: number;
  departmentName: string;
  totalEmployees: number;
  workingDays: number;
  present: number;
  late: number;
  absent: number;
  leave: number;
  offday: number;
  totalAttendance: number;
};

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

type Department = {
  id: number;
  departmentName: string;
};

function DailyAttendanceView() {
  const { t } = useTranslation("attendance");
  const [viewMode, setViewMode] = useState<"daily" | "monthly">("daily");
  const [workDate, setWorkDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [dailySummary, setDailySummary] = useState<DailySummary[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary[]>([]);
  const [dailyList, setDailyList] = useState<DailyAttendanceItem[]>([]);
  const [monthlyList, setMonthlyList] = useState<MonthlyAttendanceItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // phân trang
  const [dailyPage, setDailyPage] = useState(0);
  const [dailySize, setDailySize] = useState(10);
  const [dailyTotalPages, setDailyTotalPages] = useState(0);
  const [dailyTotalElements, setDailyTotalElements] = useState(0);

  const [monthlyPage, setMonthlyPage] = useState(0);
  const [monthlySize, setMonthlySize] = useState(10);
  const [monthlyTotalPages, setMonthlyTotalPages] = useState(0);
  const [monthlyTotalElements, setMonthlyTotalElements] = useState(0);
  const [exporting, setExporting] = useState(false);

  // lưu dữ liệu tổng kết ngày trước để so sánh dashboard
  const [previousDailySummary, setPreviousDailySummary] = useState<DailySummary[]>([]);

  const accessToken = localStorage.getItem("accessToken");

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    // Tải dữ liệu theo viewMode, workDate, bộ lọc
    const loadData = async () => {
      setLoadingSummary(true);
      try {
        await fetchMonthlySummary();
        if (viewMode === "daily") {
          await fetchDailySummary();
          await fetchDailyList();
          // so sánh với dữ liệu ngày trước đó
          const prevDate = new Date(workDate);
          prevDate.setDate(prevDate.getDate() - 1);
          await fetchPreviousDailySummary(prevDate.toISOString().split("T")[0]);
        } else {
          await fetchMonthlyList();
        }
      } finally {
        setLoadingSummary(false);
      }
    };

    loadData();
  }, [
    viewMode,
    workDate,
    selectedYear,
    selectedMonth,
    selectedDepartment,
    dailyPage,
    dailySize,
    monthlyPage,
    monthlySize,
  ]);

  useEffect(() => {
    setDailyPage(0);
  }, [workDate, selectedDepartment]);

  useEffect(() => {
    setMonthlyPage(0);
  }, [selectedYear, selectedMonth, selectedDepartment]);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get<Department[]>(
        `${apiBase}/api/hr/management/departments`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      setDepartments(response.data || []);
    } catch (err: any) {
      // Chỉ log lỗi nếu không phải connection refused (backend chưa chạy)
      if (err.code !== "ERR_NETWORK" && err.code !== "ECONNREFUSED") {
        console.error("Failed to fetch departments:", err);
        toast.error(t("messages.failedToLoadDepartments", "Failed to load departments"));
      }
      // Nếu lỗi thì để bộ lọc department rỗng (không block UI)
      setDepartments([]);
    }
  };

  const fetchDailySummary = async () => {
    try {
      const response = await axios.get<DailySummary[]>(
        `${apiBase}/api/hr/attendance/daily-summary`,
        {
          params: { workDate },
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      setDailySummary(response.data);
    } catch (err: any) {
      toast.error(t("messages.failedToLoadDailySummary"));
      console.error(err);
    }
  };

  const fetchDailyList = async () => {
    setLoading(true);
    try {
      const params: any = { workDate, page: dailyPage, size: dailySize };
      if (selectedDepartment) {
        params.departmentId = selectedDepartment;
      }

      const response = await axios.get<{
        content: DailyAttendanceItem[];
        totalPages: number;
        totalElements: number;
        number: number;
        size: number;
      }>(
        `${apiBase}/api/hr/attendance/daily-list`,
        {
          params,
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      setDailyList(response.data.content || []);
      setDailyTotalPages(response.data.totalPages || 0);
      setDailyTotalElements(response.data.totalElements || 0);
    } catch (err: any) {
      toast.error(t("messages.failedToLoadDailyAttendanceList"));
      console.error(err);
      setDailyList([]);
      setDailyTotalPages(0);
      setDailyTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlySummary = async () => {
    try {
      const response = await axios.get<MonthlySummary[]>(
        `${apiBase}/api/hr/attendance/monthly-summary`,
        {
          params: { year: selectedYear, month: selectedMonth },
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      setMonthlySummary(response.data);
    } catch (err: any) {
      toast.error(t("messages.failedToLoadMonthlySummary"));
      console.error(err);
    }
  };

  const fetchMonthlyList = async () => {
    setLoading(true);
    try {
      const params: any = {
        year: selectedYear,
        month: selectedMonth,
        page: monthlyPage,
        size: monthlySize,
      };
      if (selectedDepartment) {
        params.departmentId = selectedDepartment;
      }

      const response = await axios.get<{
        content: MonthlyAttendanceItem[];
        totalPages: number;
        totalElements: number;
        number: number;
        size: number;
      }>(
        `${apiBase}/api/hr/attendance/monthly-list`,
        {
          params,
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      setMonthlyList(response.data.content || []);
      setMonthlyTotalPages(response.data.totalPages || 0);
      setMonthlyTotalElements(response.data.totalElements || 0);
    } catch (err: any) {
      toast.error(t("messages.failedToLoadMonthlyAttendanceList"));
      console.error(err);
      setMonthlyList([]);
      setMonthlyTotalPages(0);
      setMonthlyTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchPreviousDailySummary = async (prevDate: string) => {
    try {
      const response = await axios.get<DailySummary[]>(
        `${apiBase}/api/hr/attendance/daily-summary`,
        {
          params: { workDate: prevDate },
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      setPreviousDailySummary(response.data);
    } catch (err: any) {
      // lỗi lấy dữ liệu ngày trước, bỏ qua
      setPreviousDailySummary([]);
    }
  };

  // Tính tổng thống kê daily để phục vụ hiển thị dashboard
  const dailyTotals = dailySummary.reduce(
    (acc, item) => ({
      totalEmployees: acc.totalEmployees + item.totalEmployees,
      totalPresent: acc.totalPresent + item.present,
      totalLate: acc.totalLate + item.late,
      totalAbsent: acc.totalAbsent + item.absent,
      totalLeave: acc.totalLeave + item.leave,
      totalOffday: acc.totalOffday + item.offday,
    }),
    {
      totalEmployees: 0,
      totalPresent: 0,
      totalLate: 0,
      totalAbsent: 0,
      totalLeave: 0,
      totalOffday: 0,
    }
  );

  // lọc tìm kiếm tên nhân viên cho table
  const filteredDailyList = dailyList.filter((item) =>
    item.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredMonthlyList = monthlyList.filter((item) =>
    item.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // export file thống kê tháng
  const handleExportMonthly = useCallback(() => {
    if (!filteredMonthlyList.length) {
      toast.warn(t("messages.exportNoData", "No monthly attendance to export"));
      return;
    }

    try {
      setExporting(true);
      const startLabel = new Date(
        selectedYear,
        selectedMonth - 1,
        1
      ).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const endLabel = new Date(
        selectedYear,
        selectedMonth,
        0
      ).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
      let workingDaysExSunday = 0;
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(selectedYear, selectedMonth - 1, day);
        if (date.getDay() !== 0) {
          workingDaysExSunday++;
        }
      }
      const employeeLabel = t("table.employeeName", "Employee Name");
      const jobLabel = t("table.jobTitle", "Job Title");
      const leaveLabel = t("table.unpaidLeaveDays", "Unpaid Leave Days");
      const absentLabel = t("table.absentDays", "Absent Days");
      const lateLabel = t("table.lateDays", "Late Days");
      const monthlyLabel = t("table.monthlyTotal", "Monthly Total");

      const formatMinutes = (minutes: number): string => {
        if (!minutes || minutes === 0) return "0";
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
          return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
      };

      const sheetData = filteredMonthlyList.map((item, index) => {
        // lấy giá trị giờ công cho export
        let display: string;
        if (item.totalWorkedDisplay) {
          display = item.totalWorkedDisplay;
        } else {
          const totalMinutes =
            (item.totalWorkedHours || 0) * 60 +
            (item.totalWorkedMinutes || 0);
          const workedHours = totalMinutes / 60;
          display = `${formatHourValue(workedHours)} h`;
        }

        return {
          "#": index + 1,
          [employeeLabel]: item.employeeName,
          [jobLabel]: item.jobTitle || "",
          [t("table.actualWorkedDays", "Số ngày đi làm")]:
            (item.actualWorkedDays ?? item.workingDays) ?? 0,
          [leaveLabel]: item.leaveDays || 0,
          [absentLabel]: item.absentDays || 0,
          [lateLabel]: item.lateDays || 0,
          [t("table.totalLateMinutes", "Tổng phút trễ")]:
            formatMinutes(item.totalLateMinutes || 0),
          [t("table.totalEarlyMinutes", "Tổng phút sớm")]:
            formatMinutes(item.totalEarlyMinutes || 0),
          [monthlyLabel]: display,
        };
      });

      const worksheet = XLSX.utils.json_to_sheet([]);
      XLSX.utils.sheet_add_aoa(
        worksheet,
        [
          [
            t("table.exportRange", "Period"),
            `${startLabel} - ${endLabel}`,
          ],
          [
            t("table.workingDaysExSunday", "Working days (no Sundays)"),
            workingDaysExSunday,
          ],
          [""],
        ],
        { origin: "A1" }
      );
      XLSX.utils.sheet_add_json(worksheet, sheetData, { origin: "A4", skipHeader: false });

      const csvContent = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `monthly-attendance-${selectedYear}-${String(
        selectedMonth
      ).padStart(2, "0")}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(
        t("messages.exportSuccess", "Monthly attendance exported successfully")
      );
    } catch (error) {
      console.error("Export monthly attendance failed", error);
      toast.error(
        t("messages.exportFailed", "Unable to export monthly attendance")
      );
    } finally {
      setExporting(false);
    }
  }, [filteredMonthlyList, selectedMonth, selectedYear, t]);

  // xác định table có column nào không trống ở chế độ daily không
  const hasShift = viewMode === "daily" && filteredDailyList.some(
    (item) => item.shiftDisplay && item.shiftDisplay.trim() !== ""
  );
  
  const hasWorked = viewMode === "daily" && filteredDailyList.some(
    (item) => item.workedDisplay && item.workedDisplay !== "0 hr 00 min" && item.workedDisplay.trim() !== ""
  );
  
  const hasRemarks = viewMode === "daily" && filteredDailyList.some(
    (item) => item.remarks && item.remarks.trim() !== "" && item.remarks !== "Fixed Attendance"
  );

  // thống kê cho dashboard (tính biến động so với ngày trước)
  const stats = useMemo(() => {
    const totalEmployees = dailyTotals.totalEmployees;
    const todayPresents = dailyTotals.totalPresent;
    const todayLates = dailyTotals.totalLate;
    const todayAbsents = dailyTotals.totalAbsent;
    const todayLeaves = dailyTotals.totalLeave;
    const todayOffdays = dailyTotals.totalOffday;

    const prevTotalPresent = previousDailySummary.reduce((sum, item) => sum + item.present, 0);
    const prevTotalLate = previousDailySummary.reduce((sum, item) => sum + item.late, 0);
    const prevTotalAbsent = previousDailySummary.reduce((sum, item) => sum + item.absent, 0);
    const prevTotalLeave = previousDailySummary.reduce((sum, item) => sum + item.leave, 0);
    const prevTotalOffday = previousDailySummary.reduce((sum, item) => sum + item.offday, 0);
    
    const presentChange = prevTotalPresent > 0 
      ? ((todayPresents - prevTotalPresent) / prevTotalPresent) * 100 
      : 0;
    const lateChange = prevTotalLate > 0 
      ? ((todayLates - prevTotalLate) / prevTotalLate) * 100 
      : 0;
    const absentChange = prevTotalAbsent > 0 
      ? ((todayAbsents - prevTotalAbsent) / prevTotalAbsent) * 100 
      : 0;
    const leaveChange = prevTotalLeave > 0 
      ? ((todayLeaves - prevTotalLeave) / prevTotalLeave) * 100 
      : 0;
    const offdayChange = prevTotalOffday > 0 
      ? ((todayOffdays - prevTotalOffday) / prevTotalOffday) * 100 
      : 0;

    return {
      totalEmployees,
      todayPresents,
      todayLates,
      todayAbsents,
      todayLeaves,
      todayOffdays,
      presentChange,
      lateChange,
      absentChange,
      leaveChange,
      offdayChange,
    };
  }, [dailyTotals, previousDailySummary]);

  return (
    <div className="p-6 space-y-6">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* lọc đầu trang */}
      <AttendanceFilters
        viewMode={viewMode}
        workDate={workDate}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onWorkDateChange={setWorkDate}
        onYearChange={setSelectedYear}
        onMonthChange={setSelectedMonth}
      />

      {/* thống kê thẻ */}
      <SummaryCards stats={stats} loadingSummary={loadingSummary} />

      {/* biểu đồ thống kê tháng */}
      <MonthlyChart 
        monthlySummary={monthlySummary} 
        loading={loading} 
        loadingSummary={loadingSummary} 
      />

      {/* danh sách chấm công */}
      <div className={`bg-white rounded-lg shadow-md p-6 transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
        <AttendanceListFilter
          viewMode={viewMode}
          selectedDepartment={selectedDepartment}
          searchTerm={searchTerm}
          departments={departments}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onViewModeChange={setViewMode}
          onDepartmentChange={setSelectedDepartment}
          onSearchChange={setSearchTerm}
        />
      {viewMode === "monthly" && (
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={handleExportMonthly}
            disabled={loading || exporting}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiDownload />
            {exporting
              ? t("table.exporting", "Exporting...")
              : t("table.export", "Export Excel")}
          </button>
        </div>
      )}
        {loading ? (
          <div className="text-center py-8">{t("messages.loading")}</div>
        ) : viewMode === "daily" ? (
          <>
            <DailyAttendanceTable
              items={filteredDailyList}
              hasShift={hasShift}
              hasWorked={hasWorked}
              hasRemarks={hasRemarks}
            />
            {!loading && (
              <Pagination
                page={dailyPage}
                size={dailySize}
                totalPages={dailyTotalPages}
                totalElements={dailyTotalElements}
                onPageChange={setDailyPage}
                onSizeChange={setDailySize}
              />
            )}
          </>
        ) : (
          <>
            <MonthlyAttendanceTable items={filteredMonthlyList} />
            {!loading && (
              <Pagination
                page={monthlyPage}
                size={monthlySize}
                totalPages={monthlyTotalPages}
                totalElements={monthlyTotalElements}
                onPageChange={setMonthlyPage}
                onSizeChange={setMonthlySize}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default DailyAttendanceView;

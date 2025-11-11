import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from "react-i18next";
import AttendanceFilters, { AttendanceListFilter } from "./AttendanceFilters";
import SummaryCards from "./SummaryCards";
import MonthlyChart from "./MonthlyChart";
import DailyAttendanceTable from "./DailyAttendanceTable";
import MonthlyAttendanceTable from "./MonthlyAttendanceTable";
import Pagination from "./Pagination";

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

type Department = {
  id: number;
  departmentName: string;
};

function DailyAttendanceView() {
  const { t } = useTranslation("attendance");
  const [viewMode, setViewMode] = useState<"daily" | "monthly">("daily");
  const [workDate, setWorkDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1
  );
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");

  const [dailySummary, setDailySummary] = useState<DailySummary[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary[]>([]);
  const [dailyList, setDailyList] = useState<DailyAttendanceItem[]>([]);
  const [monthlyList, setMonthlyList] = useState<MonthlyAttendanceItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  
  // Pagination states
  const [dailyPage, setDailyPage] = useState(0);
  const [dailySize, setDailySize] = useState(10);
  const [dailyTotalPages, setDailyTotalPages] = useState(0);
  const [dailyTotalElements, setDailyTotalElements] = useState(0);
  
  const [monthlyPage, setMonthlyPage] = useState(0);
  const [monthlySize, setMonthlySize] = useState(10);
  const [monthlyTotalPages, setMonthlyTotalPages] = useState(0);
  const [monthlyTotalElements, setMonthlyTotalElements] = useState(0);
  
  // Previous day data for comparison
  const [previousDailySummary, setPreviousDailySummary] = useState<DailySummary[]>([]);

  const accessToken = localStorage.getItem("accessToken");

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoadingSummary(true);
      try {
        // Always fetch monthly summary for the chart
        await fetchMonthlySummary();
        
        if (viewMode === "daily") {
          await fetchDailySummary();
          await fetchDailyList();
          // Fetch previous day for comparison
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
  }, [viewMode, workDate, selectedYear, selectedMonth, selectedDepartment, dailyPage, dailySize, monthlyPage, monthlySize]);

  // Reset page when filters change
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
      console.error("Failed to fetch departments:", err);
      // Set empty array to prevent crashes, but don't show error toast
      // as this is not critical for the attendance view
      setDepartments([]);
      // Only show error if it's not a 403 (forbidden) or 401 (unauthorized)
      if (err.response?.status !== 403 && err.response?.status !== 401) {
        // Silently handle - departments filter is optional
      }
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
      // Don't clear data on error to prevent flickering
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
      console.log("Daily list response:", response.data);
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
      // Don't clear data on error to prevent flickering
    }
  };

  const fetchMonthlyList = async () => {
    setLoading(true);
    try {
      const params: any = { year: selectedYear, month: selectedMonth, page: monthlyPage, size: monthlySize };
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
      console.log("Monthly list response:", response.data);
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
      // Silently fail for comparison data
      setPreviousDailySummary([]);
    }
  };


  // Calculate totals for daily summary
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


  // Filter lists by search term
  const filteredDailyList = dailyList.filter((item) =>
    item.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredMonthlyList = monthlyList.filter((item) =>
    item.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check which columns have real data (not empty/null/default values) - only for daily view
  const hasShift = viewMode === "daily" && filteredDailyList.some(
    (item) => item.shiftDisplay && item.shiftDisplay.trim() !== ""
  );
  
  const hasWorked = viewMode === "daily" && filteredDailyList.some(
    (item) => item.workedDisplay && item.workedDisplay !== "0 hr 00 min" && item.workedDisplay.trim() !== ""
  );
  
  const hasRemarks = viewMode === "daily" && filteredDailyList.some(
    (item) => item.remarks && item.remarks.trim() !== "" && item.remarks !== "Fixed Attendance"
  );


  // Calculate summary statistics for cards with useMemo to prevent unnecessary recalculations
  const stats = useMemo(() => {
    const totalEmployees = dailyTotals.totalEmployees;
    const todayPresents = dailyTotals.totalPresent;
    const todayLates = dailyTotals.totalLate;
    const todayAbsents = dailyTotals.totalAbsent;
    const todayLeaves = dailyTotals.totalLeave;
    const todayOffdays = dailyTotals.totalOffday;

    // Calculate comparison with previous day
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
      
      {/* Header Filter */}
      <AttendanceFilters
        viewMode={viewMode}
        workDate={workDate}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onWorkDateChange={setWorkDate}
        onYearChange={setSelectedYear}
        onMonthChange={setSelectedMonth}
      />

      {/* Summary Cards Section */}
      <SummaryCards stats={stats} loadingSummary={loadingSummary} />

      {/* Monthly Statistics Chart Section */}
      <MonthlyChart 
        monthlySummary={monthlySummary} 
        loading={loading} 
        loadingSummary={loadingSummary} 
      />

      {/* Attendance List Section */}
      <div className={`bg-white rounded-lg shadow-md p-6 transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
        <AttendanceListFilter
          viewMode={viewMode}
          selectedDepartment={selectedDepartment}
          searchTerm={searchTerm}
          departments={departments}
          onViewModeChange={setViewMode}
          onDepartmentChange={setSelectedDepartment}
          onSearchChange={setSearchTerm}
        />

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


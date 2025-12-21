import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  shiftDisplay?: string | null;
  shiftHours?: string | null;
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

  // Tách riêng useEffect cho daily và monthly để tránh xung đột
  useEffect(() => {
    if (viewMode === "daily") {
      const loadDailyData = async () => {
        setLoadingSummary(true);
        try {
          await fetchDailySummary();
          await fetchDailyList();
          // so sánh với dữ liệu ngày trước đó
          const prevDate = new Date(workDate);
          prevDate.setDate(prevDate.getDate() - 1);
          await fetchPreviousDailySummary(prevDate.toISOString().split("T")[0]);
        } finally {
          setLoadingSummary(false);
        }
      };
      loadDailyData();
    }
  }, [viewMode, workDate, selectedDepartment, dailyPage, dailySize]);

  useEffect(() => {
    if (viewMode === "monthly") {
      const loadMonthlyData = async () => {
        setLoadingSummary(true);
        try {
          await fetchMonthlySummary();
          await fetchMonthlyList();
        } finally {
          setLoadingSummary(false);
        }
      };
      loadMonthlyData();
    }
  }, [viewMode, selectedYear, selectedMonth, selectedDepartment, monthlyPage, monthlySize]);

  // Luôn fetch monthly summary để hiển thị chart
  useEffect(() => {
    fetchMonthlySummary();
  }, [selectedYear, selectedMonth]);

  // Reset page về 0 khi thay đổi filter (workDate, department) - chỉ reset khi thực sự thay đổi
  const prevWorkDateRef = useRef(workDate);
  const prevSelectedDepartmentRef = useRef(selectedDepartment);
  
  useEffect(() => {
    if (viewMode === "daily" && 
        (prevWorkDateRef.current !== workDate || prevSelectedDepartmentRef.current !== selectedDepartment)) {
      setDailyPage(0);
      prevWorkDateRef.current = workDate;
      prevSelectedDepartmentRef.current = selectedDepartment;
    }
  }, [workDate, selectedDepartment, viewMode]);

  const prevSelectedYearRef = useRef(selectedYear);
  const prevSelectedMonthRef = useRef(selectedMonth);
  
  useEffect(() => {
    if (viewMode === "monthly" && 
        (prevSelectedYearRef.current !== selectedYear || 
         prevSelectedMonthRef.current !== selectedMonth || 
         prevSelectedDepartmentRef.current !== selectedDepartment)) {
      setMonthlyPage(0);
      prevSelectedYearRef.current = selectedYear;
      prevSelectedMonthRef.current = selectedMonth;
      prevSelectedDepartmentRef.current = selectedDepartment;
    }
  }, [selectedYear, selectedMonth, selectedDepartment, viewMode]);
  
  // Đảm bảo page không vượt quá totalPages khi totalPages thay đổi
  useEffect(() => {
    if (dailyTotalPages > 0 && dailyPage >= dailyTotalPages) {
      setDailyPage(Math.max(0, dailyTotalPages - 1));
    } else if (dailyTotalPages === 0 && dailyPage > 0) {
      setDailyPage(0);
    }
  }, [dailyTotalPages]);

  useEffect(() => {
    if (monthlyTotalPages > 0 && monthlyPage >= monthlyTotalPages) {
      setMonthlyPage(Math.max(0, monthlyTotalPages - 1));
    } else if (monthlyTotalPages === 0 && monthlyPage > 0) {
      setMonthlyPage(0);
    }
  }, [monthlyTotalPages]);

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
      const content = response.data.content || [];
      setDailyList(content);
        let totalElements = response.data.totalElements || 0;
      let totalPages = response.data.totalPages || 0;
      
      // Nếu backend trả về totalElements = 0 nhưng có content, có thể là backend chưa tính đúng
      // Trong trường hợp này, nếu content.length = size, có thể còn trang tiếp theo
      // Nếu content.length < size, thì đây là trang cuối
      if (totalElements === 0 && content.length > 0) {
        // Nếu content.length = size, có thể còn nhiều trang hơn
        // Ước tính totalElements = (page + 1) * size + 1 (ít nhất) để cho phép có trang tiếp theo
        if (content.length === dailySize) {
          // Có thể còn trang tiếp theo, ước tính totalElements
          totalElements = (dailyPage + 1) * dailySize + 1; // Ước tính tối thiểu
          totalPages = Math.ceil(totalElements / dailySize);
        } else {
          // Đây là trang cuối
          totalElements = dailyPage * dailySize + content.length;
          totalPages = dailyPage + 1;
        }
      } else if (totalPages === 0 && totalElements > 0) {
        // Tính totalPages từ totalElements
        totalPages = Math.ceil(totalElements / dailySize);
      } else if (totalPages === 0 && content.length > 0) {
        // Có content nhưng không có totalElements và totalPages
        totalElements = content.length;
        totalPages = 1;
      }
      
      // Đảm bảo totalPages ít nhất là 1 nếu có dữ liệu
      if (totalPages === 0 && content.length > 0) {
        totalPages = 1;
        totalElements = content.length;
      }
      
      console.log('Daily Attendance List:', {
        page: dailyPage,
        size: dailySize,
        contentLength: content.length,
        totalElements,
        totalPages,
        backendTotalElements: response.data.totalElements,
        backendTotalPages: response.data.totalPages
      });
      
      setDailyTotalPages(totalPages);
      setDailyTotalElements(totalElements);
    } catch (err: any) {
      toast.error(t("messages.failedToLoadDailyAttendanceList"));
      console.error(err);
      setDailyList([]);
      setDailyTotalPages(0);
      setDailyTotalElements(0);
      setDailyPage(0);
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
      const content = response.data.content || [];
      setMonthlyList(content);
      const totalElements = response.data.totalElements || 0;
      let totalPages = response.data.totalPages || 0;
      
      // Tính lại totalPages nếu backend trả về 0 hoặc không hợp lý nhưng có dữ liệu
      if (totalPages === 0 && totalElements > 0) {
        totalPages = Math.ceil(totalElements / monthlySize);
      } else if (totalPages === 0 && content.length > 0) {
        // Nếu có content nhưng không có totalElements, tính từ content.length
        totalPages = Math.ceil(content.length / monthlySize);
      }
      
      // Đảm bảo totalPages ít nhất là 1 nếu có dữ liệu
      if (totalPages === 0 && (content.length > 0 || totalElements > 0)) {
        totalPages = 1;
      }
      
      setMonthlyTotalPages(totalPages);
      setMonthlyTotalElements(totalElements || content.length);
    } catch (err: any) {
      toast.error(t("messages.failedToLoadMonthlyAttendanceList"));
      console.error(err);
      setMonthlyList([]);
      setMonthlyTotalPages(0);
      setMonthlyTotalElements(0);
      setMonthlyPage(0);
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

  // Group và merge các bản ghi của cùng một nhân viên trong cùng một ngày thành một dòng
  const groupedDailyList = useMemo(() => {
    const grouped = new Map<string, DailyAttendanceItem[]>();
    
    dailyList.forEach((item) => {
      // Key: userId + employeeName để group các bản ghi của cùng một nhân viên
      const key = `${item.userId}-${item.employeeName}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(item);
    });
    
    // Merge các bản ghi của cùng một nhân viên thành một item duy nhất
    const result: DailyAttendanceItem[] = [];
    grouped.forEach((items) => {
      // Sắp xếp theo shiftDisplay hoặc id để có thứ tự nhất quán
      items.sort((a, b) => {
        if (a.shiftDisplay && b.shiftDisplay) {
          return a.shiftDisplay.localeCompare(b.shiftDisplay);
        }
        if (a.id && b.id) {
          return a.id - b.id;
        }
        return 0;
      });
      
      // Nếu chỉ có 1 item, giữ nguyên
      if (items.length === 1) {
        result.push(items[0]);
      } else {
        // Merge nhiều items thành một
        const firstItem = items[0];
        
        // Kiểm tra xem có ca nào nghỉ không (Approved Leave hoặc Absent)
        const hasLeaveOrAbsent = items.some(item => 
          item.status === "Approved Leave" || item.status === "Absent"
        );
        
        // Xác định status chính (ưu tiên: Present > Late > Approved Leave > Absent)
        const statusPriority: Record<string, number> = {
          "Present": 1,
          "Late": 2,
          "Approved Leave": 3,
          "Absent": 4,
        };
        const mainStatus = items.reduce((prev, curr) => {
          const prevPriority = statusPriority[prev.status] || 99;
          const currPriority = statusPriority[curr.status] || 99;
          return currPriority < prevPriority ? curr : prev;
        });
        
        // Nếu có ca nghỉ, hiển thị shift kèm status của từng ca
        let shiftDisplay: string | null | undefined = "";
        let shiftHours: string | null | undefined = "";
        
        if (hasLeaveOrAbsent) {
          // Hiển thị từng ca kèm status: "8am-11am (Approved Leave) / 1pm-6pm (Present)"
          const shiftParts = items
            .map(item => {
              const shift = item.shiftDisplay || "";
              const status = item.status || "";
              return shift ? `${shift} (${status})` : "";
            })
            .filter(Boolean);
          shiftDisplay = shiftParts.join(" / ") || firstItem.shiftDisplay || null;
          
          const shiftHoursParts = items
            .map(item => {
              const hours = item.shiftHours || "";
              const status = item.status || "";
              return hours ? `${hours} (${status})` : "";
            })
            .filter(Boolean);
          shiftHours = shiftHoursParts.join(" / ") || firstItem.shiftHours || null;
        } else {
          // Nếu không có ca nghỉ, chỉ hiển thị shift bình thường
          shiftDisplay = items
            .map(item => item.shiftDisplay)
            .filter(Boolean)
            .join(" / ") || firstItem.shiftDisplay || null;
          shiftHours = items
            .map(item => item.shiftHours)
            .filter(Boolean)
            .join(" / ") || firstItem.shiftHours || null;
        }
        
        const mergedItem: DailyAttendanceItem = {
          ...firstItem,
          // Lấy id đầu tiên để có thể click xem chi tiết
          id: items[0].id,
          // Sử dụng status chính, nhưng nếu có ca nghỉ thì hiển thị "Mixed" hoặc status chính
          status: hasLeaveOrAbsent && items.some(item => item.status !== mainStatus.status)
            ? `Mixed (${items.map(i => i.status).filter((v, i, a) => a.indexOf(v) === i).join(", ")})`
            : mainStatus.status,
          statusColor: mainStatus.statusColor,
          // Gộp shifts với format có status nếu có ca nghỉ
          shiftDisplay: shiftDisplay,
          shiftHours: shiftHours,
          // Tính tổng worked hours
          workedHours: items.reduce((sum, item) => sum + (item.workedHours || 0), 0),
          workedMinutes: items.reduce((sum, item) => sum + (item.workedMinutes || 0), 0),
          // Tính workedDisplay từ tổng hours và minutes
          workedDisplay: (() => {
            const totalMinutes = items.reduce((sum, item) => {
              const hours = item.workedHours || 0;
              const mins = item.workedMinutes || 0;
              return sum + hours * 60 + mins;
            }, 0);
            const hours = Math.floor(totalMinutes / 60);
            const mins = totalMinutes % 60;
            return hours > 0 || mins > 0 ? `${hours} hr ${mins.toString().padStart(2, "0")} min` : "0 hr 00 min";
          })(),
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
          // Gộp remarks
          remarks: items
            .map(item => item.remarks)
            .filter(r => r && r !== "Fixed Attendance" && r.trim() !== "")
            .join("; ") || firstItem.remarks,
        };
        result.push(mergedItem);
      }
    });
    
    return result;
  }, [dailyList]);

  // lọc tìm kiếm tên nhân viên cho table
  const filteredDailyList = groupedDailyList.filter((item) =>
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
    (item) => item.shiftDisplay && item.shiftDisplay.trim() !== "" && item.shiftDisplay !== "-"
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

import { useState, useEffect, useCallback } from "react";
import { payrollApi, type PayslipSnapshotDto, type UserSnapshot } from "../../../../../huybro_api/payrollApi";

export const usePayroll = () => {
  // --- STATE QUẢN LÝ BẢNG LƯƠNG ---
  const [payslips, setPayslips] = useState<PayslipSnapshotDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [missingConfigs, setMissingConfigs] = useState<UserSnapshot[]>([]);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const today = new Date();
  const [month, setMonth] = useState<number>(today.getMonth() + 1);
  const [year, setYear] = useState<number>(today.getFullYear());
  const [keyword, setKeyword] = useState<string>("");

  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);

  const [cycleStatus, setCycleStatus] = useState<'DRAFT' | 'FINALIZED' | 'PAID' | null>(null);

  // --- 1. HÀM LOAD DỮ LIỆU ---
  const fetchPayslips = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await payrollApi.getPayslips({
        month, year, keyword, page, size
      });
      
      setPayslips(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);

      if (response.data.content.length > 0) {
        setCycleStatus(response.data.content[0].status);
      } else {
        setCycleStatus(null);
      }

    } catch (err: any) {
      console.error(err);
      setPayslips([]);
      setCycleStatus(null);
    } finally {
      setLoading(false);
    }
  }, [month, year, keyword, page, size]);

  const handleExportExcel = async () => {
    if (payslips.length === 0) {
      alert("No data to export!");
      return;
    }

    setIsExporting(true);
    try {
      const response = await payrollApi.exportExcel(month, year);
      
      const blob = new Blob([response.data as any], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Đặt tên file
      link.setAttribute('download', `Payroll_Report_${month}_${year}.xlsx`);
      
      document.body.appendChild(link);
      link.click();
      
      // Dọn dẹp
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error("Export failed", err);
      alert("Failed to export Excel file.");
    } finally {
      setIsExporting(false);
    }
  };


  // Hàm này độc lập, chỉ gọi 1 lần khi mount hoặc khi cần refresh
  const fetchMissingConfigs = useCallback(async () => {
      try {
          const res = await payrollApi.getMissingConfigs();
          setMissingConfigs(res.data);
      } catch (error) {
          console.error("Failed to fetch missing configs", error);
      }
  }, []);

  // Tự động load khi filter thay đổi
  useEffect(() => {
    fetchPayslips();
  }, [fetchPayslips]);

  // [NEW EFFECT] Tự động load missing config khi vào trang
  useEffect(() => {
      fetchMissingConfigs();
  }, [fetchMissingConfigs]);


  // --- 2. HÀM TÍNH TOÁN LƯƠNG ---
  const handleCalculate = async () => {
    if (cycleStatus === 'FINALIZED' || cycleStatus === 'PAID') {
      alert("This cycle is locked. Cannot recalculate.");
      return;
    }
    const confirm = window.confirm(`Calculate payroll for ${month}/${year}?`);
    if (!confirm) return;

    setLoading(true);
    try {
      await payrollApi.calculatePayroll(month, year);
      alert("Calculation completed!");
      fetchPayslips(); 
      fetchMissingConfigs(); // Refresh lại list thiếu sau khi tính (để chắc ăn)
    } catch (err: any) {
      alert("Error: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // --- 3. HÀM CHỐT LƯƠNG ---
  const handleFinalize = async () => {
    const confirm = window.confirm(`Finalize payroll for ${month}/${year}? This action cannot be undone.`);
    if (!confirm) return;

    try {
      await payrollApi.finalizeCycle(month, year);
      alert("Cycle finalized!");
      fetchPayslips();
    } catch (err: any) {
      alert("Error: " + (err.response?.data?.message || err.message));
    }
  };

  // --- 4. CÁC HANDLER THAY ĐỔI FILTER ---
  const handlePageChange = (newPage: number) => setPage(newPage);
  const handleSizeChange = (newSize: number) => { setSize(newSize); setPage(0); };
  const handleSearch = (val: string) => { setKeyword(val); setPage(0); };
  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    if (!isNaN(date.getTime())) {
      setMonth(date.getMonth() + 1);
      setYear(date.getFullYear());
      setPage(0);
    }
  };

  return {
    // Data
    payslips, loading, error,
    month, year, keyword, page, size,
    totalPages, totalElements, cycleStatus,
    missingConfigs,
    isExporting, // [EXPORT NEW DATA]
    
    // Actions
    fetchPayslips,
    fetchMissingConfigs, // Export nếu muốn gọi thủ công
    handleCalculate,
    handleFinalize,
    handleExportExcel,
    
    // Filter Setters
    handlePageChange, handleSizeChange, handleSearch, handleMonthChange
  };
};
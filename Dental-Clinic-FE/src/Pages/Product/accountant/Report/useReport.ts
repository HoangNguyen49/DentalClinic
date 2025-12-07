import { useState, useEffect, useCallback } from "react";
import reportApi, { type RevenueReportData } from "../../../../huybro_api/reportApi"; 

// Định nghĩa kiểu cho bộ lọc
interface ReportFilter {
  startDate: string;
  endDate: string;
  currency: "VND" | "USD";
}

export const useReport = () => {
  // 1. State Data & UI
  const [data, setData] = useState<RevenueReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  // 2. State Filters (Mặc định: Currency VND, Date rỗng để BE tự tính 30 ngày)
  const [filters, setFilters] = useState<ReportFilter>({
    startDate: "",
    endDate: "",
    currency: "VND",
  });

  // 3. Hàm gọi API lấy dữ liệu Dashboard
  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await reportApi.getRevenueReport(
        filters.startDate || undefined,
        filters.endDate || undefined,
        filters.currency
      );
      setData(result);
    } catch (error) {
      console.error("Error fetching report:", error);
      // toast.error("Không thể tải dữ liệu báo cáo!");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // 4. Effect: Tự động gọi API khi filter thay đổi
  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // 5. Hàm xử lý xuất Excel
  const exportExcel = async () => {
    try {
      await reportApi.exportRevenueReport(
        filters.startDate || undefined,
        filters.endDate || undefined,
        filters.currency
      );
      // toast.success("Đã tải xuống file báo cáo!");
    } catch (error) {
      console.error("Export error:", error);
      // toast.error("Lỗi khi xuất file Excel!");
    }
  };

  // 6. Hàm update Filter helper
  const updateFilter = (key: keyof ReportFilter, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return {
    data,
    loading,
    filters,
    updateFilter,
    exportExcel,
    refresh: fetchReportData, // Expose hàm refresh thủ công nếu cần
  };
};
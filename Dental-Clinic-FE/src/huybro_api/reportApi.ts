import axiosClient from "./axiosClient"; 

// Các interface dùng để mapping dữ liệu trả về từ API
export interface TopProduct {
  productName: string;
  sku: string;
  totalSoldQty: number;
  totalRevenue: number;
}

export interface ChartData {
  date: string;
  revenue: number;
  orderCount: number;
}

export interface RevenueReportData {
  netRevenue: number;
  potentialRevenue: number;
  lostRevenue: number;
  totalOrdersCompleted: number;
  totalOrdersCancelled: number;
  chartData: ChartData[];
  topProducts: TopProduct[];
}

const reportApi = {
  // Lấy báo cáo doanh thu dạng JSON
  getRevenueReport: async (startDate?: string, endDate?: string, currency: string = "VND") => {
    const params = { startDate, endDate, currency };
    const response = await axiosClient.get<RevenueReportData>("/api/reports/revenue", { params });
    return response.data;
  },

  // Xuất báo cáo doanh thu ra file Excel
  exportRevenueReport: async (startDate?: string, endDate?: string, currency: string = "VND") => {
    const params = { startDate, endDate, currency };
    // Báo cho axios dùng kiểu blob để nhận file excel
    const response = await axiosClient.get<Blob>("/api/reports/revenue/export", {
      params,
      responseType: "blob",
    });
    // Tạo object URL để phục vụ tải file
    const url = window.URL.createObjectURL(new Blob([response.data]));
    // Tạo thẻ a tạm thời để trigger sự kiện tải file
    const link = document.createElement("a");
    link.href = url;
    // Đặt tên file theo ngày hiện tại
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `Revenue_Report_${dateStr}.xlsx`);
    document.body.appendChild(link);
    link.click();
    // Dọn dẹp thẻ và thu hồi URL
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default reportApi;
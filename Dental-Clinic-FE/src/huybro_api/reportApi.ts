import axiosClient from "./axiosClient"; 

// Interface mapping với DTO của Backend
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
  // 1. Lấy dữ liệu hiển thị JSON
  getRevenueReport: async (startDate?: string, endDate?: string, currency: string = "VND") => {
    const params = { startDate, endDate, currency };
    // Khai báo rõ kiểu trả về là RevenueReportData
    const response = await axiosClient.get<RevenueReportData>("/api/reports/revenue", { params });
    return response.data;
  },

  // 2. Tải file Excel
  exportRevenueReport: async (startDate?: string, endDate?: string, currency: string = "VND") => {
    const params = { startDate, endDate, currency };
    
    // [FIX] Thêm <Blob> vào generic để TypeScript hiểu response.data là Blob
    const response = await axiosClient.get<Blob>("/api/reports/revenue/export", {
      params,
      responseType: "blob", // Báo cho Axios biết đây là file binary
    });

    // Lúc này response.data đã được hiểu là Blob, không còn bị lỗi unknown
    const url = window.URL.createObjectURL(new Blob([response.data]));
    
    // Tạo thẻ A ảo để kích hoạt tải xuống
    const link = document.createElement("a");
    link.href = url;
    
    // Tạo tên file có ngày tháng
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `Revenue_Report_${dateStr}.xlsx`);
    
    document.body.appendChild(link);
    link.click();
    
    // Dọn dẹp
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default reportApi;
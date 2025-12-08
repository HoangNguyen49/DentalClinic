import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import {
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  XCircle,
  Loader2,
  RefreshCcw,
  Users,
  Building2,
  BarChart2,
  AlertCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import reportApi, { type RevenueReportData } from "../../../huybro_api/reportApi";

// API URL cơ bản
const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";

interface ReportFilter {
  startDate: string;
  endDate: string;
  currency: "USD" | "VND";
}

// Hàm định dạng tiền tệ
const formatMoney = (amount: number, currency: string = "VND") => {
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

export default function AdminReportsPage() {
  const { t } = useTranslation("admin");
  const accessToken = localStorage.getItem("accessToken");
  const [data, setData] = useState<RevenueReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [filters, setFilters] = useState<ReportFilter>({
    startDate: "",
    endDate: "",
    currency: "VND",
  });

  // State lưu các thống kê bổ sung cho dashboard
  const [stats, setStats] = useState({
    totalStaff: 0,
    totalClinics: 0,
    todayAppointments: 0,
  });

  // Lấy dữ liệu báo cáo doanh thu từ API
  const fetchReportData = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const result = await reportApi.getRevenueReport(
        filters.startDate || undefined,
        filters.endDate || undefined,
        filters.currency
      );
      
      // Định dạng lại dữ liệu từ backend cho chart, number
      if (result) {
        const formattedResult: RevenueReportData = {
          ...result,
          chartData: (result.chartData as any[])?.map((item: any) => {
            const dateValue: any = item?.date;
            const revenueValue: any = item?.revenue;
            const orderCountValue: any = item?.orderCount;
            
            return {
              date: typeof dateValue === "string" ? dateValue : (dateValue ? String(dateValue) : ""),
              revenue: typeof revenueValue === "number" ? revenueValue : parseFloat(String(revenueValue || "0")),
              orderCount: typeof orderCountValue === "number" ? orderCountValue : parseInt(String(orderCountValue || "0"), 10),
            };
          }) || [],
          netRevenue: typeof result.netRevenue === "number" ? result.netRevenue : parseFloat(String(result.netRevenue || "0")),
          potentialRevenue: typeof result.potentialRevenue === "number" ? result.potentialRevenue : parseFloat(String(result.potentialRevenue || "0")),
          lostRevenue: typeof result.lostRevenue === "number" ? result.lostRevenue : parseFloat(String(result.lostRevenue || "0")),
          topProducts: result.topProducts?.map((product: any) => ({
            ...product,
            totalRevenue: typeof product.totalRevenue === "number" ? product.totalRevenue : parseFloat(String(product.totalRevenue || "0")),
          })) || [],
        };
        setData(formattedResult);
      } else {
        setData(null);
      }
    } catch (error: any) {
      // Chỉ log lỗi khi không phải lỗi mạng hoặc lỗi 500
      const isNetworkError = error?.code === "ERR_NETWORK" || error?.code === "ERR_CONNECTION_REFUSED";
      const is500Error = error?.response?.status === 500;
      
      if (!isNetworkError && !is500Error) {
        console.error("Error fetching report:", error);
      }
      setData(null); // Đặt state = null để hiển thị trạng thái rỗng
    } finally {
      setLoading(false);
    }
  };

  // Lấy thông tin tổng quan (nhân viên, phòng khám, lịch hẹn hôm nay)
  const fetchAdditionalStats = async () => {
    if (!accessToken) return;
    try {
      const today = new Date().toISOString().split("T")[0];
      const [staffRes, clinicsRes, appointmentsRes] = await Promise.allSettled([
        axios.get(`${apiBase}/api/admin/staff`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }).catch((err: any) => {
          // Nếu là lỗi mạng thì reject để phía dưới nhận biết, không log
          if (err.code === "ERR_NETWORK" || err.code === "ERR_CONNECTION_REFUSED") {
            return Promise.reject(err);
          }
          return Promise.reject(err);
        }),
        axios.get(`${apiBase}/api/admin/clinics`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }).catch((err: any) => {
          if (err.code === "ERR_NETWORK" || err.code === "ERR_CONNECTION_REFUSED") {
            return Promise.reject(err);
          }
          return Promise.reject(err);
        }),
        axios.get(`${apiBase}/api/admin/appointments`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { date: today },
        }).catch((err: any) => {
          if (err.code === "ERR_NETWORK" || err.code === "ERR_CONNECTION_REFUSED") {
            return Promise.reject(err);
          }
          return Promise.reject(err);
        }),
      ]);

      setStats({
        totalStaff:
          staffRes.status === "fulfilled" && staffRes.value
            ? ((staffRes.value as { data?: any[] })?.data as any[])?.length || 0
            : 0,
        totalClinics:
          clinicsRes.status === "fulfilled" && clinicsRes.value
            ? ((clinicsRes.value as { data?: any[] })?.data as any[])?.length || 0
            : 0,
        todayAppointments:
          appointmentsRes.status === "fulfilled" && appointmentsRes.value
            ? ((appointmentsRes.value as { data?: any[] })?.data as any[])?.length || 0
            : 0,
      });
    } catch (error: any) {
      // Chỉ log nếu không phải lỗi mạng
      if (error?.code !== "ERR_NETWORK" && error?.code !== "ERR_CONNECTION_REFUSED") {
        console.error("Error fetching stats:", error);
      }
    }
  };

  // useEffect gọi API khi filter hoặc accessToken thay đổi
  useEffect(() => {
    fetchReportData();
    fetchAdditionalStats();
  }, [filters, accessToken]);

  // Xuất báo cáo ra Excel (nếu API hỗ trợ)
  const exportExcel = async () => {
    try {
      await reportApi.exportRevenueReport(
        filters.startDate || undefined,
        filters.endDate || undefined,
        filters.currency
      );
    } catch (error: any) {
      // Trường hợp API chưa hỗ trợ export thì thông báo
      if (error?.response?.status !== 500) {
        console.error("Export error:", error);
      }
      alert(t("reports.exportNotAvailable", "Chức năng xuất báo cáo chưa khả dụng"));
    }
  };

  // Cập nhật bộ lọc ngày và loại tiền
  const updateFilter = (key: keyof ReportFilter, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-8">
      {/* Header của trang báo cáo */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <BarChart2 className="w-6 h-6" />
            </div>
            {t("reports.title", "Báo cáo & Thống kê")}
          </h1>
          <p className="text-sm text-slate-500 mt-1 ml-1">
            {t("reports.subtitle", "Tổng quan doanh thu và hiệu suất kinh doanh")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Chuyển đổi loại tiền */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center">
            {(["USD", "VND"] as const).map((curr) => (
              <button
                key={curr}
                onClick={() => updateFilter("currency", curr)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filters.currency === curr
                    ? "bg-white text-blue-600 shadow-md"
                    : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                {curr}
              </button>
            ))}
          </div>

          {/* Chọn khoảng thời gian */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              className="text-sm outline-none text-slate-700"
              value={filters.startDate}
              onChange={(e) => updateFilter("startDate", e.target.value)}
              aria-label="Start date"
            />
            <span className="text-slate-300">to</span>
            <input
              type="date"
              className="text-sm outline-none text-slate-700"
              value={filters.endDate}
              onChange={(e) => updateFilter("endDate", e.target.value)}
              aria-label="End date"
            />
          </div>

          {/* Làm mới báo cáo */}
          <button
            onClick={fetchReportData}
            className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            aria-label="Refresh report data"
            title="Refresh report data"
          >
            <RefreshCcw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>

          {/* Xuất Excel */}
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg transition-all"
          >
            <Download className="w-4 h-4" />
            {t("reports.export", "Xuất Excel")}
          </button>
        </div>
      </div>

      {/* Thẻ tổng quan số liệu */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Chỉ hiển thị nếu có dữ liệu doanh thu */}
        {data ? (
          <>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">
                  {t("reports.netRevenue", "Doanh thu thực")}
                </span>
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {formatMoney(data.netRevenue, filters.currency)}
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">
                  {t("reports.potentialRevenue", "Doanh thu tiềm năng")}
                </span>
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {formatMoney(data.potentialRevenue, filters.currency)}
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">
                  {t("reports.completedOrders", "Đơn hoàn thành")}
                </span>
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {data.totalOrdersCompleted}
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">
                  {t("reports.cancelledOrders", "Đơn đã hủy")}
                </span>
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {data.totalOrdersCancelled}
              </p>
            </div>
          </>
        ) : (
          // Nếu không có dữ liệu báo cáo doanh thu thì hiển thị cảnh báo
          <div className="col-span-full bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  {t("reports.dataNotAvailable", "Dữ liệu báo cáo doanh thu chưa khả dụng")}
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  {t("reports.dataNotAvailableDesc", "API báo cáo doanh thu chưa được triển khai trong backend")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Thống kê tổng nhân viên */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">
              {t("reports.totalStaff", "Tổng nhân viên")}
            </span>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.totalStaff}</p>
        </div>

        {/* Thống kê tổng phòng khám */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">
              {t("reports.totalClinics", "Tổng phòng khám")}
            </span>
            <Building2 className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {stats.totalClinics}
          </p>
        </div>

        {/* Thống kê lịch hẹn hôm nay */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">
              {t("reports.todayAppointments", "Lịch hẹn hôm nay")}
            </span>
            <Calendar className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {stats.todayAppointments}
          </p>
        </div>
      </div>

      {/* Biểu đồ doanh thu và đơn hàng */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : data && data.chartData && data.chartData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Biểu đồ doanh thu */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              {t("reports.revenueChart", "Biểu đồ doanh thu")}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  }}
                />
                <YAxis 
                  tickFormatter={(value) =>
                    new Intl.NumberFormat("vi-VN", { notation: "compact", compactDisplay: "short" }).format(value)
                  }
                />
                <Tooltip
                  formatter={(value: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value)}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Biểu đồ đơn hàng */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              {t("reports.ordersChart", "Biểu đồ đơn hàng")}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  }}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="orderCount" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : data ? (
        // Hiển thị khi không có dữ liệu biểu đồ trong khoảng thời gian đã chọn
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500 text-center">
            {t("reports.noChartData", "Không có dữ liệu biểu đồ trong khoảng thời gian này")}
          </p>
        </div>
      ) : null}

      {/* Bảng sản phẩm bán chạy */}
      {data && data.topProducts && data.topProducts.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            {t("reports.topProducts", "Sản phẩm bán chạy")}
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                    {t("reports.product", "Sản phẩm")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                    {t("reports.quantity", "Số lượng")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                    {t("reports.revenue", "Doanh thu")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.topProducts.map((product, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-900">
                      {product.productName}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {product.totalSoldQty}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                      {formatMoney(product.totalRevenue, filters.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

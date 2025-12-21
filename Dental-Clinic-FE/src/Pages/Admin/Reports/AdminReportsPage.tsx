import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { adminApi } from "../../../services/admin/adminApi";
import { formatMoney } from "../../../utils/adminUtils";
import { useAdminApi } from "../../../hooks/useAdminApi";
import { exportToCSV } from "../../../utils/exportUtils";
import {
  Calendar,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  XCircle,
  RefreshCcw,
  Users,
  Building2,
  BarChart2,
  AlertCircle,
  Download,
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

interface ReportFilter {
  startDate: string;
  endDate: string;
  currency: "USD" | "VND";
}

export default function AdminReportsPage() {
  const { t } = useTranslation("admin");
  const [data, setData] = useState<RevenueReportData | null>(null);
  const [filters, setFilters] = useState<ReportFilter>({
    startDate: "",
    endDate: "",
    currency: "VND",
  });

  // State lưu các chỉ số tổng quan
  const [stats, setStats] = useState({
    totalStaff: 0,
    totalClinics: 0,
    todayAppointments: 0,
  });

  const { loading } = useAdminApi<RevenueReportData>();
  const { execute: executeStats } = useAdminApi<any>();

  // Lấy và định dạng dữ liệu báo cáo doanh thu từ API
  const fetchReportData = useCallback(async () => {
    const result = await reportApi.getRevenueReport(
      filters.startDate || undefined,
      filters.endDate || undefined,
      filters.currency
    );

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
  }, [filters.startDate, filters.endDate, filters.currency]);

  // Lấy thông tin tổng quan nhân viên, phòng khám
  const fetchAdditionalStats = useCallback(async () => {
    const [staffData, clinicsData] = await Promise.all([
      executeStats(() => adminApi.staff.getAll({}), { showErrorToast: false }),
      executeStats(() => adminApi.clinics.getAll(), { showErrorToast: false }),
    ]);

    // Hàm lấy số lượng phần tử cho các kiểu response khác nhau
    // Backend staff API giờ luôn trả về Page response
    const getLength = (data: any): number => {
      if (data && typeof data === 'object' && 'content' in data) {
        return data.totalElements || data.content?.length || 0;
      }
      if (Array.isArray(data)) return data.length;
      return 0;
    };

    setStats({
      totalStaff: getLength(staffData),
      totalClinics: Array.isArray(clinicsData) ? clinicsData.length : 0,
      todayAppointments: 0, // Appointment đã bị xóa khỏi admin
    });
  }, [executeStats]);

  // Gọi API mỗi khi filter thay đổi
  useEffect(() => {
    fetchReportData();
    fetchAdditionalStats();
  }, [filters, fetchReportData, fetchAdditionalStats]);

  // Hàm cập nhật filter cho ngày và loại tiền
  const updateFilter = useCallback((key: keyof ReportFilter, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Export handlers
  const handleExportTopProducts = () => {
    if (!data || !data.topProducts || data.topProducts.length === 0) {
      toast.warning("Không có dữ liệu để export");
      return;
    }
    exportToCSV(
      data.topProducts,
      {
        productName: { key: 'productName', label: 'Sản phẩm' },
        totalSoldQty: { key: 'totalSoldQty', label: 'Số lượng bán' },
        totalRevenue: { key: 'totalRevenue', label: 'Doanh thu (VND)' },
      },
      'bao-cao-san-pham-ban-chay'
    );
    toast.success("Đã export báo cáo thành công!");
  };

  const handleExportChartData = () => {
    if (!data || !data.chartData || data.chartData.length === 0) {
      toast.warning("Không có dữ liệu để export");
      return;
    }
    exportToCSV(
      data.chartData,
      {
        date: { key: 'date', label: 'Ngày' },
        revenue: { key: 'revenue', label: 'Doanh thu (VND)' },
        orderCount: { key: 'orderCount', label: 'Số đơn hàng' },
      },
      'bao-cao-doanh-thu-theo-ngay'
    );
    toast.success("Đã export dữ liệu biểu đồ thành công!");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 space-y-8">
      {/* Header báo cáo và bộ lọc */}
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

          {/* Bộ lọc ngày bắt đầu và ngày kết thúc */}
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

          {/* Nút làm mới */}
          <button
            onClick={fetchReportData}
            className="p-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            aria-label="Refresh report data"
            title="Refresh report data"
          >
            <RefreshCcw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Thẻ tổng quan số liệu - doanh thu, đơn hàng, nhân sự, phòng khám*/}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Nếu có dữ liệu báo cáo doanh thu */}
        {data ? (
          <>
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg shadow-md">
                  <DollarSign className="w-6 h-6 text-white" />
              </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-900">
                {formatMoney(data.netRevenue, filters.currency)}
                  </p>
                </div>
              </div>
              <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">
                {t("reports.netRevenue", "Doanh thu thực")}
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                  <TrendingUp className="w-6 h-6 text-white" />
              </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-900">
                {formatMoney(data.potentialRevenue, filters.currency)}
                  </p>
                </div>
              </div>
              <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                {t("reports.potentialRevenue", "Doanh thu tiềm năng")}
              </p>
            </div>

            <div className="bg-gradient-to-br from-cyan-50 to-teal-50 border-2 border-cyan-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-lg shadow-md">
                  <ShoppingCart className="w-6 h-6 text-white" />
              </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-cyan-900">
                {data.totalOrdersCompleted}
                  </p>
                </div>
              </div>
              <p className="text-sm font-semibold text-cyan-700 uppercase tracking-wide">
                {t("reports.completedOrders", "Đơn hoàn thành")}
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg shadow-md">
                  <XCircle className="w-6 h-6 text-white" />
              </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-red-900">
                {data.totalOrdersCancelled}
                  </p>
                </div>
              </div>
              <p className="text-sm font-semibold text-red-700 uppercase tracking-wide">
                {t("reports.cancelledOrders", "Đơn đã hủy")}
              </p>
            </div>
          </>
        ) : (
          // Nếu không có dữ liệu doanh thu thì cảnh báo
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

        {/* Tổng số nhân viên */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-all hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg shadow-md">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-900">{stats.totalStaff}</p>
            </div>
          </div>
          <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
              {t("reports.totalStaff", "Tổng nhân viên")}
          </p>
        </div>

        {/* Tổng số phòng khám */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-all hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg shadow-md">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-purple-900">{stats.totalClinics}</p>
            </div>
          </div>
          <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">
              {t("reports.totalClinics", "Tổng phòng khám")}
          </p>
        </div>

        {/* Tổng số lịch hẹn hôm nay */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-6 shadow-md hover:shadow-lg transition-all hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg shadow-md">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-orange-900">{stats.todayAppointments}</p>
            </div>
          </div>
          <p className="text-sm font-semibold text-orange-700 uppercase tracking-wide">
              {t("reports.todayAppointments", "Lịch hẹn hôm nay")}
          </p>
        </div>
      </div>

      {/* Biểu đồ doanh thu và đơn hàng */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl border border-slate-200/60 shadow-xl animate-pulse">
              <div className="h-8 bg-slate-200 rounded-xl w-1/3 mb-6"></div>
              <div className="h-80 bg-gradient-to-br from-slate-100 to-slate-50 rounded-xl"></div>
            </div>
          ))}
        </div>
      ) : data && data.chartData && data.chartData.length > 0 ? (
        // Có dữ liệu: hiển thị biểu đồ
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Biểu đồ doanh thu ngày */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg ring-4 ring-blue-100">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {t("reports.revenueChart", "Revenue Chart")}
            </h3>
                </div>
                <button
                  onClick={handleExportChartData}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:shadow-lg text-white text-sm font-bold rounded-xl transition-all shadow-md"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </button>
              </div>
            </div>
            <div className="p-8 bg-gradient-to-br from-white to-slate-50">
              <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={data.chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  }}
                    style={{ fontSize: '12px', fontWeight: 600 }}
                    stroke="#64748b"
                />
                <YAxis
                  tickFormatter={(value) =>
                    new Intl.NumberFormat("vi-VN", { notation: "compact", compactDisplay: "short" }).format(value)
                  }
                    style={{ fontSize: '12px', fontWeight: 600 }}
                    stroke="#64748b"
                />
                <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      padding: '12px'
                    }}
                    formatter={(value: number) => [
                      new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value),
                      'Revenue'
                    ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                    strokeWidth={3}
                    fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
            </div>
          </div>

          {/* Biểu đồ số lượng đơn hàng */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg ring-4 ring-emerald-100">
                    <ShoppingCart className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {t("reports.ordersChart", "Orders Chart")}
            </h3>
                </div>
              </div>
            </div>
            <div className="p-8 bg-gradient-to-br from-white to-slate-50">
              <ResponsiveContainer width="100%" height={320}>
              <BarChart data={data.chartData}>
                  <defs>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.7}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  }}
                    style={{ fontSize: '12px', fontWeight: 600 }}
                    stroke="#64748b"
                />
                  <YAxis 
                    style={{ fontSize: '12px', fontWeight: 600 }}
                    stroke="#64748b"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      padding: '12px'
                    }}
                    cursor={{ fill: 'rgba(16, 185, 129, 0.1)' }}
                  />
                  <Legend 
                    wrapperStyle={{ 
                      paddingTop: '20px',
                      fontWeight: 600,
                      fontSize: '14px'
                    }}
                  />
                  <Bar 
                    dataKey="orderCount" 
                    fill="url(#colorOrders)"
                    radius={[8, 8, 0, 0]}
                  />
              </BarChart>
            </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : data ? (
        // Không có dữ liệu biểu đồ cho khoảng ngày được chọn
        <div className="bg-white/90 backdrop-blur-sm p-12 rounded-2xl border border-slate-200/60 shadow-xl">
          <div className="flex flex-col items-center gap-3">
            <div className="p-4 bg-slate-100 rounded-2xl">
              <BarChart2 className="w-12 h-12 text-slate-400" />
            </div>
            <p className="text-base font-medium text-slate-600">
              {t("reports.noChartData", "No chart data available for this time period")}
          </p>
          </div>
        </div>
      ) : null}

      {/* Danh sách sản phẩm bán chạy */}
      {data && data.topProducts && data.topProducts.length > 0 && (
        <div className="bg-white p-6 rounded-xl border-2 border-slate-200 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg shadow-md">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
            {t("reports.topProducts", "Sản phẩm bán chạy")}
          </h3>
            <button
              onClick={handleExportTopProducts}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors shadow-md"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
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

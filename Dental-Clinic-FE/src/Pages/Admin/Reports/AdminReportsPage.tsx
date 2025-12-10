import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { adminApi } from "../../../services/admin/adminApi";
import { formatMoney } from "../../../utils/adminUtils";
import { useAdminApi } from "../../../hooks/useAdminApi";
import {
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

  // Lấy thông tin tổng quan nhân viên, phòng khám, lịch hẹn hôm nay
  const fetchAdditionalStats = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0];

    const [staffData, clinicsData, appointmentsData] = await Promise.all([
      executeStats(() => adminApi.staff.getAll({}), { showErrorToast: false }),
      executeStats(() => adminApi.clinics.getAll(), { showErrorToast: false }),
      executeStats(() => adminApi.appointments.getAll(today), { showErrorToast: false }),
    ]);

    // Hàm lấy số lượng phần tử cho các kiểu response khác nhau
    const getLength = (data: any): number => {
      if (Array.isArray(data)) return data.length;
      if (data && typeof data === 'object' && 'content' in data) return data.content?.length || 0;
      return 0;
    };

    setStats({
      totalStaff: getLength(staffData),
      totalClinics: Array.isArray(clinicsData) ? clinicsData.length : 0,
      todayAppointments: Array.isArray(appointmentsData) ? appointmentsData.length : 0,
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
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">
              {t("reports.totalStaff", "Tổng nhân viên")}
            </span>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.totalStaff}</p>
        </div>

        {/* Tổng số phòng khám */}
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

        {/* Tổng số lịch hẹn hôm nay */}
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
        // Có dữ liệu: hiển thị biểu đồ
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Biểu đồ doanh thu ngày */}
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

          {/* Biểu đồ số lượng đơn hàng */}
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
        // Không có dữ liệu biểu đồ cho khoảng ngày được chọn
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500 text-center">
            {t("reports.noChartData", "Không có dữ liệu biểu đồ trong khoảng thời gian này")}
          </p>
        </div>
      ) : null}

      {/* Danh sách sản phẩm bán chạy */}
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

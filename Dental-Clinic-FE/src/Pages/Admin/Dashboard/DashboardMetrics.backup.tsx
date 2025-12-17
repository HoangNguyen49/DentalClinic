import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { adminApi } from "../../../services/admin/adminApi";
import { useAdminApi } from "../../../hooks/useAdminApi";
import {
  Users,
  UserCircle,
  Building2,
  Calendar,
  CalendarRange,
  FileText,
  DollarSign,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Boxes,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip, Legend } from "recharts";

interface DashboardMetrics {
  totalStaff: number;
  totalPatients: number;
  totalClinics: number;
  activeClinics: number;
  todayAppointments: number;
  weekAppointments: number;
  monthAppointments: number;
  todayAttendance: number;
  pendingLeaveRequests: number;
  todayTotalSales: number; // Doanh số (tổng giá trị hóa đơn)
  todayRevenue: number; // Tiền thực thu (chỉ đã thanh toán)
  weekTotalSales: number;
  monthTotalSales: number;
  previousMonthTotalSales: number;
  weekRevenue: number;
  monthRevenue: number;
  previousMonthRevenue: number;
  netProfit: number;
  expensesSupported: boolean;
  lowStockItems: number;
  retentionRate: number;
  todayNewPatients: number;
  weekNewPatients: number;
  monthNewPatients: number;
  returningPatients: number;
  patientsThisMonth: number;
  todayCancelledAppointments: number;
  appointmentsByStatus: Record<string, number>;
  sourceBreakdown: Record<string, number>;
  topDoctors: TopDoctor[];
  loading: boolean;
  totalProducts?: number;
  activeProducts?: number;
  inactiveProducts?: number;
  outOfStockProductsCount?: number;
  totalStockQuantity?: number;
}

interface TopDoctor {
  doctorId: number;
  doctorName: string;
  completedAppointments: number;
  revenue: number;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: "blue" | "green" | "orange" | "purple" | "red" | "indigo";
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const MetricCard = ({ title, value, icon, color, trend }: MetricCardProps) => {
  const colorClasses = {
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-600",
      border: "border-blue-200",
      iconBg: "bg-gradient-to-br from-blue-500 to-blue-600",
    },
    green: {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      border: "border-emerald-200",
      iconBg: "bg-gradient-to-br from-emerald-500 to-emerald-600",
    },
    orange: {
      bg: "bg-orange-50",
      text: "text-orange-600",
      border: "border-orange-200",
      iconBg: "bg-gradient-to-br from-orange-500 to-orange-600",
    },
    purple: {
      bg: "bg-purple-50",
      text: "text-purple-600",
      border: "border-purple-200",
      iconBg: "bg-gradient-to-br from-purple-500 to-purple-600",
    },
    red: {
      bg: "bg-red-50",
      text: "text-red-600",
      border: "border-red-200",
      iconBg: "bg-gradient-to-br from-red-500 to-red-600",
    },
    indigo: {
      bg: "bg-indigo-50",
      text: "text-indigo-600",
      border: "border-indigo-200",
      iconBg: "bg-gradient-to-br from-indigo-500 to-indigo-600",
    },
  };

  const colors = colorClasses[color];

  return (
    <div className={`relative bg-white rounded-xl border-2 ${colors.border} p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-lg ${colors.iconBg} text-white shadow-md`}>
          {icon}
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
              trend.isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            <TrendingUp
              className={`w-3 h-3 ${trend.isPositive ? "" : "rotate-180"}`}
            />
            {trend.isPositive ? "+" : ""}
            {trend.value}%
          </div>
        )}
      </div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
        {title}
      </h3>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
};

export default function DashboardMetrics() {
  const { t } = useTranslation("admin");

  // State dùng để lưu các số liệu dashboard
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalStaff: 0,
    totalPatients: 0,
    totalClinics: 0,
    activeClinics: 0,
    todayAppointments: 0,
    weekAppointments: 0,
    monthAppointments: 0,
    todayAttendance: 0,
    pendingLeaveRequests: 0,
    todayTotalSales: 0,
    todayRevenue: 0,
    weekTotalSales: 0,
    monthTotalSales: 0,
    previousMonthTotalSales: 0,
    weekRevenue: 0,
    monthRevenue: 0,
    previousMonthRevenue: 0,
    netProfit: 0,
    expensesSupported: false,
    lowStockItems: 0,
    retentionRate: 0,
    todayNewPatients: 0,
    weekNewPatients: 0,
    monthNewPatients: 0,
    returningPatients: 0,
    patientsThisMonth: 0,
    todayCancelledAppointments: 0,
    appointmentsByStatus: {},
    sourceBreakdown: {},
    topDoctors: [],
    loading: true,
    totalProducts: 0,
    activeProducts: 0,
    inactiveProducts: 0,
    outOfStockProductsCount: 0,
    totalStockQuantity: 0,
  });
  // State dùng để lưu lỗi (nếu có)
  const [error, setError] = useState<string | null>(null);

  const { execute: executeStats } = useAdminApi<any>();
  const { execute: executeInventory } = useAdminApi<any>();

  // Hàm gọi API để lấy dữ liệu thống kê dashboard + tồn kho
  const fetchMetrics = async () => {
    setError(null);

    // Gọi đồng thời 2 API dashboard và inventory
    const [statsData, inventoryData] = await Promise.all([
      executeStats(() => adminApi.dashboard.getStats(), { showErrorToast: false }),
      executeInventory(() => adminApi.inventory.getStatistics(), { showErrorToast: false }),
    ]);

    if (statsData) {
      const stats = statsData || {};
      const inventoryStats = inventoryData || {};
      // Hàm ép kiểu dữ liệu về số, nếu null/undefined/NaN trả về 0
      const toNumber = (value: any) =>
        value === null || value === undefined || Number.isNaN(Number(value))
          ? 0
          : parseFloat(value.toString());
      setMetrics({
        totalStaff: stats.totalStaff || 0,
        totalPatients: stats.totalPatients || 0,
        totalClinics: stats.totalClinics || 0,
        activeClinics: stats.activeClinics || 0,
        todayAppointments: stats.todayAppointments || 0,
        weekAppointments: stats.weekAppointments || 0,
        monthAppointments: stats.monthAppointments || 0,
        todayAttendance: stats.todayAttendance || 0,
        pendingLeaveRequests: stats.pendingLeaveRequests || 0,
        todayTotalSales: toNumber(stats.todayTotalSales),
        todayRevenue: toNumber(stats.todayRevenue),
        weekTotalSales: toNumber(stats.weekTotalSales),
        monthTotalSales: toNumber(stats.monthTotalSales),
        previousMonthTotalSales: toNumber(stats.previousMonthTotalSales),
        weekRevenue: toNumber(stats.weekRevenue),
        monthRevenue: toNumber(stats.monthRevenue),
        previousMonthRevenue: toNumber(stats.previousMonthRevenue),
        netProfit: toNumber(stats.netProfit),
        expensesSupported: Boolean(stats.expensesSupported),
        lowStockItems: inventoryStats?.lowStockProductsCount ?? 0,
        retentionRate: toNumber(stats.retentionRate),
        todayNewPatients: stats.todayNewPatients || 0,
        weekNewPatients: stats.weekNewPatients || 0,
        monthNewPatients: stats.monthNewPatients || 0,
        returningPatients: stats.returningPatients || 0,
        patientsThisMonth: stats.patientsThisMonth || 0,
        todayCancelledAppointments: stats.todayCancelledAppointments || 0,
        appointmentsByStatus: stats.appointmentsByStatus || {},
        sourceBreakdown: stats.sourceBreakdown || {},
        topDoctors: stats.topDoctors
          ? stats.topDoctors.map((d: any) => ({
              doctorId: d.doctorId,
              doctorName: d.doctorName,
              completedAppointments: d.completedAppointments ?? 0,
              revenue: toNumber(d.revenue),
            }))
          : [],
        totalProducts: inventoryStats?.totalProducts ?? 0,
        activeProducts: inventoryStats?.activeProducts ?? 0,
        inactiveProducts: inventoryStats?.inactiveProducts ?? 0,
        outOfStockProductsCount: inventoryStats?.outOfStockProductsCount ?? 0,
        totalStockQuantity: inventoryStats?.totalStockQuantity ?? 0,
        loading: false,
      });
    } else {
      setError(t("dashboard.errors.fetchFailed", "Không tải được số liệu dashboard"));
      setMetrics((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchMetrics();
    // Setup interval tự động refresh số liệu sau mỗi 5 phút
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Hiển thị hiệu ứng loading khi đang fetch data
  if (metrics.loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse"
          >
            <div className="h-12 bg-slate-200 rounded mb-4"></div>
            <div className="h-8 bg-slate-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  // Format số sang tiền VNĐ
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatCompact = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 1,
    }).format(value);

  // Chuẩn hóa dữ liệu cho Pie chart thể hiện nguồn khách
  const sourceData = Object.entries(metrics.sourceBreakdown || {}).map(([channel, total]) => ({
    name: channel || "UNKNOWN",
    value: total,
  }));
  const sourceColors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#6366f1", "#14b8a6"];

  // Component cho section header
  const SectionHeader = ({ title, icon, color }: { title: string; icon: React.ReactNode; color: string }) => (
    <div className="flex items-center gap-3 mb-5">
      <div className={`p-2 rounded-lg bg-gradient-to-br ${color} text-white shadow-md`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900">{title}</h3>
      <div className="flex-1 h-px bg-gradient-to-r from-slate-300 to-transparent"></div>
    </div>
  );

  return (
    <div className="space-y-10">
      {/* Hiển thị lỗi nếu fetch số liệu thất bại */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg shadow-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Section: Tổng quan chính */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-sm">
        <SectionHeader 
          title={t("dashboard.sections.overview", "Tổng quan")} 
          icon={<BarChart3 className="w-5 h-5" />}
          color="from-blue-500 to-indigo-600"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title={t("dashboard.metrics.totalPatients", "Tổng bệnh nhân")}
            value={metrics.totalPatients}
            icon={<UserCircle className="w-6 h-6" />}
            color="indigo"
          />
          <MetricCard
            title={t("dashboard.metrics.totalStaff", "Tổng nhân viên")}
            value={metrics.totalStaff}
            icon={<Users className="w-6 h-6" />}
            color="blue"
          />
          <MetricCard
            title={t("dashboard.metrics.activeClinics", "Phòng khám hoạt động")}
            value={`${metrics.activeClinics}/${metrics.totalClinics}`}
            icon={<Building2 className="w-6 h-6" />}
            color="green"
          />
          <MetricCard
            title={t("dashboard.metrics.retentionRate", "Tỷ lệ quay lại")}
            value={`${metrics.retentionRate.toFixed(1)}%`}
            icon={<TrendingUp className="w-6 h-6" />}
            color="green"
            trend={{
              value: metrics.retentionRate,
              isPositive: metrics.retentionRate >= 50,
            }}
          />
        </div>
      </div>

      {/* Section: Lịch hẹn & Nhân sự */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 shadow-sm">
        <SectionHeader 
          title={t("dashboard.sections.appointments", "Lịch hẹn & Nhân sự")} 
          icon={<Calendar className="w-5 h-5" />}
          color="from-purple-500 to-pink-600"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title={t("dashboard.metrics.todayAppointments", "Lịch hẹn hôm nay")}
            value={metrics.todayAppointments}
            icon={<Calendar className="w-6 h-6" />}
            color="purple"
          />
          <MetricCard
            title={t("dashboard.metrics.weekAppointments", "Lịch hẹn tuần")}
            value={metrics.weekAppointments}
            icon={<CalendarRange className="w-6 h-6" />}
            color="purple"
          />
          <MetricCard
            title={t("dashboard.metrics.monthAppointments", "Lịch hẹn tháng")}
            value={metrics.monthAppointments}
            icon={<CalendarRange className="w-6 h-6" />}
            color="indigo"
          />
          <MetricCard
            title={t("dashboard.metrics.todayAttendance", "Chấm công hôm nay")}
            value={metrics.todayAttendance}
            icon={<FileText className="w-6 h-6" />}
            color="orange"
          />
        </div>
      </div>

      {/* Section: Cảnh báo */}
      <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 shadow-sm">
        <SectionHeader 
          title={t("dashboard.sections.alerts", "Cảnh báo")} 
          icon={<AlertCircle className="w-5 h-5" />}
          color="from-red-500 to-orange-600"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard
            title={t("dashboard.metrics.pendingLeaveRequests", "Đơn nghỉ chờ duyệt")}
            value={metrics.pendingLeaveRequests}
            icon={<AlertCircle className="w-6 h-6" />}
            color="red"
          />
          <MetricCard
            title={t("dashboard.metrics.todayCancelled", "Hủy hẹn hôm nay")}
            value={metrics.todayCancelledAppointments}
            icon={<AlertCircle className="w-6 h-6" />}
            color="red"
          />
          <MetricCard
            title={t("dashboard.metrics.lowStockItems", "Sản phẩm sắp hết")}
            value={metrics.lowStockItems}
            icon={<AlertCircle className="w-6 h-6" />}
            color="orange"
          />
        </div>
      </div>

      {/* Section: Tài chính */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 shadow-sm">
        <SectionHeader 
          title={t("dashboard.sections.financial", "Tài chính")} 
          icon={<DollarSign className="w-5 h-5" />}
          color="from-emerald-500 to-teal-600"
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Tài chính hôm nay */}
          <div className="bg-white rounded-xl border-2 border-emerald-200 p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">
                  {t("dashboard.metrics.todayFinancial", "Tài chính hôm nay")}
                </h4>
                <p className="text-xs text-slate-500">
                  {new Date().toLocaleDateString("vi-VN")}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                    {t("dashboard.metrics.totalSales", "Doanh số")}
                  </span>
                </div>
                <span className="text-base font-bold text-blue-900">
                  {formatCurrency(metrics.todayTotalSales)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                    {t("dashboard.metrics.actualRevenue", "Thực thu")}
                  </span>
                </div>
                <span className="text-base font-bold text-emerald-900">
                  {formatCurrency(metrics.todayRevenue)}
                </span>
              </div>
              {metrics.todayTotalSales > metrics.todayRevenue && (
                <div className="flex items-center justify-between p-2 bg-orange-50 rounded-lg border border-orange-200 text-xs">
                  <span className="font-medium text-orange-700">
                    {t("dashboard.metrics.pendingAmount", "Chưa thu")}
                  </span>
                  <span className="font-bold text-orange-700">
                    {formatCurrency(metrics.todayTotalSales - metrics.todayRevenue)}
                  </span>
                </div>
              )}
            </div>
          </div>
          {/* Doanh thu tuần/tháng/tháng trước */}
          <div className="bg-white rounded-xl border-2 border-emerald-200 p-6 shadow-md hover:shadow-lg transition-shadow lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <h4 className="font-bold text-slate-900">
                  {t("dashboard.metrics.revenueSummary", "So sánh doanh thu")}
                </h4>
              </div>
              {!metrics.expensesSupported && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
                  {t("dashboard.metrics.expensesNotSupported", "Chi phí chưa bật")}
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarRange className="w-4 h-4 text-blue-600" />
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                    {t("dashboard.metrics.weekRevenue", "Tuần")}
                  </p>
                </div>
                <p className="text-xl font-bold text-blue-900 mb-1">{formatCurrency(metrics.weekRevenue)}</p>
                <div className="flex items-center gap-1 text-xs text-blue-600">
                  <span className="font-medium">Doanh số:</span>
                  <span className="font-semibold">{formatCompact(metrics.weekTotalSales)}</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-200 hover:shadow-md transition-shadow ring-2 ring-emerald-300 ring-offset-2">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide">
                    {t("dashboard.metrics.monthRevenue", "Tháng này")}
                  </p>
                </div>
                <p className="text-xl font-bold text-emerald-900 mb-1">{formatCurrency(metrics.monthRevenue)}</p>
                <div className="flex items-center gap-1 text-xs text-emerald-600">
                  <span className="font-medium">Doanh số:</span>
                  <span className="font-semibold">{formatCompact(metrics.monthTotalSales)}</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-slate-600" />
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                    {t("dashboard.metrics.prevMonthRevenue", "Tháng trước")}
                  </p>
                </div>
                <p className="text-xl font-bold text-slate-900 mb-1">{formatCurrency(metrics.previousMonthRevenue)}</p>
                <div className="flex items-center gap-1 text-xs text-slate-600">
                  <span className="font-medium">Doanh số:</span>
                  <span className="font-semibold">{formatCompact(metrics.previousMonthTotalSales)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Bệnh nhân */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 shadow-sm">
        <SectionHeader 
          title={t("dashboard.sections.patients", "Bệnh nhân")} 
          icon={<UserCircle className="w-5 h-5" />}
          color="from-indigo-500 to-blue-600"
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Bệnh nhân mới */}
          <div className="bg-white rounded-xl border-2 border-indigo-200 p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
                <Users className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-slate-900">
                {t("dashboard.metrics.newPatients", "Bệnh nhân mới")}
              </h4>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100 p-3 hover:shadow-md transition-shadow">
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-1">
                  {t("dashboard.metrics.today", "Hôm nay")}
                </p>
                <p className="text-2xl font-bold text-indigo-900">{metrics.todayNewPatients}</p>
              </div>
              <div className="rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-3 hover:shadow-md transition-shadow">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">
                  {t("dashboard.metrics.week", "Tuần")}
                </p>
                <p className="text-2xl font-bold text-blue-900">{metrics.weekNewPatients}</p>
              </div>
              <div className="rounded-lg border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-3 hover:shadow-md transition-shadow">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">
                  {t("dashboard.metrics.month", "Tháng")}
                </p>
                <p className="text-2xl font-bold text-slate-900">{metrics.monthNewPatients}</p>
              </div>
            </div>
          </div>

          {/* Bệnh nhân quay lại */}
          <div className="bg-white rounded-xl border-2 border-indigo-200 p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-slate-900">
                {t("dashboard.metrics.returningPatients", "Bệnh nhân quay lại")}
              </h4>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold text-slate-900">
                    {metrics.returningPatients}
                  </p>
                  <span className="text-lg text-slate-400 font-medium">/</span>
                  <p className="text-2xl font-semibold text-slate-600">
                    {metrics.patientsThisMonth || 0}
                  </p>
                </div>
                <p className="text-xs text-slate-500 mt-2 font-medium">
                  {t("dashboard.metrics.patientsThisMonth", "bệnh nhân trong tháng")}
                </p>
              </div>
              <div className="text-right bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border-2 border-emerald-200">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
                  {t("dashboard.metrics.retentionRate", "Tỷ lệ quay lại")}
                </p>
                <p className="text-3xl font-bold text-emerald-700">
                  {metrics.retentionRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Thống kê chi tiết */}
      <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-6 shadow-sm">
        <SectionHeader 
          title={t("dashboard.sections.details", "Chi tiết")} 
          icon={<BarChart3 className="w-5 h-5" />}
          color="from-slate-500 to-gray-600"
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Trạng thái lịch hẹn */}
          <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-md">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-slate-900">
                {t("dashboard.metrics.appointmentsByStatus", "Trạng thái lịch tháng")}
              </h4>
            </div>
            {Object.keys(metrics.appointmentsByStatus || {}).length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">
                {t("dashboard.metrics.noAppointmentsStatus", "Chưa có dữ liệu")}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(metrics.appointmentsByStatus)
                  .sort((a, b) => b[1] - a[1])
                  .map(([status, total]) => (
                    <div
                      key={status}
                      className="flex items-center justify-between rounded-lg border-2 border-slate-200 bg-gradient-to-r from-slate-50 to-gray-50 px-3 py-3 hover:shadow-md transition-shadow"
                    >
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-600">{status}</span>
                      <span className="text-lg font-bold text-slate-900">{total}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Kho hàng */}
          <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md">
                  <Boxes className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900">
                  {t("dashboard.metrics.inventorySummary", "Tình trạng kho")}
                </h4>
              </div>
              <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold">
                {formatCompact(metrics.totalStockQuantity || 0)} items
              </span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="rounded-lg border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-gray-50 p-3 text-center hover:shadow-md transition-shadow">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                  {t("dashboard.metrics.total", "Tổng")}
                </p>
                <p className="text-2xl font-bold text-slate-900">{metrics.totalProducts}</p>
              </div>
              <div className="rounded-lg border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-3 text-center hover:shadow-md transition-shadow">
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-2">
                  {t("dashboard.metrics.active", "Bán")}
                </p>
                <p className="text-2xl font-bold text-emerald-900">{metrics.activeProducts}</p>
              </div>
              <div className="rounded-lg border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 p-3 text-center hover:shadow-md transition-shadow">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                  {t("dashboard.metrics.inactive", "Ngưng")}
                </p>
                <p className="text-2xl font-bold text-slate-900">{metrics.inactiveProducts}</p>
              </div>
              <div className="rounded-lg border-2 border-red-200 bg-gradient-to-br from-red-50 to-red-100 p-3 text-center hover:shadow-md transition-shadow">
                <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-2">
                  {t("dashboard.metrics.outOfStock", "Hết")}
                </p>
                <p className="text-2xl font-bold text-red-700">{metrics.outOfStockProductsCount}</p>
              </div>
            </div>
          </div>

          {/* Top bác sĩ */}
          {metrics.topDoctors.length > 0 && (
            <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-md hover:shadow-lg transition-shadow lg:col-span-2">
              <div className="flex items-center gap-2 mb-5">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-md">
                  <Users className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900">
                  {t("dashboard.metrics.topDoctorsList", "Top bác sĩ theo doanh thu")}
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {metrics.topDoctors.slice(0, 5).map((doc, idx) => {
                  const medalColors = [
                    "from-yellow-400 to-yellow-600",
                    "from-slate-300 to-slate-500",
                    "from-amber-600 to-amber-800",
                    "from-blue-400 to-blue-600",
                    "from-purple-400 to-purple-600",
                  ];
                  return (
                    <div
                      key={doc.doctorId}
                      className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-200 bg-gradient-to-r from-white to-slate-50 hover:shadow-md transition-all hover:-translate-y-0.5"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${medalColors[idx]} text-white flex items-center justify-center font-bold text-base shadow-md ring-2 ring-white`}>
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{doc.doctorName}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" />
                            <span className="font-semibold">{doc.completedAppointments}</span>
                            <span>{t("dashboard.metrics.appointments", "ca")}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold text-emerald-700">{formatCurrency(doc.revenue)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Nguồn khách */}
          <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-md hover:shadow-lg transition-shadow lg:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-md">
                  <Users className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-900">
                  {t("dashboard.metrics.sourceBreakdown", "Nguồn khách trong tháng")}
                </h4>
              </div>
              <span className="text-xs bg-teal-100 text-teal-700 px-3 py-1 rounded-full font-bold">
                {sourceData.reduce((s, d) => s + d.value, 0)} {t("dashboard.metrics.patients", "khách")}
              </span>
            </div>
            {sourceData.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">
                {t("dashboard.metrics.noSourceData", "Chưa có dữ liệu")}
              </p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={sourceData} 
                      dataKey="value" 
                      nameKey="name" 
                      outerRadius={90} 
                      label
                      strokeWidth={2}
                      stroke="#fff"
                    >
                      {sourceData.map((entry, index) => (
                        <Cell key={`cell-${entry.name}`} fill={sourceColors[index % sourceColors.length]} />
                      ))}
                    </Pie>
                    <ReTooltip 
                      contentStyle={{ 
                        borderRadius: '8px', 
                        border: '2px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ 
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

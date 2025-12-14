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
  AlertCircle,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import MetricCard from "./components/MetricCard";
import SectionHeader from "./components/SectionHeader";
import FinancialSection from "./components/FinancialSection";
import PatientsSection from "./components/PatientsSection";
import DetailsSection from "./components/DetailsSection";

// Types
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
  todayTotalSales: number;
  todayRevenue: number;
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

export default function DashboardMetrics() {
  const { t } = useTranslation("admin");

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

  const [error, setError] = useState<string | null>(null);

  const { execute: executeStats } = useAdminApi<any>();
  const { execute: executeInventory } = useAdminApi<any>();

  const fetchMetrics = async () => {
    setError(null);

    const [statsData, inventoryData] = await Promise.all([
      executeStats(() => adminApi.dashboard.getStats(), { showErrorToast: false }),
      executeInventory(() => adminApi.inventory.getStatistics(), { showErrorToast: false }),
    ]);

    if (statsData) {
      const stats = statsData || {};
      const inventoryStats = inventoryData || {};
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
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="space-y-10">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg shadow-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Tổng quan */}
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

      {/* Lịch hẹn & Nhân sự */}
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

      {/* Cảnh báo */}
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

      {/* Tài chính */}
      <FinancialSection
        todayTotalSales={metrics.todayTotalSales}
        todayRevenue={metrics.todayRevenue}
        weekRevenue={metrics.weekRevenue}
        weekTotalSales={metrics.weekTotalSales}
        monthRevenue={metrics.monthRevenue}
        monthTotalSales={metrics.monthTotalSales}
        previousMonthRevenue={metrics.previousMonthRevenue}
        previousMonthTotalSales={metrics.previousMonthTotalSales}
        expensesSupported={metrics.expensesSupported}
        formatCurrency={formatCurrency}
        formatCompact={formatCompact}
      />

      {/* Bệnh nhân */}
      <PatientsSection
        todayNewPatients={metrics.todayNewPatients}
        weekNewPatients={metrics.weekNewPatients}
        monthNewPatients={metrics.monthNewPatients}
        returningPatients={metrics.returningPatients}
        patientsThisMonth={metrics.patientsThisMonth}
        retentionRate={metrics.retentionRate}
      />

      {/* Chi tiết */}
      <DetailsSection
        appointmentsByStatus={metrics.appointmentsByStatus}
        totalProducts={metrics.totalProducts}
        activeProducts={metrics.activeProducts}
        inactiveProducts={metrics.inactiveProducts}
        outOfStockProductsCount={metrics.outOfStockProductsCount}
        totalStockQuantity={metrics.totalStockQuantity}
        topDoctors={metrics.topDoctors}
        sourceBreakdown={metrics.sourceBreakdown}
        formatCurrency={formatCurrency}
        formatCompact={formatCompact}
      />
    </div>
  );
}

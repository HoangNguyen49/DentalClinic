import { useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import {
  Users,
  UserCircle,
  Building2,
  Calendar,
  FileText,
  DollarSign,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip, Legend } from "recharts";

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";

interface DashboardMetrics {
  totalStaff: number;
  totalPatients: number;
  totalClinics: number;
  activeClinics: number;
  todayAppointments: number;
  todayAttendance: number;
  pendingLeaveRequests: number;
  todayRevenue: number;
  lowStockItems: number;
  retentionRate: number;
  todayCancelledAppointments: number;
  sourceBreakdown: Record<string, number>;
  topDoctors: TopDoctor[];
  loading: boolean;
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
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    red: "bg-red-50 text-red-600 border-red-200",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-200",
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${trend.isPositive ? "text-green-600" : "text-red-600"
              }`}
          >
            <TrendingUp
              className={`w-4 h-4 ${trend.isPositive ? "" : "rotate-180"}`}
            />
            {trend.isPositive ? "+" : ""}
            {trend.value}%
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-slate-600 mb-1">{title}</h3>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
};

export default function DashboardMetrics() {
  const { t } = useTranslation("admin");
  const accessToken = localStorage.getItem("accessToken");

  // State lưu trữ các số liệu dashboard
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalStaff: 0,
    totalPatients: 0,
    totalClinics: 0,
    activeClinics: 0,
    todayAppointments: 0,
    todayAttendance: 0,
    pendingLeaveRequests: 0,
    todayRevenue: 0,
    lowStockItems: 0,
    retentionRate: 0,
    todayCancelledAppointments: 0,
    sourceBreakdown: {},
    topDoctors: [],
    loading: true,
  });
  // State lưu lỗi nếu có
  const [error, setError] = useState<string | null>(null);

  // Hàm lấy dữ liệu từ API dashboard + inventory
  const fetchMetrics = async () => {
    if (!accessToken) return;

    try {
      setError(null);
      // Gọi đồng thời hai API dashboard stats & inventory stats
      const [statsRes, inventoryRes]: [
        PromiseSettledResult<any>,
        PromiseSettledResult<any>
      ] = await Promise.allSettled([
        axios
          .get(`${apiBase}/api/admin/dashboard/stats`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          })
          .catch((err: any) => {
            if (err.code === "ERR_NETWORK" || err.code === "ERR_CONNECTION_REFUSED") {
              return Promise.reject(err);
            }
            return Promise.reject(err);
          }),
        axios
          .get(`${apiBase}/api/admin/inventory/statistics`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          })
          .catch((err: any) => {
            if (err.code === "ERR_NETWORK" || err.code === "ERR_CONNECTION_REFUSED") {
              return Promise.reject(err);
            }
            return Promise.reject(err);
          }),
      ]);

      const statsData = statsRes.status === "fulfilled" ? statsRes.value : null;
      const inventoryData = inventoryRes.status === "fulfilled" ? inventoryRes.value : null;

      if (statsData?.status === 200 && statsData.data) {
        const stats = statsData.data || {};
        const inventoryStats = inventoryData?.status === 200 ? inventoryData.data : null;

        // Chuyển số liệu về dạng số nếu invalid thì 0
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
          todayAttendance: stats.todayAttendance || 0,
          pendingLeaveRequests: stats.pendingLeaveRequests || 0,
          todayRevenue: toNumber(stats.todayRevenue),
          lowStockItems: inventoryStats?.lowStockProductsCount ?? 0,
          retentionRate: toNumber(stats.retentionRate),
          todayCancelledAppointments: stats.todayCancelledAppointments || 0,
          sourceBreakdown: stats.sourceBreakdown || {},
          topDoctors: stats.topDoctors
            ? stats.topDoctors.map((d: any) => ({
                doctorId: d.doctorId,
                doctorName: d.doctorName,
                completedAppointments: d.completedAppointments ?? 0,
                revenue: toNumber(d.revenue),
              }))
            : [],
          loading: false,
        });
      } else {
        setError(t("dashboard.errors.fetchFailed", "Không tải được số liệu dashboard"));
        setMetrics((prev) => ({ ...prev, loading: false }));
      }
    } catch (error: any) {
      // Log lỗi nếu là lỗi ngoài lỗi mạng
      if (error?.code !== "ERR_NETWORK" && error?.code !== "ERR_CONNECTION_REFUSED") {
        console.error("Error fetching dashboard stats:", error);
      }
      setError(t("dashboard.errors.fetchFailed", "Không tải được số liệu dashboard"));
      setMetrics((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchMetrics();
    // Tự động refresh số liệu mỗi 5 phút
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [accessToken]);

  // Hiển thị hiệu ứng loading khi đang tải dữ liệu
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

  // Format số thành tiền VNĐ
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Chuẩn hoá dữ liệu Pie chart nguồn khách
  const sourceData = Object.entries(metrics.sourceBreakdown || {}).map(([channel, total]) => ({
    name: channel || "UNKNOWN",
    value: total,
  }));
  const sourceColors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#6366f1", "#14b8a6"];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Hiển thị thông báo lỗi khi không lấy được số liệu */}
      {error && (
        <div className="md:col-span-2 lg:col-span-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {/* Tổng số bệnh nhân */}
      <MetricCard
        title={t("dashboard.metrics.totalPatients", "Tổng bệnh nhân")}
        value={metrics.totalPatients}
        icon={<UserCircle className="w-6 h-6" />}
        color="indigo"
      />
      {/* Tổng số nhân viên */}
      <MetricCard
        title={t("dashboard.metrics.totalStaff", "Tổng nhân viên")}
        value={metrics.totalStaff}
        icon={<Users className="w-6 h-6" />}
        color="blue"
      />
      {/* Số phòng khám đang hoạt động/ tổng số phòng khám */}
      <MetricCard
        title={t("dashboard.metrics.activeClinics", "Phòng khám đang hoạt động")}
        value={`${metrics.activeClinics}/${metrics.totalClinics}`}
        icon={<Building2 className="w-6 h-6" />}
        color="green"
      />
      {/* Lịch hẹn hôm nay */}
      <MetricCard
        title={t("dashboard.metrics.todayAppointments", "Lịch hẹn hôm nay")}
        value={metrics.todayAppointments}
        icon={<Calendar className="w-6 h-6" />}
        color="purple"
      />
      {/* Chấm công hôm nay */}
      <MetricCard
        title={t("dashboard.metrics.todayAttendance", "Chấm công hôm nay")}
        value={metrics.todayAttendance}
        icon={<FileText className="w-6 h-6" />}
        color="orange"
      />
      {/* Đơn nghỉ chờ duyệt */}
      <MetricCard
        title={t(
          "dashboard.metrics.pendingLeaveRequests",
          "Đơn nghỉ chờ duyệt"
        )}
        value={metrics.pendingLeaveRequests}
        icon={<AlertCircle className="w-6 h-6" />}
        color="red"
      />
      {/* Hủy hẹn hôm nay */}
      <MetricCard
        title={t("dashboard.metrics.todayCancelled", "Hủy hẹn hôm nay")}
        value={metrics.todayCancelledAppointments}
        icon={<AlertCircle className="w-6 h-6" />}
        color="red"
      />
      {/* Doanh thu hôm nay */}
      <MetricCard
        title={t("dashboard.metrics.todayRevenue", "Doanh thu hôm nay")}
        value={formatCurrency(metrics.todayRevenue)}
        icon={<DollarSign className="w-6 h-6" />}
        color="green"
      />
      {/* Sản phẩm sắp hết hàng */}
      <MetricCard
        title={t("dashboard.metrics.lowStockItems", "Sản phẩm sắp hết hàng")}
        value={metrics.lowStockItems}
        icon={<AlertCircle className="w-6 h-6" />}
        color="orange"
      />
      {/* Tỷ lệ khách quay lại */}
      <MetricCard
        title={t("dashboard.metrics.retentionRate", "Tỷ lệ khách quay lại")}
        value={`${metrics.retentionRate.toFixed(1)}%`}
        icon={<TrendingUp className="w-6 h-6" />}
        color="green"
        trend={{
          value: metrics.retentionRate,
          isPositive: metrics.retentionRate >= 50,
        }}
      />
      {/* Bác sĩ có doanh thu cao nhất */}
      {metrics.topDoctors.length > 0 && (
        <MetricCard
          title={t("dashboard.metrics.topDoctor", "Bác sĩ doanh thu cao nhất")}
          value={metrics.topDoctors[0].doctorName || "N/A"}
          icon={<Users className="w-6 h-6" />}
          color="blue"
          trend={{
            value: metrics.topDoctors[0].revenue,
            isPositive: true,
          }}
        />
      )}
      {/* Danh sách top n bác sĩ doanh thu cao nhất */}
      {metrics.topDoctors.length > 1 && (
        <div className="md:col-span-2 lg:col-span-4 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800">
              {t("dashboard.metrics.topDoctorsList", "Top bác sĩ theo doanh thu")}
            </h3>
            <span className="text-sm text-slate-500">
              {t("dashboard.metrics.topN", "Top")} {Math.min(metrics.topDoctors.length, 5)}
            </span>
          </div>
          <div className="space-y-2">
            {metrics.topDoctors.slice(0, 5).map((doc) => (
              <div key={doc.doctorId} className="flex items-center justify-between text-sm text-slate-700">
                <span className="font-medium">{doc.doctorName}</span>
                <span className="text-slate-500">{formatCurrency(doc.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Biểu đồ tròn thể hiện nguồn khách hàng */}
      <div className="md:col-span-2 lg:col-span-4 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800">
            {t("dashboard.metrics.sourceBreakdown", "Nguồn khách trong tháng")}
          </h3>
          <span className="text-sm text-slate-500">{sourceData.reduce((s, d) => s + d.value, 0)} khách</span>
        </div>
        {sourceData.length === 0 ? (
          <p className="text-sm text-slate-500">{t("dashboard.metrics.noSourceData", "Chưa có dữ liệu nguồn khách")}</p>
        ) : (
          <div className="w-full h-60">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={sourceData} dataKey="value" nameKey="name" outerRadius={90} label>
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${entry.name}`} fill={sourceColors[index % sourceColors.length]} />
                  ))}
                </Pie>
                <ReTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

import { useTranslation } from "react-i18next";
import { BarChart3, Boxes, Users, Calendar } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip } from "recharts";
import SectionHeader from "./SectionHeader";

interface TopDoctor {
  doctorId: number;
  doctorName: string;
  completedAppointments: number;
  revenue: number;
}

interface DetailsSectionProps {
  appointmentsByStatus: Record<string, number>;
  totalProducts?: number;
  activeProducts?: number;
  inactiveProducts?: number;
  outOfStockProductsCount?: number;
  totalStockQuantity?: number;
  topDoctors: TopDoctor[];
  sourceBreakdown: Record<string, number>;
  formatCurrency: (amount: number) => string;
  formatCompact: (value: number) => string;
}

export default function DetailsSection({
  appointmentsByStatus,
  totalProducts,
  activeProducts,
  inactiveProducts,
  outOfStockProductsCount,
  totalStockQuantity,
  topDoctors,
  sourceBreakdown,
  formatCurrency,
  formatCompact,
}: DetailsSectionProps) {
  const { t } = useTranslation("admin");

  // Map tên nguồn sang tiếng Việt và màu sắc
  const sourceLabels: Record<string, { label: string; color: string }> = {
    WEB_BOOKING: { label: "Đặt lịch online", color: "#3b82f6" }, // Blue
    WALK_IN: { label: "Đến trực tiếp quầy", color: "#10b981" }, // Green
    PHONE: { label: "Gọi điện thoại", color: "#f59e0b" }, // Amber
    REFERRAL: { label: "Người giới thiệu", color: "#8b5cf6" }, // Purple
    SOCIAL_MEDIA: { label: "Mạng xã hội", color: "#ec4899" }, // Pink
    OTHER: { label: "Khác", color: "#6b7280" }, // Gray
  };

  // 3 nguồn chính luôn hiển thị
  const mainSources = ['WEB_BOOKING', 'WALK_IN', 'PHONE'];
  
  // Tạo data với 3 nguồn chính, nếu không có thì để 0
  const sourceData = mainSources.map(channel => ({
    name: channel,
    displayName: sourceLabels[channel].label,
    value: sourceBreakdown?.[channel] || 0,
    color: sourceLabels[channel].color,
  }));
  
  // Thêm các nguồn khác nếu backend có trả về (REFERRAL, SOCIAL_MEDIA, OTHER)
  Object.entries(sourceBreakdown || {}).forEach(([channel, total]) => {
    if (!mainSources.includes(channel)) {
      sourceData.push({
        name: channel,
        displayName: sourceLabels[channel]?.label || channel,
    value: total,
        color: sourceLabels[channel]?.color || "#6b7280",
      });
    }
  });
  
  // Sort by value descending
  sourceData.sort((a, b) => b.value - a.value);


  return (
    <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-6 shadow-sm">
      <SectionHeader
        title={t("dashboard.sections.details", "Chi tiết")}
        icon={<BarChart3 className="w-5 h-5" />}
        color="from-slate-500 to-gray-600"
      />
      <div className="space-y-6">
        {/* Row 1: Trạng thái lịch + Kho hàng */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trạng thái lịch hẹn */}
        <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-md">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900">
              {t("dashboard.metrics.appointmentsByStatus", "Trạng thái lịch tháng")}
            </h4>
            </div>
            <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-bold">
              {Object.values(appointmentsByStatus || {}).reduce((sum, val) => sum + val, 0)} {t("dashboard.metrics.appointments", "lịch")}
            </span>
          </div>
          {Object.keys(appointmentsByStatus || {}).length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">
              {t("dashboard.metrics.noAppointmentsStatus", "Chưa có dữ liệu")}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(appointmentsByStatus)
                .sort((a, b) => b[1] - a[1])
                .map(([status, total]) => {
                  // Màu sắc theo status
                  const statusColors: Record<string, string> = {
                    CONFIRMED: "border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100",
                    PENDING: "border-yellow-200 bg-gradient-to-r from-yellow-50 to-yellow-100",
                    COMPLETED: "border-green-200 bg-gradient-to-r from-green-50 to-green-100",
                    CANCELLED: "border-red-200 bg-gradient-to-r from-red-50 to-red-100",
                    SCHEDULED: "border-purple-200 bg-gradient-to-r from-purple-50 to-purple-100",
                  };
                  const statusTextColors: Record<string, string> = {
                    CONFIRMED: "text-blue-700",
                    PENDING: "text-yellow-700",
                    COMPLETED: "text-green-700",
                    CANCELLED: "text-red-700",
                    SCHEDULED: "text-purple-700",
                  };
                  const colorClass = statusColors[status] || "border-slate-200 bg-gradient-to-r from-slate-50 to-gray-50";
                  const textColor = statusTextColors[status] || "text-slate-600";
                  
                  return (
                  <div
                    key={status}
                      className={`flex items-center justify-between rounded-lg border-2 ${colorClass} px-4 py-3 hover:shadow-md transition-shadow`}
                  >
                      <span className={`text-xs font-bold uppercase tracking-wide ${textColor}`}>{status}</span>
                      <span className="text-2xl font-bold text-slate-900">{total}</span>
                  </div>
                  );
                })}
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
              <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-bold">
                {formatCompact(totalStockQuantity || 0)} {t("dashboard.metrics.items")}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-gray-50 p-4 text-center hover:shadow-md transition-shadow">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                {t("dashboard.metrics.total", "Tổng")}
              </p>
              <p className="text-3xl font-bold text-slate-900">{totalProducts}</p>
            </div>
            <div className="rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 text-center hover:shadow-md transition-shadow ring-2 ring-emerald-200 ring-offset-2">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-3">
                {t("dashboard.metrics.active", "Đang bán")}
              </p>
              <p className="text-3xl font-bold text-emerald-900">{activeProducts}</p>
            </div>
            <div className="rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 p-4 text-center hover:shadow-md transition-shadow">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-3">
                {t("dashboard.metrics.inactive", "Ngưng")}
              </p>
              <p className="text-3xl font-bold text-amber-900">{inactiveProducts}</p>
            </div>
            <div className="rounded-xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-red-100 p-4 text-center hover:shadow-md transition-shadow ring-2 ring-red-200 ring-offset-2">
              <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-3">
                {t("dashboard.metrics.outOfStock", "Hết hàng")}
              </p>
              <p className="text-3xl font-bold text-red-700">{outOfStockProductsCount}</p>
            </div>
            </div>
          </div>
        </div>

        {/* Row 2: Top bác sĩ */}
        {topDoctors.length > 0 && (
          <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-md">
                <Users className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-slate-900">
                {t("dashboard.metrics.topDoctorsList", "Top bác sĩ theo doanh thu")}
              </h4>
            </div>
              <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold">
                Top {Math.min(topDoctors.length, 5)}
              </span>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {topDoctors.slice(0, 5).map((doc, idx) => {
                const medalColors = [
                  "from-yellow-400 to-yellow-600 shadow-yellow-200",
                  "from-slate-300 to-slate-500 shadow-slate-200",
                  "from-amber-600 to-amber-800 shadow-amber-200",
                  "from-blue-400 to-blue-600 shadow-blue-200",
                  "from-purple-400 to-purple-600 shadow-purple-200",
                ];
                const bgColors = [
                  "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300 ring-2 ring-yellow-100",
                  "bg-gradient-to-r from-slate-50 to-gray-50 border-slate-300",
                  "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300",
                  "bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200",
                  "bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200",
                ];
                return (
                  <div
                    key={doc.doctorId}
                    className={`flex items-center justify-between p-5 rounded-xl border-2 ${bgColors[idx]} hover:shadow-lg transition-all hover:-translate-y-1`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${medalColors[idx]} text-white flex items-center justify-center font-bold text-xl shadow-lg ring-4 ring-white`}>
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-base mb-1">{doc.doctorName}</p>
                        <div className="flex items-center gap-3 text-xs">
                          <p className="text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span className="font-semibold">{doc.completedAppointments}</span>
                          <span>{t("dashboard.metrics.appointments", "ca")}</span>
                        </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-emerald-700">{formatCurrency(doc.revenue)}</p>
                      <p className="text-xs text-slate-500 mt-1 font-medium">{t("dashboard.metrics.revenueLabel")}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Row 3: Nguồn khách */}
        <div className="bg-white rounded-xl border-2 border-slate-200 p-6 shadow-md hover:shadow-lg transition-shadow">
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
          {sourceData.reduce((s, d) => s + d.value, 0) === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">
              {t("dashboard.metrics.noSourceData", "Chưa có dữ liệu")}
            </p>
          ) : (
            <div className="flex flex-col lg:flex-row items-center gap-8 py-6">
              {/* Pie Chart - Chỉ hiển thị nguồn có value > 0 */}
              <div className="w-full lg:w-1/2 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                      data={sourceData.filter(d => d.value > 0)}
                    dataKey="value"
                      nameKey="displayName"
                      cx="50%"
                      cy="50%"
                      outerRadius={110}
                      innerRadius={60}
                      label={({ value, percent }) => `${value} (${percent ? (percent * 100).toFixed(0) : 0}%)`}
                      labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                      strokeWidth={3}
                    stroke="#fff"
                  >
                      {sourceData.filter(d => d.value > 0).map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ReTooltip
                    contentStyle={{
                        borderRadius: '12px',
                      border: '2px solid #e2e8f0',
                        boxShadow: '0 8px 16px -4px rgb(0 0 0 / 0.1)',
                        padding: '12px',
                        backgroundColor: 'white'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              </div>
              
              {/* Legend custom */}
              <div className="w-full lg:w-1/2 space-y-3">
                {sourceData.map((entry) => {
                  const totalPatients = sourceData.reduce((s, d) => s + d.value, 0);
                  const percentage = totalPatients > 0 ? ((entry.value / totalPatients) * 100).toFixed(1) : '0.0';
                  
                  return (
                    <div
                      key={entry.name}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 bg-white transition-all ${
                        entry.value > 0 ? 'hover:shadow-lg hover:-translate-y-0.5' : 'opacity-60'
                      }`}
                      style={{ borderColor: `${entry.color}30` }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-5 h-5 rounded-full shadow-md ring-2 ring-white"
                          style={{ backgroundColor: entry.color }}
                        ></div>
                        <span className="font-bold text-slate-900 text-sm">
                          {entry.displayName}
                        </span>
                      </div>
                      <div className="text-right">
                        <p 
                          className={`text-2xl font-bold ${entry.value === 0 ? 'text-slate-400' : ''}`}
                          style={{ color: entry.value > 0 ? entry.color : undefined }}
                        >
                          {entry.value}
                        </p>
                        <p className="text-xs text-slate-500 font-medium">
                          {percentage}%
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

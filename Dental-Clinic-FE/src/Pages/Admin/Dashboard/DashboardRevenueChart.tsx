import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Loader2, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { adminApi } from "../../../services/admin/adminApi";
import { useAdminApi } from "../../../hooks/useAdminApi";

// Định nghĩa cấu trúc dữ liệu cho 1 ngày doanh thu
interface DailyRevenueData {
    date: string;
    revenue: number;
    orderCount: number;
}

// Định nghĩa cấu trúc dữ liệu thống kê tổng hợp
interface DashboardStats {
    weekRevenue: number;
    monthRevenue: number;
    previousMonthRevenue: number;
    totalExpenses: number;
    expensesSupported?: boolean;
    netProfit: number;
    monthOverMonthGrowth: number;
}

export default function DashboardRevenueChart() {
    const { t } = useTranslation("admin");
    const [chartData, setChartData] = useState<DailyRevenueData[]>([]);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { execute } = useAdminApi<any>();

    useEffect(() => {
        // Hàm lấy dữ liệu doanh thu từ backend
        const fetchRevenueData = async () => {
            setError(null);
            setLoading(true);

            const data = await execute(
                () => adminApi.dashboard.getStats(),
                {
                    showErrorToast: false,
                    onSuccess: (stats: any) => {
                        // Ép kiểu dữ liệu cho số, kiểm tra null/undefined
                        const toNumber = (value: any) =>
                            value === null || value === undefined || Number.isNaN(Number(value))
                                ? 0
                                : parseFloat(value.toString());
                        // Lấy dữ liệu doanh thu 7 ngày gần nhất
                        const last7Days = stats.last7DaysRevenue || [];
                        const formattedData = last7Days.map((item: any) => ({
                            date: item.date,
                            revenue: toNumber(item.revenue),
                            orderCount: item.orderCount ?? 0,
                        }));
                        setChartData(formattedData);
                        setStats({
                            weekRevenue: toNumber(stats.weekRevenue),
                            monthRevenue: toNumber(stats.monthRevenue),
                            previousMonthRevenue: toNumber(stats.previousMonthRevenue),
                            totalExpenses: toNumber(stats.totalExpenses),
                            expensesSupported: stats.expensesSupported ?? false,
                            netProfit: toNumber(stats.netProfit),
                            monthOverMonthGrowth: stats.monthOverMonthGrowth ?? 0,
                        });
                        setLoading(false);
                    },
                    onError: () => {
                        setError(t("dashboard.errors.fetchRevenueFailed", "Không tải được dữ liệu doanh thu"));
                        setChartData([]);
                        setLoading(false);
                    },
                }
            );

            if (!data) {
                setError(t("dashboard.errors.fetchRevenueFailed", "Không tải được dữ liệu doanh thu"));
                setChartData([]);
                setLoading(false);
            }
        };

        fetchRevenueData();
    }, []);

    if (loading) {
        // Hiển thị trạng thái loading khi đang lấy dữ liệu từ backend
        return (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[350px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error) {
        // Hiển thị khi xảy ra lỗi dữ liệu từ backend
        return (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[350px] flex flex-col items-center justify-center">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    {t("dashboard.charts.revenueWeek", "Doanh thu 7 ngày qua")}
                </h3>
                <p className="text-sm text-red-600 text-center">{error}</p>
            </div>
        );
    }

    if (!chartData || chartData.length === 0) {
        // Hiển thị khi hoàn toàn không có dữ liệu doanh thu
        return (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[350px] flex flex-col items-center justify-center">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    {t("dashboard.charts.revenueWeek", "Doanh thu 7 ngày qua")}
                </h3>
                <p className="text-sm text-slate-500 text-center">
                    {t("dashboard.charts.notAvailable", "Dữ liệu doanh thu chưa khả dụng")}
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[350px]">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        {t("dashboard.charts.revenueWeek", "Doanh thu 7 ngày qua")}
                    </h3>
                </div>
                {stats && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-right sm:text-left">
                        {/* Chỉ hiển thị Net Profit và Expenses khi module chi phí đã được hỗ trợ */}
                        {stats.expensesSupported && (
                        <div>
                            <p className="text-sm text-slate-500">{t("dashboard.metrics.netProfit", "Lợi nhuận ròng (tháng)")}</p>
                            <p className="text-xl font-bold text-emerald-700">
                                {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(stats.netProfit)}
                            </p>
                            <p className="text-xs text-slate-500">
                                {t("dashboard.metrics.expenses", "Chi phí")}{" "}
                                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(stats.totalExpenses)}
                            </p>
                            </div>
                            )}
                        <div className="sm:text-right">
                            {/* Hiển thị tăng trưởng doanh thu tháng so với tháng trước */}
                            <p className="text-sm text-slate-500">{t("dashboard.metrics.momGrowth", "So với tháng trước")}</p>
                            <p className={`text-xl font-bold ${stats.monthOverMonthGrowth >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                                {stats.monthOverMonthGrowth >= 0 ? "+" : ""}
                                {stats.monthOverMonthGrowth.toFixed(1)}%
                            </p>
                            <p className="text-xs text-slate-500">
                                {t("dashboard.metrics.monthRevenue", "Doanh thu tháng")}{" "}
                                {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(stats.monthRevenue)}
                        </p>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-1 min-h-0 w-full" style={{ minHeight: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            {/* Gradient màu nền dưới biểu đồ */}
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        {/* Hiển thị lưới ngang, không có lưới dọc */}
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: "#64748B" }}
                            tickFormatter={(value) => {
                                // Định dạng nhãn trục X dạng d/m
                                if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
                                    const [, m, d] = value.split("-").map(Number);
                                    return `${d}/${m}`;
                                }
                                const date = typeof value === "string" ? new Date(value) : value;
                                if (isNaN(date.getTime())) return value;
                                return `${date.getDate()}/${date.getMonth() + 1}`;
                            }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: "#64748B" }}
                            // Dùng notation compact cho tiền tệ (1K, 1M,...)
                            tickFormatter={(value) =>
                                new Intl.NumberFormat("vi-VN", { notation: "compact", compactDisplay: "short" }).format(value)
                            }
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: "8px", border: "1px solid #E2E8F0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                            formatter={(value: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value)}
                        />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

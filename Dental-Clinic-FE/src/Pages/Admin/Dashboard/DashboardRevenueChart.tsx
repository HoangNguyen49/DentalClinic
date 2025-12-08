import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Loader2, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import axios from "axios";

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";

// Kiểu dữ liệu cho từng ngày doanh thu
interface DailyRevenueData {
    date: string;
    revenue: number;
    orderCount: number;
}

// Thống kê tổng hợp dashboard
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

    useEffect(() => {
        // Lấy dữ liệu biểu đồ doanh thu (7 ngày)
        const fetchRevenueData = async () => {
            const accessToken = localStorage.getItem("accessToken");
            if (!accessToken) {
                setLoading(false);
                return;
            }

            try {
                setError(null);
                const response = await axios.get(`${apiBase}/api/admin/dashboard/stats`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });

                if (response?.status === 200 && response.data) {
                    const stats: any = response.data || {};
                    const toNumber = (value: any) =>
                        value === null || value === undefined || Number.isNaN(Number(value))
                            ? 0
                            : parseFloat(value.toString());
                    // Lấy dữ liệu 7 ngày qua
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
                } else {
                    setError("Không tải được dữ liệu doanh thu");
                }
            } catch (error: any) {
                // Nếu lỗi mạng hoặc không kết nối API
                if (error?.code !== "ERR_NETWORK" && error?.code !== "ERR_CONNECTION_REFUSED") {
                    console.warn("Error fetching revenue chart:", error?.response?.status || error?.message);
                }
                setError("Không tải được dữ liệu doanh thu");
                setChartData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchRevenueData();
    }, []);

    if (loading) {
        // Hiển thị khi đang tải
        return (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[350px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error) {
        // Hiển thị khi lỗi dữ liệu
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
        // Không có dữ liệu doanh thu
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
                        <div>
                            {/* Lợi nhuận ròng và chi phí */}
                            <p className="text-sm text-slate-500">{t("dashboard.metrics.netProfit", "Lợi nhuận ròng (tháng)")}</p>
                            <p className="text-xl font-bold text-emerald-700">
                                {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(stats.netProfit)}
                            </p>
                            <p className="text-xs text-slate-500">
                                {t("dashboard.metrics.expenses", "Chi phí")}{" "}
                                {stats.expensesSupported
                                    ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(stats.totalExpenses)
                                    : t("dashboard.metrics.expensesNotConfigured", "Chưa cấu hình")}
                            </p>
                            {!stats.expensesSupported && (
                                <p className="text-xs text-orange-600 mt-1">
                                    {t("dashboard.metrics.expensesWarning", "Cần thiết lập module chi phí để tính đúng lợi nhuận")}
                                </p>
                            )}
                        </div>
                        <div className="sm:text-right">
                            {/* Thống kê tăng trưởng tháng */}
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

            <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            {/* Gradient nền area chart cho doanh thu */}
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        {/* Lưới ngang, không có đường dọc */}
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 12, fill: "#64748B" }}
                            tickFormatter={(value) => {
                                // Định dạng nhãn trục X: trả về dạng d/m
                                if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
                                    const [y, m, d] = value.split("-").map(Number);
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

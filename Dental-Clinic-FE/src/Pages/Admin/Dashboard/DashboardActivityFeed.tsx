import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Activity, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { systemService, type AuditLog } from "../../../services/admin/systemService";

export default function DashboardActivityFeed() {
    const { t } = useTranslation("admin");
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                // Gọi API lấy log hoạt động trang admin
                const result = await systemService.getAuditLogs({ page: 0, size: 10 });
                setLogs(result.content || []);
            } catch (error: any) {
                // Nếu lỗi sẽ hiển thị giao diện empty (tránh spam console)
                if (error?.response?.status !== 500) {
                    console.warn("Audit logs API error:", error?.response?.status || error?.message);
                }
                setLogs([]);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    if (loading) {
        // Hiển thị spinner khi đang tải log
        return (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-[350px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-[350px]">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-orange-500" />
                    {t("dashboard.activity.title", "Hoạt động gần đây")}
                </h3>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    {t("actions.viewAll", "Xem tất cả")}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {logs.length === 0 ? (
                    // Thông báo khi không có hoạt động nào
                    <p className="text-center text-slate-500 py-8">
                        {t("dashboard.activity.empty", "Chưa có hoạt động nào")}
                    </p>
                ) : (
                    // Hiển thị danh sách các hoạt động gần đây
                    logs.map((log) => (
                        <div key={log.id} className="flex gap-3">
                            <div className="mt-1">
                                <div className="w-2 h-2 rounded-full bg-blue-500 ring-4 ring-blue-50" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm text-slate-800">
                                    <span className="font-semibold">{log.user?.fullName || log.user?.username || "System"}: </span>
                                    {log.message}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    {formatDistanceToNow(new Date(log.createdAt), {
                                        addSuffix: true,
                                        locale: vi,
                                    })}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

import { useEffect, useState, useMemo } from "react";
import { Search, Filter, FileText, User, X, Calendar } from "lucide-react";
import { type AuditLog, systemService } from "../../../../services/admin/systemService";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

export default function AuditLogsTab() {
    const { t } = useTranslation("admin");
    const [allLogs, setAllLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Bộ lọc tìm kiếm log (gộp action và username)
    const [searchFilter, setSearchFilter] = useState("");
    // Bộ lọc theo ngày (chọn một ngày để xem)
    const [selectedDate, setSelectedDate] = useState<string>("");

    useEffect(() => {
        loadLogs();
    }, [page, selectedDate]);

    // Lấy danh sách nhật ký từ server
    const loadLogs = async () => {
        setLoading(true);
        try {
            const data = await systemService.getAuditLogs({
                page,
                size: 20,
                fromDate: selectedDate || undefined,
                toDate: selectedDate || undefined,
            });
            setAllLogs(data?.content || []);
            setTotalPages(data?.totalPages || 0);
        } catch (error) {
            toast.error(t("system.logs.messages.loadFailed"));
        } finally {
            setLoading(false);
        }
    };

    // Filter logs theo action và username ở frontend
    const logs = useMemo(() => {
        if (!searchFilter.trim()) return allLogs;

        const searchTerm = searchFilter.trim().toLowerCase();
        return allLogs.filter(log => {
            // Tìm trong action
            const action = log.action?.toLowerCase() || "";
            // Tìm trong username và fullName
            const username = log.user?.username?.toLowerCase() || "";
            const fullName = log.user?.fullName?.toLowerCase() || "";
            
            return action.includes(searchTerm) || 
                   username.includes(searchTerm) || 
                   fullName.includes(searchTerm);
        });
    }, [allLogs, searchFilter]);

    return (
        <div className="space-y-8">
            {/* Vùng bộ lọc tìm kiếm log */}
            <div className="bg-gradient-to-br from-slate-50 to-gray-50 p-6 rounded-2xl border-2 border-slate-200 shadow-md">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-slate-600 to-gray-700 rounded-xl shadow-lg">
                        <Filter className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Filter Logs</h3>
                </div>
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                            {t("system.logs.search", "Search")}
                        </label>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                            <input
                                type="text"
                                placeholder={t("system.logs.searchPlaceholder", "Search by action or username...")}
                                value={searchFilter}
                                onChange={(e) => setSearchFilter(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl text-base focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-500 transition-all bg-white"
                            />
                        </div>
                    </div>
                    <div className="min-w-[180px]">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                            {t("system.logs.selectDate", "Select Date")}
                        </label>
                        <div className="relative group">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => {
                                    setSelectedDate(e.target.value);
                                    setPage(0);
                                }}
                                className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl text-base focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-500 transition-all bg-white"
                                aria-label={t("system.logs.selectDate", "Select Date")}
                                title={t("system.logs.selectDate", "Select Date")}
                            />
                        </div>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={() => {
                                setSearchFilter("");
                                setSelectedDate("");
                                setPage(0);
                            }}
                            className="px-5 py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium text-base flex items-center gap-2"
                            title={t("system.logs.clearFilters", "Clear all filters")}
                            aria-label={t("system.logs.clearFilters", "Clear all filters")}
                        >
                            <X className="w-5 h-5" /> {t("system.logs.clearFilters", "Clear")}
                        </button>
                    </div>
                </div>
            </div>

            {/* Bảng hiển thị nhật ký hệ thống */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
                <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-slate-600 to-gray-700 rounded-xl shadow-lg">
                            <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Activity Logs</h2>
                            <p className="text-sm text-slate-600">Total: {logs.length} log{logs.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">{t("system.logs.table.time", "Time")}</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">{t("system.logs.table.user", "User")}</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">{t("system.logs.table.action", "Action")}</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">{t("system.logs.table.details", "Details")}</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">{t("system.logs.table.ip", "IP Address")}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
                                            <p className="text-base font-medium text-slate-600">{t("system.logs.messages.loading", "Loading...")}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : !logs || logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-4 bg-slate-100 rounded-2xl">
                                                <FileText className="w-12 h-12 text-slate-400" />
                                            </div>
                                            <p className="text-slate-600 font-medium text-lg">{t("system.logs.messages.noData", "No logs found")}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gradient-to-r hover:from-slate-50/30 hover:to-gray-50/20 transition-all duration-200">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-medium">
                                            {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss")}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-slate-100 rounded-lg">
                                                    <User className="w-4 h-4 text-slate-600" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900">{log.user?.username || "Unknown"}</div>
                                            <div className="text-xs text-slate-500">ID: {log.user?.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md">
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-700 max-w-xs truncate font-medium" title={log.message}>
                                            {log.message}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-mono">
                                            {log.ipAddr}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Phân trang */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/60 px-6 py-4">
                <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                        className="px-5 py-2.5 border-2 border-slate-300 rounded-xl text-base font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                        {t("system.logs.pagination.previous", "Previous")}
                </button>
                    <span className="text-base text-slate-700 font-bold">
                        {t("system.logs.pagination.page", "Page")} <span className="text-slate-900">{page + 1}</span> / {totalPages || 1}
                </span>
                <button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                        className="px-5 py-2.5 border-2 border-slate-300 rounded-xl text-base font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                        {t("system.logs.pagination.next", "Next")}
                </button>
            </div>
            )}
        </div>
    );
}

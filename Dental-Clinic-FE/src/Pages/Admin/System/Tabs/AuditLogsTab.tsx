import { useEffect, useState } from "react";
import { Search, Loader2, Filter } from "lucide-react";
import { type AuditLog, systemService } from "../../../../services/admin/systemService";
import { toast } from "react-toastify";
import { format } from "date-fns";

export default function AuditLogsTab() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Bộ lọc tìm kiếm log (action, table, userId)
    const [actionFilter, setActionFilter] = useState("");
    const [tableFilter, setTableFilter] = useState("");
    const [userIdFilter, setUserIdFilter] = useState<number | undefined>(undefined);

    useEffect(() => {
        loadLogs();
    }, [page, actionFilter, tableFilter, userIdFilter]);

    // Lấy danh sách nhật ký từ server
    const loadLogs = async () => {
        setLoading(true);
        try {
            const data = await systemService.getAuditLogs({
                page,
                size: 20,
                action: actionFilter,
                tableName: tableFilter,
                userId: userIdFilter,
            });
            setLogs(data?.content || []);
            setTotalPages(data?.totalPages || 0);
        } catch (error) {
            toast.error("Không thể tải nhật ký hệ thống");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Vùng bộ lọc tìm kiếm log */}
            <div className="flex flex-wrap gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm theo hành động..."
                            value={actionFilter}
                            onChange={(e) => setActionFilter(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
                <div className="w-48">
                    <input
                        type="text"
                        placeholder="Tìm theo bảng..."
                        value={tableFilter}
                        onChange={(e) => setTableFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <div className="w-32">
                    <input
                        type="number"
                        placeholder="User ID"
                        value={userIdFilter || ""}
                        onChange={(e) => setUserIdFilter(e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <button
                    onClick={() => {
                        setActionFilter("");
                        setTableFilter("");
                        setUserIdFilter(undefined);
                        setPage(0);
                    }}
                    className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 flex items-center gap-2"
                >
                    <Filter className="w-4 h-4" /> Xóa bộ lọc
                </button>
            </div>

            {/* Bảng hiển thị nhật ký hệ thống */}
            <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Thời gian</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Người dùng</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Hành động</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Chi tiết</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">IP</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                                    </td>
                                </tr>
                            ) : !logs || logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-sm">
                                        Không tìm thấy nhật ký nào.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss")}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                            <div className="font-medium">{log.user?.username || "Unknown"}</div>
                                            <div className="text-xs text-slate-500">ID: {log.user?.id}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate" title={log.message}>
                                            {log.message}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
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
            <div className="flex justify-between items-center pt-4">
                <button
                    // Xử lý lùi trang
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                    Trước
                </button>
                <span className="text-sm text-slate-600">
                    Trang {page + 1} / {totalPages || 1}
                </span>
                <button
                    // Xử lý tiến trang
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                    Sau
                </button>
            </div>
        </div>
    );
}

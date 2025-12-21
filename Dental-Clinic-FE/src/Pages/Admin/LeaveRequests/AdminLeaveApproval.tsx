import { useState, useEffect, useRef } from "react";
import { ToastContainer } from "react-toastify";
import { useTranslation } from "react-i18next";
import { Search, Trash2, Calendar, User, MapPin, AlertCircle, CheckCircle, XCircle, Clock } from "lucide-react";
import { useNotification } from "../../../app/providers/NotificationContext";
import { adminApi } from "../../../services/admin/adminApi";
import { useAdminApi } from "../../../hooks/useAdminApi";
import { formatDate } from "../../../utils/dateUtils";
import { toast } from "react-toastify";
import { getStatusIcon, getStatusColor, getStatusLabel } from "../../../utils/statusUtils";
import { getShiftTypeLabel } from "../../../utils/shiftUtils";

// Kiểu dữ liệu cho đơn xin nghỉ phép
type LeaveRequest = {
    id: number;
    userId: number;
    userName: string;
    userFullName?: string;
    clinicId: number;
    clinicName?: string;
    startDate: string;
    endDate: string;
    type: string;
    status: string;
    reason: string;
    shiftType?: string;
    approvedBy?: number;
    approvedByName?: string;
    createdAt: string;
    updatedAt: string;
    leaveBalance?: number;
    annualLeaveTotal?: number;
    annualLeaveUsed?: number;
    annualLeaveRemaining?: number;
    replacementAvailable?: boolean;
    potentialReplacements?: string[];
    userRole?: string;
};

export default function AdminLeaveApproval() {
    const { t } = useTranslation();
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    // Trạng thái lọc (Pending Admin duyệt mặc định)
    const [statusFilter, setStatusFilter] = useState<string>("PENDING_ADMIN");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
    const [comment, setComment] = useState("");
    const [counts, setCounts] = useState<{ [key: string]: number }>({});
    const [typeFilter, setTypeFilter] = useState<string>("");

    const { notifications } = useNotification();
    const lastNotificationIdRef = useRef<number | null>(null);

    const { loading, execute } = useAdminApi<any>();
    const { loading: loadingPending, execute: executePending } = useAdminApi<any[]>();
    const { execute: executeCounts } = useAdminApi<Record<string, number>>();
    const { execute: executeProcess } = useAdminApi<any>();

    useEffect(() => {
        // Mỗi khi page hoặc filter đổi thì load danh sách mới
        if (statusFilter === "PENDING_ADMIN") {
            fetchPendingRequests();
        } else {
            fetchLeaveRequests();
        }
        fetchCounts();
    }, [page, statusFilter]);

    useEffect(() => {
        // Khi có noti mới về nghỉ phép thì reload
        if (!notifications || notifications.length === 0) return;
        const latestNotification = notifications[0];
        if (!latestNotification || latestNotification.notificationId === lastNotificationIdRef.current) {
            return;
        }
        if (
            latestNotification.type === "LEAVE_REQUEST_CREATED" &&
            latestNotification.relatedEntityType === "LEAVE_REQUEST"
        ) {
            lastNotificationIdRef.current = latestNotification.notificationId;
            fetchLeaveRequests();
            fetchCounts();
            if (statusFilter === "PENDING_ADMIN" || statusFilter === "") {
                fetchPendingRequests();
            }
        }
    }, [notifications]);

    // Lấy toàn bộ đơn xin nghỉ có phân trang/filter
    const fetchLeaveRequests = async () => {
        const params: any = { page, size: 10 };
        if (statusFilter) params.status = statusFilter;
        await execute(
            () => adminApi.leaveRequests.getAll(params),
            {
                showErrorToast: true,
                errorMessage: t("leaveRequest.messages.loadFailed", "Không thể tải danh sách đơn xin nghỉ"),
                onSuccess: (data) => {
                    if (data && typeof data === "object" && "content" in data) {
                        setLeaveRequests(data.content || []);
                        setTotalPages(data.totalPages || 0);
                    } else {
                        setLeaveRequests([]);
                        setTotalPages(0);
                    }
                },
            }
        );
    };

    // Lấy đơn nghỉ phép trạng thái PENDING_ADMIN (chờ Admin duyệt)
    const fetchPendingRequests = async () => {
        await executePending(
            () => adminApi.leaveRequests.getPendingAdmin(),
            {
                showErrorToast: true,
                errorMessage: t("leaveRequest.messages.loadFailed", "Không thể tải danh sách đơn xin nghỉ"),
                onSuccess: (data) => {
                    setLeaveRequests(data || []);
                    setTotalPages(0);
                },
            }
        );
    };

    // Lấy số lượng đơn cho các trạng thái hiển thị badge tab
    const fetchCounts = async () => {
        await executeCounts(
            () => adminApi.leaveRequests.getCounts(),
            {
                showErrorToast: false,
                onSuccess: (data) => {
                    setCounts(data || {});
                },
            }
        );
    };

    // Xử lý duyệt hoặc từ chối đơn
    const handleProcess = async (action: "APPROVE" | "REJECT", request?: LeaveRequest) => {
        const targetRequest = request || selectedRequest;
        if (!targetRequest) return;
        await executeProcess(
            () => adminApi.leaveRequests.process(targetRequest.id, action, comment || undefined),
            {
                showErrorToast: true,
                errorMessage: t("leaveRequest.messages.processFailed", "Không thể xử lý đơn"),
                onSuccess: () => {
                    toast.success(
                        action === "APPROVE"
                            ? t("leaveRequest.messages.approveSuccess", "Duyệt đơn thành công")
                            : t("leaveRequest.messages.rejectSuccess", "Từ chối đơn thành công")
                    );
                    setSelectedRequest(null);
                    setComment("");
                    fetchLeaveRequests();
                    if (statusFilter === "PENDING_ADMIN") {
                        fetchPendingRequests();
                    }
                    fetchCounts();
                },
            }
        );
    };

    // Helper functions moved to shared utils - no duplicate code!

    // Lọc danh sách theo từ khóa search và loại đơn (nghỉ việc...)
    const filteredRequests = leaveRequests.filter((req) => {
        if (typeFilter && req.type.toUpperCase() !== typeFilter.toUpperCase()) {
            return false;
        }
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
            req.userFullName?.toLowerCase().includes(searchLower) ||
            req.userName.toLowerCase().includes(searchLower) ||
            req.clinicName?.toLowerCase().includes(searchLower) ||
            req.reason.toLowerCase().includes(searchLower)
        );
    });

    // Hiển thị loading khi fetch dữ liệu
    if ((loading || loadingPending) && leaveRequests.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex justify-center items-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 p-8">
            <ToastContainer position="top-right" autoClose={3000} />
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <section className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg ring-4 ring-purple-100">
                        <Calendar className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                            {t("leaveRequest.adminTitle", "Leave Request Approval")}
                        </h1>
                        <p className="text-sm text-gray-600 font-medium mt-1">Review and process employee leave requests</p>
            </div>
                </section>

                <section className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/60 p-6">
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="flex-1 relative group">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-purple-500 transition-colors" />
                        <input
                            type="text"
                                placeholder={t("leaveRequest.searchPlaceholder", "Search by name, clinic, or reason...")}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all text-base bg-gradient-to-br from-white to-slate-50"
                        />
                    </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {/* Tab lọc theo trạng thái đơn */}
                        <button
                            onClick={() => {
                                setStatusFilter("");
                                fetchLeaveRequests();
                            }}
                            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${statusFilter === ""
                                ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200/50"
                                : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                                }`}
                        >
                            {t("common.all", "All")}
                        </button>
                        <button
                            onClick={() => {
                                setStatusFilter("PENDING_ADMIN");
                            }}
                            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${statusFilter === "PENDING_ADMIN"
                                ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-200/50"
                                : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                                }`}
                        >
                            <Clock className="w-4 h-4" />
                            {t("leaveRequest.status.pendingAdmin", "Pending Approval")}
                            {counts["PENDING_ADMIN"] > 0 && (
                                <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
                                    {counts["PENDING_ADMIN"]}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => {
                                setStatusFilter("APPROVED");
                                fetchLeaveRequests();
                            }}
                            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${statusFilter === "APPROVED"
                                ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-200/50"
                                : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                                }`}
                        >
                            <CheckCircle className="w-4 h-4" />
                            {t("leaveRequest.status.approved", "Approved")}
                        </button>
                        <button
                            onClick={() => {
                                setStatusFilter("REJECTED");
                                fetchLeaveRequests();
                            }}
                            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${statusFilter === "REJECTED"
                                ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-200/50"
                                : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                                }`}
                        >
                            <XCircle className="w-4 h-4" />
                            {t("leaveRequest.status.rejected", "Rejected")}
                        </button>
                    </div>
                </section>
                {/* Tab phụ lọc loại đơn với tab đã duyệt */}
                {statusFilter === "APPROVED" && (
                    <section className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/60 p-4">
                        <div className="flex gap-3">
                        <button
                            onClick={() => setTypeFilter("")}
                                className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${typeFilter === ""
                                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200/50"
                                    : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                                }`}
                        >
                                {t("leaveRequest.allApproved", "All Approved")}
                        </button>
                        <button
                            onClick={() => setTypeFilter("RESIGNATION")}
                                className={`px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all ${typeFilter === "RESIGNATION"
                                    ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-200/50"
                                    : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                                }`}
                        >
                            <Trash2 className="w-4 h-4" />
                                {t("leaveRequest.resignation.filter", "Resignations")}
                            {leaveRequests.filter(r => r.type === "RESIGNATION" && r.status === "APPROVED").length > 0 && (
                                    <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
                                    {leaveRequests.filter(r => r.type === "RESIGNATION" && r.status === "APPROVED").length}
                                </span>
                            )}
                        </button>
                    </div>
                    </section>
                )}
            {/* Nếu không có đơn nghỉ phép */}
            {filteredRequests.length === 0 ? (
                <section className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/60 p-12">
                    <div className="text-center">
                        <div className="inline-flex p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl mb-4">
                            <Clock className="w-12 h-12 text-purple-600" />
                        </div>
                        <p className="text-slate-600 text-lg font-medium">
                            {typeFilter === "RESIGNATION"
                                ? t("leaveRequest.resignation.noApproved", "No approved resignations")
                                : t("leaveRequest.messages.noRequests", "No leave requests found")
                            }
                        </p>
                        {statusFilter === "APPROVED" && typeFilter !== "RESIGNATION" && (
                            <p className="text-sm text-slate-400 mt-2">
                                {t("leaveRequest.resignation.tip", "Tip: Select 'Resignations' tab to view approved resignation requests")}
                            </p>
                        )}
                    </div>
                </section>
            ) : (
                <div className="space-y-6">
                    {/* Danh sách đơn nghỉ phép */}
                    {filteredRequests.map((request) => (
                        <div
                            key={request.id}
                            className={`rounded-2xl border relative overflow-hidden transition-all duration-300 ${request.type === "RESIGNATION"
                                ? "bg-white/90 backdrop-blur-sm border-red-300 shadow-xl hover:shadow-2xl hover:-translate-y-1"
                                : "bg-white/90 backdrop-blur-sm border-slate-200/60 shadow-xl hover:shadow-2xl hover:-translate-y-1"
                                }`}
                        >
                            {/* Banner đỏ nếu là đơn nghỉ việc */}
                            {request.type === "RESIGNATION" && (
                                <div className="absolute top-0 right-0 px-6 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-bl-2xl shadow-lg">
                                    <div className="flex items-center gap-2">
                                    <Trash2 className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-wider">{t("leaveRequest.resignation.title", "Resignation")}</span>
                                    </div>
                                </div>
                            )}
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                    {/* Thông tin nhân viên */}
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="p-1.5 bg-blue-100 rounded-lg">
                                                <User className="w-3.5 h-3.5 text-blue-600" />
                                            </div>
                                            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">{t("leaveRequest.employee", "Employee")}</p>
                                        </div>
                                        <p className="text-base font-bold text-slate-900 mb-1">
                                                    {request.userFullName || request.userName}
                                                </p>
                                                {request.userRole && (
                                            <p className="text-xs text-slate-600 font-medium">
                                                        {request.userRole}
                                                    </p>
                                                )}
                                            </div>

                                    {/* Cơ sở */}
                                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="p-1.5 bg-purple-100 rounded-lg">
                                                <MapPin className="w-3.5 h-3.5 text-purple-600" />
                                            </div>
                                            <p className="text-xs font-bold text-purple-700 uppercase tracking-wider">Clinic</p>
                                        </div>
                                        <p className="text-base font-bold text-slate-900">
                                                {request.clinicName}
                                        </p>
                                            {request.shiftType && request.shiftType !== "FULL_DAY" && (
                                            <span className="inline-flex mt-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                                                    {getShiftTypeLabel(request.shiftType, t)}
                                                </span>
                                            )}
                                        </div>

                                    {/* Thời gian nghỉ */}
                                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="p-1.5 bg-orange-100 rounded-lg">
                                                <Calendar className="w-3.5 h-3.5 text-orange-600" />
                                            </div>
                                            <p className="text-xs font-bold text-orange-700 uppercase tracking-wider">{t("leaveRequest.time", "Duration")}</p>
                                    </div>
                                        <p className="text-sm font-bold text-slate-900">
                                            {formatDate(request.startDate)}
                                        </p>
                                        <p className="text-xs text-slate-600 mt-0.5">to</p>
                                        <p className="text-sm font-bold text-slate-900">
                                            {formatDate(request.endDate)}
                                        </p>
                                    </div>

                                    {/* Trạng thái đơn */}
                                    <div className="bg-gradient-to-br from-slate-50 to-gray-50 p-4 rounded-xl border border-slate-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="p-1.5 bg-slate-100 rounded-lg">
                                                {getStatusIcon(request.status)}
                                            </div>
                                            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Status</p>
                                        </div>
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-md bg-gradient-to-r ${getStatusColor(request.status)} text-white`}
                                        >
                                            {getStatusIcon(request.status)}
                                            {getStatusLabel(request.status, t)}
                                        </span>
                                    </div>
                                </div>

                                {/* Leave Balance & Replacement Info */}
                                <div className="flex flex-wrap gap-4 mb-4">
                                    {request.leaveBalance !== undefined && (
                                        <div className="flex flex-col gap-2 px-4 py-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-blue-600" />
                                                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">{t("leaveRequest.monthlyLeave", "Days off this month")}:</span>
                                                <span className="font-bold text-base text-blue-900">
                                                    {request.leaveBalance ?? 0} {t("leaveRequest.days", "days")}
                                                </span>
                                            </div>
                                            {request.annualLeaveTotal !== undefined && (
                                                <div className="flex items-center gap-2 pt-2 border-t border-blue-200">
                                                    <Calendar className="w-4 h-4 text-blue-600" />
                                                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Nghỉ phép năm:</span>
                                                    <span className="font-bold text-base text-blue-900">
                                                        {request.annualLeaveUsed ?? 0}/{request.annualLeaveTotal ?? 12} ngày
                                                    </span>
                                                    <span className={`text-xs font-medium ${(request.annualLeaveRemaining ?? 0) <= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                                                        (Còn: {request.annualLeaveRemaining ?? 0})
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {request.replacementAvailable && (
                                        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl border border-green-200">
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                            <span className="text-xs font-bold text-green-700">
                                                {request.potentialReplacements?.length || 0} replacements available
                                                    </span>
                                        </div>
                                    )}
                                    {!request.replacementAvailable && (
                                        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-xl border border-red-200">
                                            <AlertCircle className="w-4 h-4 text-red-600" />
                                            <span className="text-xs font-bold text-red-700">No replacement</span>
                                            </div>
                                        )}
                                    </div>

                                <div className={`pt-5 ${request.type === "RESIGNATION" ? "border-t-2 border-red-200" : "border-t border-slate-200"}`}>
                                    {/* Quy trình xóa vĩnh viễn cho đơn nghỉ việc */}
                                    {request.type === "RESIGNATION" && (
                                        <div className="mb-5">
                                            <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border-2 border-red-200">
                                                <div className="p-2 bg-red-100 rounded-lg">
                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-red-800 mb-2">{t("leaveRequest.resignation.processTitle", "Deletion Process")}</p>
                                                    <div className="flex items-center gap-3 text-xs">
                                                        <span className="flex items-center gap-1.5">
                                                            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-green-500 text-white font-bold text-[10px] shadow-md">✓</span>
                                                            <span className="font-semibold text-green-700">{t("leaveRequest.resignation.step1", "HR")}</span>
                                                        </span>
                                                        <span className="text-slate-400 font-bold">→</span>
                                                        <span className="flex items-center gap-1.5">
                                                            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-purple-500 text-white font-bold text-[10px] shadow-md">2</span>
                                                            <span className="font-semibold text-purple-700">{t("leaveRequest.resignation.step2", "Admin")}</span>
                                                        </span>
                                                        <span className="text-slate-400 font-bold">→</span>
                                                        <span className="flex items-center gap-1.5">
                                                            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-red-500 text-white font-bold text-[10px] shadow-md">3</span>
                                                            <span className="font-semibold text-red-700">{t("leaveRequest.resignation.step3", "Delete")}</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Lý do nghỉ phép */}
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                                            {t("leaveRequest.reason", "Reason")}
                                        </p>
                                        <p className="text-sm text-slate-900 leading-relaxed">{request.reason}</p>
                                    </div>
                                    {/* Tên người duyệt nếu có */}
                                    {request.approvedByName && (
                                        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl border border-blue-200">
                                            <CheckCircle className="w-4 h-4 text-blue-600" />
                                            <span className="text-xs font-bold text-blue-700">
                                                {t("leaveRequest.approvedBy", "Approved by")}: {request.approvedByName}
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center mt-5 pt-5 border-t border-slate-200">
                                        <p className="text-xs text-slate-500 font-medium">
                                            {t("leaveRequest.createdAt", "Created")}:{" "}
                                            <span className="font-semibold">{new Date(request.createdAt).toLocaleString("vi-VN")}</span>
                                        </p>
                                        <div className="flex gap-3">
                                            {/* Nút duyệt/từ chối CHỈ cho PENDING_ADMIN (Admin xử lý) */}
                                            {request.status === "PENDING_ADMIN" && (
                                                <>
                                                    <button
                                                        onClick={() => handleProcess("APPROVE", request)}
                                                        disabled={loading}
                                                        className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all text-sm font-bold shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                        {t("leaveRequest.approve", "Approve")}
                                                    </button>
                                                    <button
                                                        onClick={() => handleProcess("REJECT", request)}
                                                        disabled={loading}
                                                        className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg transition-all text-sm font-bold shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                        {t("leaveRequest.reject", "Reject")}
                                                    </button>
                                                </>
                                            )}
                                            {/* Nếu đã duyệt đơn nghỉ việc thì hiển thị cảnh báo cho HR */}
                                            {request.status === "APPROVED" && request.type === "RESIGNATION" && (
                                                <div className="px-4 py-2.5 bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-300 rounded-xl text-sm">
                                                    <p className="text-blue-800 font-bold flex items-center gap-2">
                                                        <AlertCircle className="w-4 h-4" />
                                                        <span>{t("leaveRequest.resignation.adminConfirmed", "Confirmed. HR will process deletion.")}</span>
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {/* Phân trang nếu có nhiều trang */}
            {totalPages > 1 && (
                <section className="flex items-center justify-center gap-3 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/60 px-6 py-4">
                    <button
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="px-5 py-2.5 text-sm font-medium border border-slate-300 rounded-xl disabled:opacity-50 hover:bg-slate-50 transition-all"
                    >
                        {t("common.previous", "Previous")}
                    </button>
                    <span className="px-6 py-2.5 font-bold text-slate-700">
                        {t("common.page", "Page")} <span className="text-purple-600">{page + 1}</span> / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        className="px-5 py-2.5 text-sm font-medium border border-slate-300 rounded-xl disabled:opacity-50 hover:bg-slate-50 transition-all"
                    >
                        {t("common.next", "Next")}
                    </button>
                </section>
            )}

            {/* Dialog xác nhận duyệt/từ chối đơn nghỉ */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 border border-slate-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg">
                                <Calendar className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900">
                                {t("leaveRequest.processTitle", "Process Leave Request")}
                        </h3>
                        </div>

                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200 mb-6">
                            <p className="text-base text-slate-700 font-medium">
                                Would you like to <span className="font-bold text-green-600">approve</span> or{" "}
                                <span className="font-bold text-red-600">reject</span> this request?
                            </p>
                        </div>

                        {/* Thông tin phép còn lại và người thay thế */}
                        {(selectedRequest.status === "PENDING" || selectedRequest.status === "PENDING_ADMIN") && (
                            <div className="mb-6 space-y-3">
                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                                    <span className="text-sm font-bold text-blue-700">Leave Balance:</span>
                                    <div className="flex flex-col gap-1">
                                        <span className={`font-bold text-lg ${(selectedRequest.leaveBalance || 0) <= 0 ? "text-red-600" : "text-green-600"}`}>
                                            {selectedRequest.leaveBalance} days
                                        </span>
                                        {selectedRequest.annualLeaveTotal !== undefined && (
                                            <div className="text-xs">
                                                <span className="font-medium text-slate-600">
                                                    Phép năm: {selectedRequest.annualLeaveUsed ?? 0}/{selectedRequest.annualLeaveTotal ?? 12} ngày
                                                </span>
                                                <span className={`ml-2 font-medium ${(selectedRequest.annualLeaveRemaining ?? 0) <= 0 ? "text-red-600" : "text-green-600"}`}>
                                                    (Còn: {selectedRequest.annualLeaveRemaining ?? 0})
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className={`flex items-center justify-between p-4 rounded-xl border ${selectedRequest.replacementAvailable ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200" : "bg-gradient-to-r from-red-50 to-rose-50 border-red-200"}`}>
                                    <span className={`text-sm font-bold ${selectedRequest.replacementAvailable ? "text-green-700" : "text-red-700"}`}>Replacement:</span>
                                    {selectedRequest.replacementAvailable ? (
                                        <span className="font-bold text-lg text-green-600">{selectedRequest.potentialReplacements?.length || 0} available</span>
                                    ) : (
                                        <span className="font-bold text-lg text-red-600">None</span>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                Comment (Optional)
                            </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                                placeholder={t("leaveRequest.commentPlaceholder", "Add your comment here...")}
                                rows={4}
                                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all text-base"
                        />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setSelectedRequest(null);
                                    setComment("");
                                }}
                                className="flex-1 px-6 py-3 border-2 border-slate-300 rounded-xl hover:bg-slate-50 transition-all font-medium text-base"
                            >
                                {t("common.cancel", "Cancel")}
                            </button>
                            <button
                                onClick={() => handleProcess("APPROVE")}
                                disabled={loading}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all font-bold text-base shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <CheckCircle className="w-5 h-5" />
                                {t("leaveRequest.approve", "Approve")}
                            </button>
                            <button
                                onClick={() => handleProcess("REJECT")}
                                disabled={loading}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg transition-all font-bold text-base shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <XCircle className="w-5 h-5" />
                                {t("leaveRequest.reject", "Reject")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
        </div>
    );
}

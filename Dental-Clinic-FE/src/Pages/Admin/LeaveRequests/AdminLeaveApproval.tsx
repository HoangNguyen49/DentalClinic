import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { useTranslation } from "react-i18next";
import { CheckCircle, XCircle, Clock, Search, Trash2 } from "lucide-react";
import { useNotification } from "../../../app/providers/NotificationContext";

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";

// Định nghĩa kiểu dữ liệu đơn xin nghỉ
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
    shiftType?: string; // Loại ca: SÁNG, CHIỀU, CẢ NGÀY (dành cho bác sĩ)
    approvedBy?: number;
    approvedByName?: string;
    createdAt: string;
    updatedAt: string;
    leaveBalance?: number;
    replacementAvailable?: boolean;
    potentialReplacements?: string[];
    userRole?: string;
};

// Định nghĩa kiểu dữ liệu trả về dạng phân trang
type PageResponse = {
    content: LeaveRequest[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
};

export default function AdminLeaveApproval() {
    const { t } = useTranslation();
    const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    // Trạng thái bộ lọc: mặc định là chờ admin duyệt
    const [statusFilter, setStatusFilter] = useState<string>("PENDING_ADMIN");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
    const [comment, setComment] = useState("");
    const [counts, setCounts] = useState<{ [key: string]: number }>({});
    const [typeFilter, setTypeFilter] = useState<string>(""); // Filter theo loại đơn (RESIGNATION, etc.)
    const accessToken = localStorage.getItem("accessToken");

    const { notifications } = useNotification();
    const lastNotificationIdRef = useRef<number | null>(null);

    useEffect(() => {
        // Kiểm tra filter để fetch theo trạng thái phù hợp
        if (statusFilter === "PENDING" || statusFilter === "PENDING_ADMIN") {
            fetchPendingRequests();
        } else {
            fetchLeaveRequests();
        }
        fetchCounts();
    }, [page, statusFilter]);

    // Lắng nghe notifications để refresh danh sách khi có thông báo mới
    useEffect(() => {
        if (!notifications || notifications.length === 0) return;
        if (!accessToken) return;

        const latestNotification = notifications[0];
        if (!latestNotification || latestNotification.notificationId === lastNotificationIdRef.current) {
            return;
        }

        // Nếu có thông báo về đơn nghỉ mới thì làm mới danh sách
        if (
            latestNotification.type === "LEAVE_REQUEST_CREATED" &&
            latestNotification.relatedEntityType === "LEAVE_REQUEST"
        ) {
            lastNotificationIdRef.current = latestNotification.notificationId;

            fetchLeaveRequests();
            fetchCounts();
            // Nếu tab đang là chờ admin duyệt hoặc tất cả thì reload cả đơn pending
            if (statusFilter === "PENDING_ADMIN" || statusFilter === "") {
                fetchPendingRequests();
            }
        }
    }, [notifications]);

    // Lấy danh sách đơn xin nghỉ (theo filter)
    const fetchLeaveRequests = async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            const params: any = { page, size: 10 };
            if (statusFilter) params.status = statusFilter;

            const response = await axios.get<PageResponse>(
                `${apiBase}/api/hr/leave-requests`,
                {
                    params,
                    headers: { Authorization: `Bearer ${accessToken}` },
                }
            );
            setLeaveRequests(response.data.content || []);
            setTotalPages(response.data.totalPages || 0);
        } catch (error: any) {
            toast.error(
                error?.response?.data?.message ||
                t("leaveRequest.messages.loadFailed", "Không thể tải danh sách đơn xin nghỉ")
            );
        } finally {
            setLoading(false);
        }
    };

    // Lấy các đơn đang chờ duyệt (ADMIN hoặc HR)
    const fetchPendingRequests = async () => {
        if (!accessToken) return;
        setLoading(true);
        try {
            // Endpoint riêng cho từng loại trạng thái pending
            const endpoint = statusFilter === "PENDING_ADMIN"
                ? `${apiBase}/api/hr/leave-requests/pending-admin`
                : `${apiBase}/api/hr/leave-requests/pending`;

            const response = await axios.get<LeaveRequest[]>(
                endpoint,
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                }
            );
            setLeaveRequests(response.data || []);
            setTotalPages(0);
        } catch (error: any) {
            toast.error(
                error?.response?.data?.message ||
                t("leaveRequest.messages.loadFailed", "Không thể tải danh sách đơn xin nghỉ")
            );
        } finally {
            setLoading(false);
        }
    };

    // Lấy số lượng đơn trên từng trạng thái
    const fetchCounts = async () => {
        if (!accessToken) return;
        try {
            const response = await axios.get<{ [key: string]: number }>(
                `${apiBase}/api/hr/leave-requests/counts`,
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                }
            );
            setCounts(response.data);
        } catch (error) {
            console.error("Failed to fetch counts", error);
        }
    };

    // Xử lý duyệt hoặc từ chối đơn
    const handleProcess = async (action: "APPROVE" | "REJECT") => {
        if (!selectedRequest || !accessToken) return;

        try {
            await axios.put(
                `${apiBase}/api/hr/leave-requests/process`,
                {
                    leaveRequestId: selectedRequest.id,
                    action,
                    comment: comment || undefined,
                },
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                }
            );
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
        } catch (error: any) {
            toast.error(
                error?.response?.data?.message ||
                t("leaveRequest.messages.processFailed", "Không thể xử lý đơn")
            );
        }
    };

    // Admin chỉ xác nhận đơn nghỉ việc, HR sẽ thực hiện xóa vĩnh viễn
    // Icon trạng thái đơn nghỉ
    const getStatusIcon = (status: string) => {
        switch (status.toUpperCase()) {
            case "APPROVED":
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case "REJECTED":
                return <XCircle className="w-5 h-5 text-red-600" />;
            case "PENDING":
                return <Clock className="w-5 h-5 text-yellow-600" />;
            case "PENDING_ADMIN":
                return <Clock className="w-5 h-5 text-purple-600" />;
            default:
                return null;
        }
    };



    // Nhãn loại ca làm việc
    const getShiftTypeLabel = (shiftType?: string) => {
        if (!shiftType || shiftType === "FULL_DAY") {
            return t("leaveRequest.shiftTypes.fullDay", "Cả ngày");
        }
        switch (shiftType.toUpperCase()) {
            case "MORNING":
                return t("leaveRequest.shiftTypes.morning", "Ca sáng");
            case "AFTERNOON":
                return t("leaveRequest.shiftTypes.afternoon", "Ca chiều");
            default:
                return shiftType;
        }
    };

    // Định dạng ngày/tháng/năm
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
    };

    // Lọc theo từ khoá tìm kiếm và loại đơn
    const filteredRequests = leaveRequests.filter((req) => {
        // Lọc theo loại đơn (nếu có)
        if (typeFilter && req.type.toUpperCase() !== typeFilter.toUpperCase()) {
            return false;
        }
        // Lọc theo từ khoá tìm kiếm
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
            req.userFullName?.toLowerCase().includes(searchLower) ||
            req.userName.toLowerCase().includes(searchLower) ||
            req.clinicName?.toLowerCase().includes(searchLower) ||
            req.reason.toLowerCase().includes(searchLower)
        );
    });

    // Hiển thị loading nếu chưa có dữ liệu và đang tải
    if (loading && leaveRequests.length === 0) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <ToastContainer position="top-right" autoClose={3000} />

            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">{t("leaveRequest.adminTitle", "Admin Leave Approval")}</h1>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder={t("leaveRequest.searchPlaceholder", "Tìm kiếm...")}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        {/* Bộ lọc trạng thái */}
                        <button
                            onClick={() => {
                                setStatusFilter("");
                                fetchLeaveRequests();
                            }}
                            className={`px-4 py-2 rounded-lg transition ${statusFilter === ""
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                        >
                            {t("common.all", "Tất cả")}
                        </button>
                        <button
                            onClick={() => {
                                setStatusFilter("PENDING_ADMIN");

                            }}
                            className={`px-4 py-2 rounded-lg transition ${statusFilter === "PENDING_ADMIN"
                                ? "bg-purple-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                        >
                            {t("leaveRequest.status.pendingAdmin", "Chờ Admin duyệt")}
                            {counts["PENDING_ADMIN"] > 0 && (
                                <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                    {counts["PENDING_ADMIN"]}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => {
                                setStatusFilter("APPROVED");
                                fetchLeaveRequests();
                            }}
                            className={`px-4 py-2 rounded-lg transition ${statusFilter === "APPROVED"
                                ? "bg-green-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                        >
                            {t("leaveRequest.status.approved", "Đã duyệt")}
                        </button>
                        <button
                            onClick={() => {
                                setStatusFilter("REJECTED");
                                fetchLeaveRequests();
                            }}
                            className={`px-4 py-2 rounded-lg transition ${statusFilter === "REJECTED"
                                ? "bg-red-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                        >
                            {t("leaveRequest.status.rejected", "Đã từ chối")}
                        </button>
                    </div>
                </div>
                {/* Filter riêng cho đơn nghỉ việc đã duyệt */}
                {statusFilter === "APPROVED" && (
                    <div className="mt-4 flex gap-2">
                        <button
                            onClick={() => setTypeFilter("")}
                            className={`px-4 py-2 rounded-lg transition text-sm ${typeFilter === ""
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                        >
                            {t("leaveRequest.allApproved", "Tất cả đơn đã duyệt")}
                        </button>
                        <button
                            onClick={() => setTypeFilter("RESIGNATION")}
                            className={`px-4 py-2 rounded-lg transition text-sm flex items-center gap-2 ${typeFilter === "RESIGNATION"
                                ? "bg-red-600 text-white font-semibold"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                        >
                            <Trash2 className="w-4 h-4" />
                            {t("leaveRequest.resignation.filter", "Đơn nghỉ việc (có thể xóa)")}
                            {leaveRequests.filter(r => r.type === "RESIGNATION" && r.status === "APPROVED").length > 0 && (
                                <span className="ml-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                    {leaveRequests.filter(r => r.type === "RESIGNATION" && r.status === "APPROVED").length}
                                </span>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {filteredRequests.length === 0 ? (
                // Không có đơn xin nghỉ nào
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="text-center py-12">
                        <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">
                            {typeFilter === "RESIGNATION"
                                ? t("leaveRequest.resignation.noApproved", "Chưa có đơn nghỉ việc nào đã được duyệt")
                                : t("leaveRequest.messages.noRequests", "Chưa có đơn xin nghỉ nào")
                            }
                        </p>
                        {statusFilter === "APPROVED" && typeFilter !== "RESIGNATION" && (
                            <p className="text-sm text-gray-400 mt-2">
                                {t("leaveRequest.resignation.tip", "Tip: Chọn tab 'Đơn nghỉ việc' để xem các đơn nghỉ việc đã được duyệt và có thể xóa vĩnh viễn")}
                            </p>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Hiển thị từng đơn nghỉ */}
                    {filteredRequests.map((request) => (
                        <div
                            key={request.id}
                            className={`rounded-lg border p-6 relative overflow-hidden transition-all duration-200 ${request.type === "RESIGNATION"
                                ? "bg-white border-red-200 shadow-sm hover:shadow-md"
                                : "bg-white border-gray-200 shadow-sm hover:shadow-md"
                                }`}
                        >
                            {/* Banner đơn giản cho đơn nghỉ việc */}
                            {request.type === "RESIGNATION" && (
                                <div className="flex items-center gap-2 mb-4 text-red-600">
                                    <Trash2 className="w-4 h-4" />
                                    <span className="text-sm font-semibold uppercase tracking-wide">{t("leaveRequest.resignation.title", "Đơn nghỉ việc")}</span>
                                    <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-100">
                                        {t("leaveRequest.resignation.important", "Quan trọng")}
                                    </span>
                                </div>
                            )}

                            <div className="">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                    {/* Thông tin nhân viên và loại ca */}
                                    <div>
                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{t("leaveRequest.employee", "Nhân viên")}</p>
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5">{getStatusIcon(request.status)}</div>
                                            <div>
                                                <p className="text-base font-semibold text-gray-900 leading-tight">
                                                    {request.userFullName || request.userName}
                                                </p>
                                                {request.userRole && (
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {request.userRole}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-50 text-gray-600 border border-gray-100">
                                                {request.clinicName}
                                            </span>
                                            {request.shiftType && request.shiftType !== "FULL_DAY" && (
                                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-50 text-gray-600 border border-gray-100">
                                                    {getShiftTypeLabel(request.shiftType)}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Thời gian nghỉ */}
                                    <div>
                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{t("leaveRequest.time", "Thời gian")}</p>
                                        <p className="text-base font-medium text-gray-900">
                                            {formatDate(request.startDate)} - {formatDate(request.endDate)}
                                        </p>
                                    </div>

                                    {/* Trạng thái */}
                                    <div>
                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{t("leaveRequest.status.pending", "Trạng thái")}</p>
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${request.status === "APPROVED" ? "bg-green-50 text-green-700 border-green-100" :
                                                request.status === "REJECTED" ? "bg-red-50 text-red-700 border-red-100" :
                                                    request.status === "PENDING" ? "bg-yellow-50 text-yellow-700 border-yellow-100" :
                                                        "bg-purple-50 text-purple-700 border-purple-100"
                                                }`}
                                        >
                                            {request.status === "PENDING" && t("leaveRequest.status.pending", "Chờ duyệt (HR)")}
                                            {request.status === "PENDING_ADMIN" && t("leaveRequest.status.pendingAdmin", "Chờ duyệt (Admin)")}
                                            {request.status === "APPROVED" && t("leaveRequest.status.approved", "Đã duyệt")}
                                            {request.status === "REJECTED" && t("leaveRequest.status.rejected", "Đã từ chối")}
                                        </span>
                                    </div>

                                    {/* Số ngày nghỉ còn lại trong tháng */}
                                    {request.leaveBalance !== undefined && (
                                        <div>
                                            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{t("leaveRequest.monthlyLeave", "Ngày nghỉ tháng này")}</p>
                                            <span className={`font-medium text-sm ${(request.leaveBalance || 0) <= 0 ? "text-red-600" : "text-gray-900"}`}>
                                                {request.leaveBalance ?? 0} ngày
                                            </span>
                                        </div>
                                    )}

                                    {/* Người thay thế */}
                                    <div className="col-span-1 md:col-span-2">
                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{t("leaveRequest.replacement", "Người thay thế")}</p>
                                        {request.replacementAvailable ? (
                                            <div className="flex flex-wrap gap-2">
                                                {request.potentialReplacements?.map((name, idx) => (
                                                    <span key={idx} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                                        {name}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-400 italic">
                                                {t("leaveRequest.none", "Không có")}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className={`pt-4 ${request.type === "RESIGNATION" ? "border-t border-red-100" : "border-t border-gray-100"}`}>
                                    {/* Cảnh báo đặc biệt cho đơn nghỉ việc - MINIMALIST */}
                                    {request.type === "RESIGNATION" && (
                                        <div className="mb-4">
                                            <div className="flex items-start gap-3 p-3 bg-red-50 rounded border border-red-100">
                                                <div className="mt-0.5 text-red-500">
                                                    <Trash2 className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-red-800 mb-1">{t("leaveRequest.resignation.processTitle", "Quy trình xóa vĩnh viễn")}</p>
                                                    <div className="flex items-center gap-4 text-xs text-gray-600">
                                                        <span className="flex items-center gap-1.5">
                                                            <span className="w-4 h-4 flex items-center justify-center rounded-full bg-red-100 text-red-700 font-bold text-[10px]">1</span>
                                                            {t("leaveRequest.resignation.step1", "HR duyệt")}
                                                        </span>
                                                        <span className="text-gray-300">→</span>
                                                        <span className="flex items-center gap-1.5">
                                                            <span className="w-4 h-4 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 font-bold text-[10px]">2</span>
                                                            {t("leaveRequest.resignation.step2", "Admin xác nhận")}
                                                        </span>
                                                        <span className="text-gray-300">→</span>
                                                        <span className="flex items-center gap-1.5">
                                                            <span className="w-4 h-4 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 font-bold text-[10px]">3</span>
                                                            {t("leaveRequest.resignation.step3", "Xóa dữ liệu")}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {/* Lý do nghỉ */}
                                    <p className="text-sm">
                                        <span className="font-medium text-gray-700">
                                            {t("leaveRequest.reason", "Lý do")}:
                                        </span>{" "}
                                        <span className="text-gray-600">{request.reason}</span>
                                    </p>
                                    {/* Tên người duyệt */}
                                    {request.approvedByName && (
                                        <p className="text-sm">
                                            <span className="font-medium text-gray-700">
                                                {t("leaveRequest.approvedBy", "Duyệt bởi")}:
                                            </span>{" "}
                                            <span className="text-gray-600">{request.approvedByName}</span>
                                        </p>
                                    )}
                                    <div className="flex justify-between items-center mt-4 pt-2 border-t">
                                        <p className="text-xs text-gray-500">
                                            {t("leaveRequest.createdAt", "Tạo lúc")}:{" "}
                                            {new Date(request.createdAt).toLocaleString("vi-VN")}
                                        </p>
                                        <div className="flex gap-2">
                                            {/* Nút duyệt/từ chối nếu trạng thái chờ duyệt */}
                                            {(request.status === "PENDING" || request.status === "PENDING_ADMIN") && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedRequest(request);
                                                            setComment("");
                                                        }}
                                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                                                    >
                                                        {t("leaveRequest.approve", "Duyệt")}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedRequest(request);
                                                            setComment("");
                                                        }}
                                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                                                    >
                                                        {t("leaveRequest.reject", "Từ chối")}
                                                    </button>
                                                </>
                                            )}
                                            {/* Thông báo cho Admin: HR sẽ thực hiện xóa vĩnh viễn */}
                                            {request.status === "APPROVED" && request.type === "RESIGNATION" && (
                                                <div className="px-4 py-2 bg-blue-100 border-2 border-blue-400 rounded-lg text-sm">
                                                    <p className="text-blue-800 font-semibold flex items-center gap-2">
                                                        <span>ℹ️</span>
                                                        <span>{t("leaveRequest.resignation.adminConfirmed", "Đã xác nhận. HR sẽ thực hiện xóa vĩnh viễn trong trang Quản lý nhân viên.")}</span>
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
                <div className="flex justify-center gap-2 mt-6">
                    <button
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50"
                    >
                        {t("common.previous", "Trước")}
                    </button>
                    <span className="px-4 py-2">
                        {t("common.page", "Trang")} {page + 1} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50"
                    >
                        {t("common.next", "Sau")}
                    </button>
                </div>
            )}

            {/* Modal xử lý duyệt/từ chối đơn nghỉ */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold mb-4">
                            {t("leaveRequest.processTitle", "Xử lý đơn xin nghỉ")}
                        </h3>
                        <p className="mb-4">
                            {t("leaveRequest.processMessage", "Bạn có muốn")}{" "}
                            {selectedRequest.status === "PENDING" ? (
                                <>
                                    {t("leaveRequest.approve", "duyệt")} hoặc{" "}
                                    {t("leaveRequest.reject", "từ chối")} đơn này?
                                </>
                            ) : selectedRequest.status === "PENDING_ADMIN" ? (
                                <>
                                    {t("leaveRequest.approve", "duyệt")} hoặc{" "}
                                    {t("leaveRequest.reject", "từ chối")} đơn này (Admin)?
                                </>
                            ) : (
                                t("leaveRequest.process", "xử lý đơn này")
                            )}
                        </p>

                        {/* Thông tin phép còn lại và người thay thế */}
                        {(selectedRequest.status === "PENDING" || selectedRequest.status === "PENDING_ADMIN") && (
                            <div className="mb-4 text-sm bg-gray-50 p-3 rounded">
                                <p className="flex justify-between">
                                    <span>{t("leaveRequest.remainingLeave", "Phép còn lại")}:</span>
                                    <span className={(selectedRequest.leaveBalance || 0) <= 0 ? "text-red-600 font-bold" : "font-bold"}>
                                        {selectedRequest.leaveBalance} ngày
                                    </span>
                                </p>
                                <p className="mt-1">
                                    <span>{t("leaveRequest.replacement", "Người thay thế")}: </span>
                                    {selectedRequest.replacementAvailable ? (
                                        <span className="text-green-600 font-medium">{t("leaveRequest.available", "Có")} ({selectedRequest.potentialReplacements?.length})</span>
                                    ) : (
                                        <span className="text-red-600 font-bold">{t("leaveRequest.none", "Không có")}</span>
                                    )}
                                </p>
                            </div>
                        )}

                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder={t("leaveRequest.commentPlaceholder", "Nhập ghi chú (tùy chọn)...")}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setSelectedRequest(null);
                                    setComment("");
                                }}
                                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                            >
                                {t("common.cancel", "Hủy")}
                            </button>
                            <button
                                onClick={() => handleProcess("APPROVE")}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                {t("leaveRequest.approve", "Duyệt")}
                            </button>
                            <button
                                onClick={() => handleProcess("REJECT")}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                {t("leaveRequest.reject", "Từ chối")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

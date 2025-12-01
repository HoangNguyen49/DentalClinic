import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { useTranslation } from "react-i18next";
import { CheckCircle, XCircle, Clock, Search } from "lucide-react";
import { useNotification } from "../../../app/providers/NotificationContext";

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";

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
  shiftType?: string; // MORNING, AFTERNOON, FULL_DAY (only for doctors)
  approvedBy?: number;
  approvedByName?: string;
  createdAt: string;
  updatedAt: string;
};

type PageResponse = {
  content: LeaveRequest[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
};

export default function LeaveRequestManagement() {
  const { t } = useTranslation();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [comment, setComment] = useState("");
  const accessToken = localStorage.getItem("accessToken");

  const { notifications } = useNotification();
  const lastNotificationIdRef = useRef<number | null>(null);

  useEffect(() => {
    fetchLeaveRequests();
  }, [page, statusFilter]);

  // Effect lắng nghe notifications để tự động refresh danh sách đơn xin nghỉ
  useEffect(() => {
    if (!notifications || notifications.length === 0) return;
    if (!accessToken) return;

    const latestNotification = notifications[0];
    if (!latestNotification || latestNotification.notificationId === lastNotificationIdRef.current) {
      return;
    }

    // Nếu có thông báo về đơn xin nghỉ mới
    if (
      latestNotification.type === "LEAVE_REQUEST_CREATED" &&
      latestNotification.relatedEntityType === "LEAVE_REQUEST"
    ) {
      lastNotificationIdRef.current = latestNotification.notificationId;

      // Refresh dữ liệu ngay lập tức
      fetchLeaveRequests();
      // Nếu đang ở tab chờ duyệt thì refresh cả pending
      if (statusFilter === "PENDING" || statusFilter === "") {
        fetchPendingRequests();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]);

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

  const fetchPendingRequests = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const response = await axios.get<LeaveRequest[]>(
        `${apiBase}/api/hr/leave-requests/pending`,
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
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
        t("leaveRequest.messages.processFailed", "Không thể xử lý đơn")
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case "APPROVED":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "REJECTED":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "PENDING":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type.toUpperCase()) {
      case "VACATION":
        return t("leaveRequest.types.vacation", "Nghỉ phép");
      case "SICK":
        return t("leaveRequest.types.sick", "Nghỉ ốm");
      case "PERSONAL":
        return t("leaveRequest.types.personal", "Nghỉ cá nhân");
      case "OTHER":
        return t("leaveRequest.types.other", "Khác");
      default:
        return type;
    }
  };

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

  const getStatusLabel = (status: string) => {
    switch (status.toUpperCase()) {
      case "APPROVED":
        return t("leaveRequest.status.approved", "Đã duyệt");
      case "REJECTED":
        return t("leaveRequest.status.rejected", "Đã từ chối");
      case "PENDING":
        return t("leaveRequest.status.pending", "Chờ duyệt");
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const filteredRequests = leaveRequests.filter((req) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      req.userFullName?.toLowerCase().includes(searchLower) ||
      req.userName.toLowerCase().includes(searchLower) ||
      req.clinicName?.toLowerCase().includes(searchLower) ||
      req.reason.toLowerCase().includes(searchLower)
    );
  });

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
        <h1 className="text-2xl font-bold text-gray-900">{t("leaveRequest.management.title", "Quản lý đơn xin nghỉ")}</h1>
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
                setStatusFilter("PENDING");
                fetchPendingRequests();
              }}
              className={`px-4 py-2 rounded-lg transition ${statusFilter === "PENDING"
                ? "bg-yellow-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              {t("leaveRequest.status.pending", "Chờ duyệt")}
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
      </div>

      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {t("leaveRequest.messages.noRequests", "Chưa có đơn xin nghỉ nào")}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Nhân viên</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(request.status)}
                    <p className="text-lg font-semibold">
                      {request.userFullName || request.userName}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {getTypeLabel(request.type)} • {request.clinicName}
                    {request.shiftType && request.shiftType !== "FULL_DAY" && (
                      <> • <span className="font-medium">{getShiftTypeLabel(request.shiftType)}</span></>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Thời gian</p>
                  <p className="text-lg font-semibold mt-1">
                    {formatDate(request.startDate)} - {formatDate(request.endDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t("leaveRequest.status.pending", "Trạng thái")}</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mt-1 ${getStatusColor(
                      request.status
                    )}`}
                  >
                    {getStatusLabel(request.status)}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t space-y-2">
                <p className="text-sm">
                  <span className="font-medium text-gray-700">
                    {t("leaveRequest.reason", "Lý do")}:
                  </span>{" "}
                  <span className="text-gray-600">{request.reason}</span>
                </p>
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
                  {request.status === "PENDING" && (
                    <div className="flex gap-2">
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
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
              ) : (
                t("leaveRequest.process", "xử lý đơn này")
              )}
            </p>
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


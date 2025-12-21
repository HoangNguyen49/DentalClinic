import { useState, useEffect, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import { useTranslation } from "react-i18next";
import { Search, Trash2, Calendar, User, MapPin, AlertCircle, CheckCircle, XCircle, Clock } from "lucide-react";
import { useNotification } from "../../../app/providers/NotificationContext";
import { hrApi } from "../../../services/hr/hrApi";
import type { HrLeaveRequest } from "../../../services/hr/hrApi";
import { useHrApi } from "../../../hooks/useHrApi";
import { getStatusIcon, getStatusColor, getStatusLabel } from "../../../utils/statusUtils";
import { getShiftTypeLabel } from "../../../utils/shiftUtils";
import { formatDate } from "../../../utils/dateUtils";

export default function LeaveRequestManagement() {
  const { t } = useTranslation("web");
  const { execute: executeApi, loading } = useHrApi<any>();
  const [leaveRequests, setLeaveRequests] = useState<HrLeaveRequest[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<HrLeaveRequest | null>(null);
  const [comment, setComment] = useState("");
  const [counts, setCounts] = useState<{ [key: string]: number }>({});

  const { notifications } = useNotification();
  const lastNotificationIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Khi đổi trang hoặc đổi trạng thái filter thì load lại dữ liệu
    if (statusFilter === "PENDING" || statusFilter === "PENDING_ADMIN") {
      fetchPendingRequests();
    } else {
      fetchLeaveRequests();
    }
    fetchCounts();
  }, [page, statusFilter]);

  useEffect(() => {
    // Refresh khi có notification mới liên quan đến đơn nghỉ
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
      if (statusFilter === "PENDING" || statusFilter === "") {
        fetchPendingRequests();
      }
    }
  }, [notifications]);

  // Lấy tất cả đơn nghỉ (có phân trang và filter trạng thái)
  const fetchLeaveRequests = async () => {
    const response = await executeApi(
      () => hrApi.leaveRequests.getAll({ page, size: 10, status: statusFilter }),
      {
        errorMessage: t("leaveRequest.messages.loadFailed"),
        showErrorToast: false,
      }
    ) as { content: HrLeaveRequest[]; totalPages: number } | null;

    if (response) {
      setLeaveRequests(response.content || []);
      setTotalPages(response.totalPages || 0);
    }
  };

  // Lấy đơn chờ duyệt (HR hoặc Admin) tuỳ filter
  const fetchPendingRequests = async () => {
    const apiCall = statusFilter === "PENDING_ADMIN"
      ? hrApi.leaveRequests.getPendingAdmin
      : hrApi.leaveRequests.getPending;

    const response = await executeApi(apiCall, {
      errorMessage: t("leaveRequest.messages.loadFailed"),
      showErrorToast: false,
    }) as HrLeaveRequest[] | null;

    if (response) {
      setLeaveRequests(response || []);
      setTotalPages(0);
    }
  };

  // Đếm số lượng đơn theo từng trạng thái (để làm badge trên nút lọc)
  const fetchCounts = async () => {
    await executeApi(hrApi.leaveRequests.getCounts, {
      onSuccess: (data: any) => {
        setCounts((data as { [key: string]: number }) || {});
      },
      showErrorToast: false,
    });
  };

  // Xử lý duyệt hoặc từ chối đơn (APPROVE hoặc REJECT)
  const handleProcess = async (action: "APPROVE" | "REJECT", request?: HrLeaveRequest) => {
    const targetRequest = request || selectedRequest;
    if (!targetRequest) return;

    await executeApi(
      () => hrApi.leaveRequests.process(targetRequest.id, action, comment || undefined),
      {
        onSuccess: () => {
          toast.success(
            action === "APPROVE"
              ? t("leaveRequest.messages.confirmSuccess")
              : t("leaveRequest.messages.rejectSuccess")
          );
          setSelectedRequest(null);
          setComment("");
          fetchLeaveRequests();
          fetchCounts();
        },
        errorMessage: t("leaveRequest.messages.processFailed"),
      }
    );
  };



  // Helper functions moved to utils - no duplicate code needed here!

  // Lọc theo từ khoá tìm kiếm
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
    // Loading spinner nếu đang tải và chưa có dữ liệu
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 p-8 space-y-8">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Header Section */}
      <section className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg ring-4 ring-purple-100">
          <Calendar className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-900 to-pink-700 bg-clip-text text-transparent">
            {t("leaveRequest.management.title", "Leave Request Management")}
          </h1>
          <p className="text-sm text-gray-600 font-medium mt-1">
            {t("leaveRequest.management.subtitle", "Review and process employee leave requests")}
          </p>
        </div>
      </section>

      {/* Search & Filter Section */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/60 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
            <input
              type="text"
              placeholder={t("leaveRequest.searchPlaceholder", "Search by name, clinic, or reason...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all text-base bg-gradient-to-br from-white to-slate-50"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            {/* Các nút filter trạng thái */}
            <button
              onClick={() => {
                setStatusFilter("");
                fetchLeaveRequests();
              }}
              className={`px-5 py-3 rounded-xl font-bold text-sm transition-all ${
                statusFilter === ""
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200/50"
                  : "bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200"
              }`}
            >
              {t("common.all", "All")}
            </button>
            <button
              onClick={() => {
                setStatusFilter("PENDING");
                fetchPendingRequests();
              }}
              className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                statusFilter === "PENDING"
                  ? "bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-lg shadow-yellow-200/50"
                  : "bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200"
              }`}
            >
              <Clock className="w-4 h-4" />
              {t("leaveRequest.status.pending", "Pending")}
              {counts["PENDING"] > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
                  {counts["PENDING"]}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setStatusFilter("PENDING_ADMIN");
              }}
              className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                statusFilter === "PENDING_ADMIN"
                  ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-200/50"
                  : "bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200"
              }`}
            >
              <Clock className="w-4 h-4" />
              {t("leaveRequest.status.pendingAdmin", "Pending Admin")}
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
              className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                statusFilter === "APPROVED"
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-200/50"
                  : "bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200"
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
              className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                statusFilter === "REJECTED"
                  ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-200/50"
                  : "bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200"
              }`}
            >
              <XCircle className="w-4 h-4" />
              {t("leaveRequest.status.rejected", "Rejected")}
            </button>
          </div>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        // Nếu không có đơn nào hiển thị thông báo
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/60 p-12">
          <div className="text-center">
            <div className="inline-flex p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl mb-6">
              <Clock className="w-16 h-16 text-purple-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {t("leaveRequest.messages.noRequests", "No Leave Requests")}
            </h3>
            <p className="text-slate-600">
              {t("leaveRequest.messages.noRequestsDesc", "No leave requests found matching your criteria")}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Hiển thị danh sách đơn xin nghỉ */}
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border hover:shadow-2xl transition-all duration-300 overflow-hidden ${
                request.type === "RESIGNATION"
                  ? "border-red-300 ring-2 ring-red-100"
                  : "border-slate-200/60"
              }`}
            >
              {/* Banner đặc biệt cho đơn nghỉ việc */}
              {request.type === "RESIGNATION" && (
                <div className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-3">
                  <div className="flex items-center gap-2 text-white">
                    <Trash2 className="w-5 h-5" />
                    <span className="text-sm font-bold uppercase tracking-wider">
                      {t("leaveRequest.resignation.title", "Resignation Request")}
                    </span>
                    <span className="ml-auto px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold">
                      {t("leaveRequest.resignation.important", "Important")}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {/* Employee Info */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border-2 border-blue-200 shadow-sm">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">
                      {t("leaveRequest.employee", "Employee")}
                    </p>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 bg-white rounded-lg shadow-md">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-bold text-slate-900 leading-tight">
                          {request.userFullName || request.userName}
                        </p>
                        {request.userRole && (
                          <p className="text-xs text-slate-600 mt-0.5 font-medium">
                            {request.userRole}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-blue-200">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                        <MapPin className="w-3.5 h-3.5" />
                        {request.clinicName}
                      </span>
                      {request.shiftType && request.shiftType !== "FULL_DAY" && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                          {getShiftTypeLabel(request.shiftType, t)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-xl border-2 border-purple-200 shadow-sm">
                    <p className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-2">
                      {t("leaveRequest.time", "Duration")}
                    </p>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white rounded-lg shadow-md">
                        <Calendar className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-bold text-slate-900 leading-tight">
                          {formatDate(request.startDate)}
                        </p>
                        <p className="text-base font-bold text-slate-900">
                          {formatDate(request.endDate)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div
                    className={`p-5 rounded-xl border-2 shadow-sm ${
                      request.status === "APPROVED"
                        ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
                        : request.status === "REJECTED"
                        ? "bg-gradient-to-br from-red-50 to-rose-50 border-red-200"
                        : request.status === "PENDING_ADMIN"
                        ? "bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200"
                        : "bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200"
                    }`}
                  >
                    <p
                      className={`text-xs font-bold uppercase tracking-wider mb-3 ${
                        request.status === "APPROVED"
                          ? "text-green-700"
                          : request.status === "REJECTED"
                          ? "text-red-700"
                          : request.status === "PENDING_ADMIN"
                          ? "text-purple-700"
                          : "text-yellow-700"
                      }`}
                    >
                      {t("leaveRequest.status.label", "Status")}
                    </p>
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-bold shadow-md bg-gradient-to-r ${getStatusColor(request.status)} text-white`}
                    >
                      {getStatusIcon(request.status)}
                      {getStatusLabel(request.status, t)}
                    </span>
                  </div>

                  {/* Leave Balance & Replacements */}
                  {request.leaveBalance !== undefined && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border-2 border-blue-200">
                      <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {t("leaveRequest.monthlyLeave", "Days off this month")}
                      </p>
                      <div className="text-blue-900 mb-3">
                        <span className="text-2xl font-bold">
                          {request.leaveBalance ?? 0}
                        </span>
                        <span className="text-sm font-medium ml-1">{t("leaveRequest.days", "days")}</span>
                      </div>
                      
                      {/* Annual Leave */}
                      {request.annualLeaveTotal !== undefined && (
                        <div className="border-t border-blue-200 pt-3 mt-3">
                          <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">
                            {t("leaveRequest.annualLeave", "Annual Leave")}
                          </p>
                          <div className="text-blue-900">
                            <div className="text-lg font-bold">
                              {request.annualLeaveUsed ?? 0}/{request.annualLeaveTotal ?? 12} {t("leaveRequest.days", "days")}
                            </div>
                            <div className={`text-sm font-medium ${(request.annualLeaveRemaining ?? 0) <= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                              {t("leaveRequest.remaining", "Remaining")}: {request.annualLeaveRemaining ?? request.annualLeaveTotal ?? 12} {t("leaveRequest.days", "days")}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Người thay thế */}
                  <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-teal-50 to-cyan-50 p-4 rounded-xl border-2 border-teal-200">
                    <p className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-2">
                      {t("leaveRequest.replacement", "Replacement")}
                    </p>
                    {request.replacementAvailable ? (
                      <div className="flex flex-wrap gap-2">
                        {request.potentialReplacements?.map((name, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-teal-100 text-teal-700 border border-teal-300">
                            <User className="w-3.5 h-3.5" />
                            {name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-teal-600 font-medium italic">
                        {t("leaveRequest.none", "No replacement")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Additional Info Section */}
                <div className="space-y-4 pt-6 border-t-2 border-slate-200">
                  {/* Resignation Warning */}
                  {request.type === "RESIGNATION" && (
                    <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-xl">
                      <div className="flex items-start gap-3 mb-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-bold text-red-800 mb-1">
                            {t("leaveRequest.resignation.processTitle", "Permanent deletion process")}
                          </p>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="flex items-center gap-1.5">
                              <span className="w-5 h-5 flex items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-[10px]">1</span>
                              <span className="font-bold text-red-700">{t("leaveRequest.resignation.step1", "HR Approved")}</span>
                            </span>
                            <span className="text-red-300">→</span>
                            <span className="flex items-center gap-1.5">
                              <span className="w-5 h-5 flex items-center justify-center rounded-full bg-white border-2 border-red-200 text-red-500 font-bold text-[10px]">2</span>
                              <span className="text-slate-600">{t("leaveRequest.resignation.step2", "Admin Confirm")}</span>
                            </span>
                            <span className="text-red-300">→</span>
                            <span className="flex items-center gap-1.5">
                              <span className="w-5 h-5 flex items-center justify-center rounded-full bg-white border-2 border-red-200 text-red-500 font-bold text-[10px]">3</span>
                              <span className="text-slate-600">{t("leaveRequest.resignation.step3", "Data Deletion")}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reason */}
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-slate-700 min-w-[100px]">
                      {t("leaveRequest.reason", "Reason")}:
                    </span>
                    <span className="text-slate-600">{request.reason}</span>
                  </div>

                  {/* Approved By */}
                  {request.approvedByName && (
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-slate-700 min-w-[100px]">
                        {t("leaveRequest.approvedBy", "Approved By")}:
                      </span>
                      <span className="text-slate-600 font-medium">{request.approvedByName}</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-6 pt-6 border-t-2 border-slate-200">
                  <p className="text-sm text-slate-500 font-medium">
                    {t("leaveRequest.createdAt", "Created")}: {new Date(request.createdAt).toLocaleString("vi-VN")}
                  </p>
                  {/* Nút duyệt/từ chối CHỈ cho PENDING (HR có quyền xử lý) */}
                  {request.status === "PENDING" && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleProcess("APPROVE", request)}
                        disabled={loading}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-xl transition-all font-bold text-sm shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {t("leaveRequest.confirm", "Confirm")}
                      </button>
                      <button
                        onClick={() => handleProcess("REJECT", request)}
                        disabled={loading}
                        className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-xl transition-all font-bold text-sm shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <XCircle className="w-4 h-4" />
                        {t("leaveRequest.reject", "Reject")}
                      </button>
                    </div>
                  )}
                  {/* Hiển thị thông báo cho PENDING_ADMIN (chỉ Admin mới xử lý được) */}
                  {request.status === "PENDING_ADMIN" && (
                    <div className="px-6 py-3 bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300 rounded-xl">
                      <p className="text-sm font-bold text-purple-800 text-center flex items-center justify-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {t("leaveRequest.messages.adminApprovalRequired", "This request requires Admin approval")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Phân trang nếu có nhiều trang */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/60 px-6 py-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-5 py-2.5 border-2 border-slate-300 rounded-xl text-base font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {t("common.previous", "Previous")}
          </button>
          <span className="text-base text-slate-700 font-bold">
            {t("common.page", "Page")} <span className="text-purple-600">{page + 1}</span> / {totalPages || 1}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-5 py-2.5 border-2 border-slate-300 rounded-xl text-base font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {t("common.next", "Next")}
          </button>
        </div>
      )}

      {selectedRequest && (
        // Modal xác nhận duyệt/từ chối đơn
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200/60">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-t-2xl px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">
                  {t("leaveRequest.processTitle", "Process Leave Request")}
                </h3>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <p className="text-slate-700 font-medium">
                {t("leaveRequest.processMessage", "Do you want to")}{" "}
                {selectedRequest.status === "PENDING" ? (
                  <>
                    {t("leaveRequest.confirm", "confirm")} hoặc{" "}
                    {t("leaveRequest.reject", "reject")} đơn này?
                  </>
                ) : selectedRequest.status === "PENDING_ADMIN" ? (
                  <>
                    {t("leaveRequest.approve", "approve")} hoặc{" "}
                    {t("leaveRequest.reject", "reject")} đơn này (Admin)?
                  </>
                ) : (
                  t("leaveRequest.process", "process this request")
                )}
              </p>

              {/* Quick Info Cards */}
              {(selectedRequest.status === "PENDING" || selectedRequest.status === "PENDING_ADMIN") && (
                <div className="grid grid-cols-2 gap-4">
                  {/* Leave Balance Card */}
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {t("leaveRequest.monthlyLeave", "Days off this month")}
                    </p>
                    <div className="text-blue-900 mb-3">
                      <span className="text-2xl font-bold">{selectedRequest.leaveBalance ?? 0}</span>
                      <span className="text-sm font-medium ml-1">{t("leaveRequest.days", "days")}</span>
                    </div>
                    
                    {/* Annual Leave */}
                    {(selectedRequest.annualLeaveTotal !== undefined) && (
                      <>
                        <div className="border-t border-blue-200 pt-3 mt-3">
                          <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">
                            {t("leaveRequest.annualLeave", "Annual Leave")}
                          </p>
                          <div className="text-blue-900">
                            <div className="text-lg font-bold">
                              {selectedRequest.annualLeaveUsed ?? 0}/{selectedRequest.annualLeaveTotal ?? 12} {t("leaveRequest.days", "days")}
                            </div>
                            <div className={`text-sm font-medium ${(selectedRequest.annualLeaveRemaining ?? 0) <= 0 ? 'text-red-600' : 'text-blue-600'}`}>
                              {t("leaveRequest.remaining", "Remaining")}: {selectedRequest.annualLeaveRemaining ?? selectedRequest.annualLeaveTotal ?? 12} {t("leaveRequest.days", "days")}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Replacement Card */}
                  <div className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl border-2 border-teal-200">
                    <p className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-1">
                      {t("leaveRequest.replacement", "Replacement")}
                    </p>
                    {selectedRequest.replacementAvailable ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-bold text-green-700">
                          {t("leaveRequest.available", "Available")} ({selectedRequest.potentialReplacements?.length})
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span className="text-sm font-bold text-red-700">
                          {t("leaveRequest.none", "None")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Comment Textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  {t("leaveRequest.commentPlaceholder", "Comment (Optional)")}
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t("leaveRequest.commentPlaceholder", "Add your comment here...")}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all text-base resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setComment("");
                  }}
                  className="flex-1 px-5 py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-bold text-base"
                >
                  {t("common.cancel", "Cancel")}
                </button>
                <button
                  onClick={() => handleProcess("APPROVE")}
                  disabled={loading}
                  className="flex-1 px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-xl transition-all font-bold text-base shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-5 h-5" />
                  {t("leaveRequest.confirm", "Confirm")}
                </button>
                <button
                  onClick={() => handleProcess("REJECT")}
                  disabled={loading}
                  className="flex-1 px-5 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-xl transition-all font-bold text-base shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle className="w-5 h-5" />
                  {t("leaveRequest.reject", "Reject")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

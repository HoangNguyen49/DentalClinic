import { useState, useEffect, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import { useTranslation } from "react-i18next";
import { Plus, Calendar, XCircle } from "lucide-react";
import Header from "../../../widgets/Header/Header";
import Footer from "../../../widgets/Footer/Footer";
import CreateLeaveRequestForm from "./CreateLeaveRequestForm";
import { useNotification } from "../../../app/providers/NotificationContext";
import { hrApi } from "../../../services/hr/hrApi";
import type { HrLeaveRequest } from "../../../services/hr/hrApi";
import { useHrApi } from "../../../hooks/useHrApi";
import { getStatusIcon, getStatusLabel, getTypeLabel } from "../../../utils/statusUtils";
import { getShiftTypeLabel } from "../../../utils/shiftUtils";
import { formatDate } from "../../../utils/dateUtils";

export default function LeaveRequestList() {
  const { t } = useTranslation("web");
  const { execute: executeApi, loading } = useHrApi<any>();
  const [leaveRequests, setLeaveRequests] = useState<HrLeaveRequest[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Lấy danh sách notification để tự động cập nhật khi có đơn được duyệt/từ chối
  const { notifications } = useNotification();
  const lastNotificationIdRef = useRef<number | null>(null);

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  // Theo dõi notification, nếu có thay đổi liên quan đến đơn xin nghỉ sẽ refetch lại dữ liệu
  useEffect(() => {
    if (!notifications || notifications.length === 0) return;

    const latestNotification = notifications[0];
    if (!latestNotification || latestNotification.notificationId === lastNotificationIdRef.current) {
      return;
    }

    if (
      (latestNotification.type === "LEAVE_REQUEST_APPROVED" ||
        latestNotification.type === "LEAVE_REQUEST_REJECTED") &&
      latestNotification.relatedEntityType === "LEAVE_REQUEST"
    ) {
      lastNotificationIdRef.current = latestNotification.notificationId;
      fetchLeaveRequests();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications]);

  // Lấy danh sách đơn xin nghỉ của người dùng hiện tại
  const fetchLeaveRequests = async () => {
    const response = await executeApi(hrApi.leaveRequests.getMy, {
      errorMessage: t("leaveRequest.messages.loadFailed"),
      showErrorToast: false,
    }) as HrLeaveRequest[] | null;

    if (response) {
      setLeaveRequests(response || []);
    }
  };

  // Hủy đơn xin nghỉ (chỉ khi trạng thái là PENDING)
  const handleCancel = async (leaveRequestId: number) => {
    if (!window.confirm(t("leaveRequest.messages.confirmCancel"))) {
      return;
    }

    await executeApi(() => hrApi.leaveRequests.cancel(leaveRequestId), {
      onSuccess: () => {
        toast.success(t("leaveRequest.messages.cancelSuccess"));
        fetchLeaveRequests();
      },
      errorMessage: t("leaveRequest.messages.cancelFailed"),
    });
  };

  // All helper functions moved to shared utils!

  if (loading) {
    return (
      <>
        <Header />
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
          <ToastContainer position="top-right" autoClose={5000} />

          {/* Header Section */}
          <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg ring-4 ring-blue-100">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-indigo-700 bg-clip-text text-transparent">
                  {t("leaveRequest.title", "My Leave Requests")}
                </h1>
                <p className="text-sm text-gray-600 font-medium mt-1">
                  {t("leaveRequest.subtitle", "View and manage your leave requests")}
                </p>
              </div>
            </div>
            {/* Nút tạo đơn mới */}
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-xl transition-all font-bold text-base shadow-lg flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t("leaveRequest.createNew", "Create New Request")}
            </button>
          </section>

          {showCreateForm && (
            <CreateLeaveRequestForm
              onClose={() => {
                setShowCreateForm(false);
                fetchLeaveRequests();
              }}
            />
          )}

          {leaveRequests.length === 0 ? (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/60 p-12">
              <div className="text-center">
                <div className="inline-flex p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl mb-6">
                  <Calendar className="w-16 h-16 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {t("leaveRequest.messages.noRequests", "No Leave Requests")}
                </h3>
                <p className="text-slate-600">
                  {t("leaveRequest.messages.noRequestsDesc", "You haven't submitted any leave requests yet")}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Hiển thị danh sách các đơn xin nghỉ */}
              {leaveRequests.map((request) => (
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
                        <XCircle className="w-5 h-5" />
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
                      {/* Type cardcard*/}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border-2 border-blue-200 shadow-sm">
                        <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">
                          {t("leaveRequest.type", "Type")}
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg shadow-md">
                            {getStatusIcon(request.status)}
                          </div>
                          <p className="text-lg font-bold text-slate-900">
                            {getTypeLabel(request.type, t)}
                          </p>
                        </div>
                      </div>

                      {/* time card */}
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-xl border-2 border-purple-200 shadow-sm">
                        <p className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-2">
                          {t("leaveRequest.time", "Duration")}
                        </p>
                        <p className="text-base font-bold text-slate-900 leading-tight">
                          {formatDate(request.startDate)}
                        </p>
                        <p className="text-base font-bold text-slate-900">
                          {formatDate(request.endDate)}
                        </p>
                        {request.shiftType && request.shiftType !== "FULL_DAY" && (
                          <span className="inline-flex mt-2 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                            {getShiftTypeLabel(request.shiftType, t)}
                          </span>
                        )}
                      </div>

                      {/* Status card */}
                      <div
                        className={`p-5 rounded-xl border-2 shadow-sm ${
                          request.status === "APPROVED"
                            ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
                            : request.status === "REJECTED"
                            ? "bg-gradient-to-br from-red-50 to-rose-50 border-red-200"
                            : request.status === "PENDING_ADMIN"
                            ? "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200"
                            : "bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200"
                        }`}
                      >
                        <p
                          className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                            request.status === "APPROVED"
                              ? "text-green-700"
                              : request.status === "REJECTED"
                              ? "text-red-700"
                              : request.status === "PENDING_ADMIN"
                              ? "text-orange-700"
                              : "text-yellow-700"
                          }`}
                        >
                          {t("leaveRequest.status.label", "Status")}
                        </p>
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-bold shadow-md ${
                            request.status === "APPROVED"
                              ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                              : request.status === "REJECTED"
                              ? "bg-gradient-to-r from-red-500 to-rose-600 text-white"
                              : request.status === "PENDING_ADMIN"
                              ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white"
                              : "bg-gradient-to-r from-yellow-500 to-amber-600 text-white"
                          }`}
                        >
                          {getStatusIcon(request.status)}
                          {getStatusLabel(request.status, t)}
                        </span>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="space-y-3 pt-6 border-t-2 border-slate-200">
                      {/* Cảnh báo đặc biệt cho đơn nghỉ việc */}
                      {request.type === "RESIGNATION" && (
                        <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-xl">
                          <p className="text-sm text-red-800 font-bold flex items-center gap-2">
                            <XCircle className="w-4 h-4" />
                            {t("leaveRequest.resignation.warning", "This is a resignation request - requires admin approval")}
                          </p>
                        </div>
                      )}

                      <div className="flex items-start gap-2">
                        <span className="font-bold text-slate-700 min-w-[100px]">
                          {t("leaveRequest.clinic", "Clinic")}:
                        </span>
                        <span className="text-slate-600 font-medium">{request.clinicName || `ID: ${request.clinicId}`}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-slate-700 min-w-[100px]">
                          {t("leaveRequest.reason", "Reason")}:
                        </span>
                        <span className="text-slate-600">{request.reason}</span>
                      </div>
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
                      {request.status === "PENDING" && (
                        // Nút hủy đơn nếu trạng thái là chờ duyệt
                        <button
                          onClick={() => handleCancel(request.id)}
                          className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg transition-all font-bold text-sm shadow-md flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          {t("leaveRequest.cancel", "Cancel Request")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

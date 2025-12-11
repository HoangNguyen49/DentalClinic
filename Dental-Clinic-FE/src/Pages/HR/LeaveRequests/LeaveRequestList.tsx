import { useState, useEffect, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import { useTranslation } from "react-i18next";
import { Plus, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import Header from "../../../widgets/Header/Header";
import Footer from "../../../widgets/Footer/Footer";
import CreateLeaveRequestForm from "./CreateLeaveRequestForm";
import { useNotification } from "../../../app/providers/NotificationContext";
import { hrApi } from "../../../services/hr/hrApi";
import type { HrLeaveRequest } from "../../../services/hr/hrApi";
import { useHrApi } from "../../../hooks/useHrApi";

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

  // Màu nền trạng thái đơn
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "PENDING_ADMIN":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Icon trạng thái đơn
  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case "APPROVED":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "REJECTED":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "PENDING":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case "PENDING_ADMIN":
        return <Clock className="w-5 h-5 text-orange-600" />;
      default:
        return null;
    }
  };

  // Hiển thị tên loại đơn
  const getTypeLabel = (type: string) => {
    switch (type.toUpperCase()) {
      case "VACATION":
        return t("leaveRequest.types.vacation");
      case "SICK":
        return t("leaveRequest.types.sick");
      case "PERSONAL":
        return t("leaveRequest.types.personal");
      case "RESIGNATION":
        return t("leaveRequest.types.resignation");
      case "OTHER":
        return t("leaveRequest.types.other");
      default:
        return type;
    }
  };

  // Hiển thị tên ca đối với bác sĩ
  const getShiftTypeLabel = (shiftType?: string) => {
    if (!shiftType || shiftType === "FULL_DAY") {
      return t("leaveRequest.shiftTypes.fullDay");
    }
    switch (shiftType.toUpperCase()) {
      case "MORNING":
        return t("leaveRequest.shiftTypes.morning");
      case "AFTERNOON":
        return t("leaveRequest.shiftTypes.afternoon");
      default:
        return shiftType;
    }
  };

  // Nhãn trạng thái đơn
  const getStatusLabel = (status: string) => {
    switch (status.toUpperCase()) {
      case "APPROVED":
        return t("leaveRequest.status.approved");
      case "REJECTED":
        return t("leaveRequest.status.rejected");
      case "PENDING":
        return t("leaveRequest.status.pending");
      case "PENDING_ADMIN":
        return t("leaveRequest.status.pendingAdmin", "Chờ Admin xác nhận");
      default:
        return status;
    }
  };

  // Định dạng ngày theo chuẩn Việt Nam
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

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
      <div className="min-h-screen bg-gray-100">
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          <ToastContainer position="top-right" autoClose={5000} />

          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">{t("leaveRequest.title")}</h1>
            {/* Nút tạo đơn mới */}
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-5 h-5 inline mr-2" />
              {t("leaveRequest.createNew")}
            </button>
          </div>

          {showCreateForm && (
            <CreateLeaveRequestForm
              onClose={() => {
                setShowCreateForm(false);
                fetchLeaveRequests();
              }}
            />
          )}

          {leaveRequests.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  {t("leaveRequest.messages.noRequests")}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Hiển thị danh sách các đơn xin nghỉ */}
              {leaveRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white rounded-lg shadow-md p-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">{t("leaveRequest.type")}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusIcon(request.status)}
                        <p className="text-lg font-semibold">
                          {getTypeLabel(request.type)}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t("leaveRequest.time", "Thời gian")}</p>
                      <p className="text-lg font-semibold">
                        {formatDate(request.startDate)} - {formatDate(request.endDate)}
                      </p>
                      {request.shiftType && request.shiftType !== "FULL_DAY" && (
                        <p className="text-sm text-gray-500 mt-1">
                          {t("leaveRequest.shiftType")}: {getShiftTypeLabel(request.shiftType)}
                        </p>
                      )}
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
                    {/* Cảnh báo đặc biệt cho đơn nghỉ việc */}
                    {request.type === "RESIGNATION" && (
                      <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800 font-semibold">
                          {t("leaveRequest.resignation.warning")}
                        </p>
                      </div>
                    )}
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">
                        {t("leaveRequest.clinic")}:
                      </span>{" "}
                      <span className="text-gray-600">{request.clinicName || `ID: ${request.clinicId}`}</span>
                    </p>
                    <p className="text-sm">
                      <span className="font-medium text-gray-700">
                        {t("leaveRequest.reason")}:
                      </span>{" "}
                      <span className="text-gray-600">{request.reason}</span>
                    </p>
                    {request.approvedByName && (
                      <p className="text-sm">
                        <span className="font-medium text-gray-700">
                          {t("leaveRequest.approvedBy")}:
                        </span>{" "}
                        <span className="text-gray-600">{request.approvedByName}</span>
                      </p>
                    )}
                    <div className="flex justify-between items-center mt-4 pt-2 border-t">
                      <p className="text-xs text-gray-500">
                        {t("leaveRequest.createdAt")}:{" "}
                        {new Date(request.createdAt).toLocaleString("vi-VN")}
                      </p>
                      {request.status === "PENDING" && (
                        // Nút hủy đơn nếu trạng thái là chờ duyệt
                        <button
                          onClick={() => handleCancel(request.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                        >
                          {t("leaveRequest.cancel")}
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

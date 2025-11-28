import { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { useTranslation } from "react-i18next";
import { Plus, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import Header from "../../../widgets/Header/Header";
import Footer from "../../../widgets/Footer/Footer";
import CreateLeaveRequestForm from "./CreateLeaveRequestForm";

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
  type: string; // VACATION, SICK, PERSONAL, OTHER
  status: string; // PENDING, APPROVED, REJECTED
  reason: string;
  approvedBy?: number;
  approvedByName?: string;
  createdAt: string;
  updatedAt: string;
};

export default function LeaveRequestList() {
  const { t } = useTranslation();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const accessToken = localStorage.getItem("accessToken");

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const response = await axios.get<LeaveRequest[]>(
        `${apiBase}/api/hr/leave-requests/my`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      setLeaveRequests(response.data || []);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          t("leaveRequest.messages.loadFailed", "Không thể tải danh sách đơn xin nghỉ")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (leaveRequestId: number) => {
    if (!accessToken) return;
    if (!window.confirm(t("leaveRequest.messages.confirmCancel", "Bạn có chắc muốn hủy đơn này?"))) {
      return;
    }

    try {
      await axios.delete(`${apiBase}/api/hr/leave-requests/${leaveRequestId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      toast.success(t("leaveRequest.messages.cancelSuccess", "Hủy đơn thành công"));
      fetchLeaveRequests();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          t("leaveRequest.messages.cancelFailed", "Không thể hủy đơn")
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
        <h1 className="text-2xl font-bold text-gray-900">{t("leaveRequest.title", "Đơn xin nghỉ của tôi")}</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5 inline mr-2" />
          {t("leaveRequest.createNew", "Tạo đơn mới")}
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
              {t("leaveRequest.messages.noRequests", "Chưa có đơn xin nghỉ nào")}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {leaveRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">{t("leaveRequest.type", "Loại nghỉ")}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(request.status)}
                    <p className="text-lg font-semibold">
                      {getTypeLabel(request.type)}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Thời gian</p>
                  <p className="text-lg font-semibold">
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
                    {t("leaveRequest.clinic", "Cơ sở")}:
                  </span>{" "}
                  <span className="text-gray-600">{request.clinicName || `ID: ${request.clinicId}`}</span>
                </p>
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
                    <button
                      onClick={() => handleCancel(request.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                    >
                      {t("leaveRequest.cancel", "Hủy đơn")}
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


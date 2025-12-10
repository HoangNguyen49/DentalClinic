import { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { useTranslation } from "react-i18next";
import { CheckCircle, XCircle, Clock, Search, User, Calendar, Eye } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";

type FaceProfileUpdateRequest = {
  requestId: number;
  userId: number;
  user?: {
    id: number;
    fullName: string;
    email: string;
    code?: string;
  };
  newFaceEmbedding: string;
  newFaceImageUrl: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: number;
  rejectionReason?: string;
};

export default function FaceProfileApprovalManagement() {
  const { t } = useTranslation("hr-dashboard");
  const [requests, setRequests] = useState<FaceProfileUpdateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<FaceProfileUpdateRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const accessToken = localStorage.getItem("accessToken");

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  // Lấy danh sách các request chờ duyệt từ backend
  const fetchPendingRequests = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const response = await axios.get<FaceProfileUpdateRequest[]>(
        `${apiBase}/api/hr/face-profile/pending-requests`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      let data: any = response.data;

      // Nếu response trả về là string JSON thì parse sang object
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
          // console.log("Parsed JSON string to array, length:", Array.isArray(data) ? data.length : 'not array');
        } catch (e) {
          setRequests([]);
          return;
        }
      }

      // Xử lý các trường hợp dữ liệu trả về khác nhau
      if (data !== null && data !== undefined) {
        if (Array.isArray(data)) {
          setRequests(data);
          return;
        }
        if (data.data && Array.isArray(data.data)) {
          setRequests(data.data);
          return;
        }
        const arrayKeys = Object.keys(data).filter(key => Array.isArray(data[key]));
        if (arrayKeys.length > 0) {
          setRequests(data[arrayKeys[0]]);
          return;
        }
      }

      // Trường hợp không phải array thì trả về mảng rỗng
      setRequests([]);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
        t("faceProfileApproval.messages.loadFailed")
      );
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // Duyệt request
  const handleApprove = async (requestId: number) => {
    if (!accessToken) return;

    try {
      await axios.post(
        `${apiBase}/api/hr/face-profile/approve/${requestId}`,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      toast.success(t("faceProfileApproval.messages.approveSuccess"));
      setSelectedRequest(null);
      fetchPendingRequests();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
        t("faceProfileApproval.messages.approveFailed")
      );
    }
  };

  // Từ chối request
  const handleReject = async () => {
    if (!selectedRequest || !accessToken) return;

    try {
      await axios.post(
        `${apiBase}/api/hr/face-profile/reject/${selectedRequest.requestId}`,
        null,
        {
          params: { reason: rejectionReason || undefined },
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      toast.success(t("faceProfileApproval.messages.rejectSuccess"));
      setSelectedRequest(null);
      setShowRejectModal(false);
      setRejectionReason("");
      fetchPendingRequests();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
        t("faceProfileApproval.messages.rejectFailed")
      );
    }
  };

  // Trả về màu sắc badge trạng thái
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

  // Icon trạng thái
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

  // Định dạng ngày
  const formatDate = (dateString: string) => {
    if (!dateString) return t("common.na");
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Lọc list request theo ô tìm kiếm
  const filteredRequests = Array.isArray(requests) ? requests.filter((req) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const userName = req.user?.fullName?.toLowerCase() || "";
    const userEmail = req.user?.email?.toLowerCase() || "";
    const userCode = req.user?.code?.toLowerCase() || "";
    return (
      userName.includes(searchLower) ||
      userEmail.includes(searchLower) ||
      userCode.includes(searchLower)
    );
  }) : [];

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Tiêu đề trang */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-3xl font-semibold text-gray-800 mb-2">
              {t("faceProfileApproval.title")}
            </h1>
            <p className="text-gray-600">
              {t("faceProfileApproval.subtitle")}
            </p>
          </div>

          {/* Tìm kiếm */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t("faceProfileApproval.searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Bảng danh sách request */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">{t("faceProfileApproval.messages.loading")}</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="p-12 text-center">
                <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">
                  {searchTerm ? t("faceProfileApproval.messages.noSearchResults") : t("faceProfileApproval.messages.noRequests")}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("faceProfileApproval.employee")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("faceProfileApproval.newImage")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("faceProfileApproval.requestDate")}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("faceProfileApproval.status")}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("faceProfileApproval.actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRequests.map((request) => (
                      <tr key={request.requestId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {request.user?.fullName || `${t("common.user")} ID: ${request.userId}`}
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.user?.email || t("common.na")}
                              </div>
                              {request.user?.code && (
                                <div className="text-xs text-gray-400">
                                  {t("faceProfileApproval.employeeCode")}: {request.user.code}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {request.newFaceImageUrl ? (
                            <button
                              onClick={() => setSelectedRequest(request)}
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                            >
                              <Eye className="w-4 h-4" />
                              <span className="text-sm">{t("faceProfileApproval.viewImage")}</span>
                            </button>
                          ) : (
                            <span className="text-sm text-gray-400">{t("faceProfileApproval.noImage")}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="w-4 h-4 mr-2" />
                            {formatDate(request.requestedAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              request.status
                            )}`}
                          >
                            {getStatusIcon(request.status)}
                            {request.status === "PENDING" && t("faceProfileApproval.status.pending")}
                            {request.status === "APPROVED" && t("faceProfileApproval.status.approved")}
                            {request.status === "REJECTED" && t("faceProfileApproval.status.rejected")}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {request.status === "PENDING" && (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleApprove(request.requestId)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                              >
                                <CheckCircle className="w-4 h-4" />
                                {t("faceProfileApproval.approve")}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setShowRejectModal(true);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                              >
                                <XCircle className="w-4 h-4" />
                                {t("faceProfileApproval.reject")}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal xem trước ảnh khuôn mặt mới */}
      {selectedRequest && selectedRequest.newFaceImageUrl && !showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {t("faceProfileApproval.imageModal.title")} - {selectedRequest.user?.fullName || `${t("common.user")} ID: ${selectedRequest.userId}`}
                </h2>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label={t("faceProfileApproval.close")}
                  title={t("faceProfileApproval.close")}
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <div className="mb-4">
                <img
                  src={selectedRequest.newFaceImageUrl}
                  alt="New face image"
                  className="w-full rounded-lg border border-gray-200"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder-face.png";
                  }}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-100"
                >
                  {t("faceProfileApproval.close")}
                </button>
                {selectedRequest.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => {
                        handleApprove(selectedRequest.requestId);
                        setSelectedRequest(null);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      {t("faceProfileApproval.approveRequest")}
                    </button>
                    <button
                      onClick={() => {
                        setShowRejectModal(true);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      {t("faceProfileApproval.rejectRequest")}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal nhập lý do từ chối */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">{t("faceProfileApproval.rejectModal.title")}</h2>
              <p className="text-gray-600 mb-4">
                {t("faceProfileApproval.rejectModal.employee")}: <strong>{selectedRequest.user?.fullName || `${t("common.user")} ID: ${selectedRequest.userId}`}</strong>
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("faceProfileApproval.rejectModal.reasonLabel")}
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder={t("faceProfileApproval.rejectModal.reasonPlaceholder")}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason("");
                  }}
                  className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-100"
                >
                  {t("faceProfileApproval.rejectModal.cancel")}
                </button>
                <button
                  onClick={handleReject}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  {t("faceProfileApproval.rejectModal.confirmReject")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { X, Calendar } from "lucide-react";

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";

type Props = {
  onClose: () => void;
};

type UserInfo = {
  userId?: number;
  fullName?: string;
  email?: string;
  jobTitle?: string;
  roles?: string[];
};

export default function CreateLeaveRequestForm({ onClose }: Props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [isDoctor, setIsDoctor] = useState(false);
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    type: "VACATION",
    reason: "",
    shiftType: "FULL_DAY" as string,
  });
  const accessToken = localStorage.getItem("accessToken");

  // Check if user is a doctor
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const user: UserInfo = JSON.parse(userStr);
          // Check from jobTitle or roles
          const jobTitle = user.jobTitle?.toUpperCase() || "";
          const roles = user.roles || [];
          const isDoctorRole = jobTitle.includes("DOCTOR") || 
                              jobTitle.includes("BÁC SĨ") ||
                              roles.some(r => r.toUpperCase().includes("DOCTOR"));
          setIsDoctor(isDoctorRole);
        } else {
          // Fetch user info from API
          const response = await axios.get<UserInfo>(`${apiBase}/api/users/me`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const jobTitle = response.data.jobTitle?.toUpperCase() || "";
          const roles = response.data.roles || [];
          const isDoctorRole = jobTitle.includes("DOCTOR") || 
                              jobTitle.includes("BÁC SĨ") ||
                              roles.some(r => r.toUpperCase().includes("DOCTOR"));
          setIsDoctor(isDoctorRole);
        }
      } catch (error) {
        console.error("Error checking user role:", error);
        // Default to false if error
        setIsDoctor(false);
      }
    };
    checkUserRole();
  }, [accessToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      toast.error(t("leaveRequest.messages.noAccessToken", "Không có quyền truy cập"));
      return;
    }

    if (!formData.startDate || !formData.endDate || !formData.reason) {
      toast.error(t("leaveRequest.messages.fillAllFields", "Vui lòng điền đầy đủ thông tin"));
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      toast.error(
        t("leaveRequest.messages.invalidDateRange", "Ngày bắt đầu phải trước ngày kết thúc")
      );
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(formData.startDate);
    if (startDate < today) {
      toast.error(
        t("leaveRequest.messages.pastDate", "Không thể tạo đơn cho ngày trong quá khứ")
      );
      return;
    }

    setLoading(true);
    try {
      const requestData: any = {
        startDate: formData.startDate,
        endDate: formData.endDate,
        type: formData.type,
        reason: formData.reason,
      };
      
      // Only include shiftType if user is a doctor
      if (isDoctor && formData.shiftType) {
        requestData.shiftType = formData.shiftType;
      }
      
      await axios.post(
        `${apiBase}/api/hr/leave-requests`,
        requestData,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      toast.success(t("leaveRequest.messages.createSuccess", "Tạo đơn xin nghỉ thành công"));
      onClose();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          t("leaveRequest.messages.createFailed", "Không thể tạo đơn xin nghỉ")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            {t("leaveRequest.createTitle", "Tạo đơn xin nghỉ")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            aria-label={t("common.close", "Đóng")}
            title={t("common.close", "Đóng")}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("leaveRequest.startDate", "Ngày bắt đầu")} *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  aria-label={t("leaveRequest.startDate", "Ngày bắt đầu")}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("leaveRequest.endDate", "Ngày kết thúc")} *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                  min={formData.startDate || new Date().toISOString().split("T")[0]}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  aria-label={t("leaveRequest.endDate", "Ngày kết thúc")}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("leaveRequest.type", "Loại nghỉ")} *
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, type: e.target.value }))
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              aria-label={t("leaveRequest.type", "Loại nghỉ")}
            >
              <option value="VACATION">
                {t("leaveRequest.types.vacation", "Nghỉ phép")}
              </option>
              <option value="SICK">
                {t("leaveRequest.types.sick", "Nghỉ ốm")}
              </option>
              <option value="PERSONAL">
                {t("leaveRequest.types.personal", "Nghỉ cá nhân")}
              </option>
              <option value="OTHER">
                {t("leaveRequest.types.other", "Khác")}
              </option>
            </select>
          </div>

          {isDoctor && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("leaveRequest.shiftType", "Ca làm việc")} *
              </label>
              <select
                value={formData.shiftType}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, shiftType: e.target.value }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                aria-label={t("leaveRequest.shiftType", "Ca làm việc")}
              >
                <option value="FULL_DAY">
                  {t("leaveRequest.shiftTypes.fullDay", "Cả ngày")}
                </option>
                <option value="MORNING">
                  {t("leaveRequest.shiftTypes.morning", "Ca sáng")}
                </option>
                <option value="AFTERNOON">
                  {t("leaveRequest.shiftTypes.afternoon", "Ca chiều")}
                </option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {t("leaveRequest.shiftTypeHint", "Chọn ca bạn muốn xin nghỉ. Nếu chọn cả ngày, bạn sẽ nghỉ cả ca sáng và ca chiều.")}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("leaveRequest.reason", "Lý do")} *
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, reason: e.target.value }))
              }
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t("leaveRequest.reasonPlaceholder", "Nhập lý do xin nghỉ...")}
              required
            />
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              {t("common.cancel", "Hủy")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading
                ? t("common.submitting", "Đang gửi...")
                : t("common.submit", "Gửi đơn")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


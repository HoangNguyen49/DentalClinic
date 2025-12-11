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
  const { t } = useTranslation("web");
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

  // Kiểm tra người dùng có phải bác sĩ không
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const user: UserInfo = JSON.parse(userStr);
          // Xác định dựa vào jobTitle hoặc roles
          const jobTitle = user.jobTitle?.toUpperCase() || "";
          const roles = user.roles || [];
          const isDoctorRole = jobTitle.includes("DOCTOR") ||
            jobTitle.includes("BÁC SĨ") ||
            roles.some(r => r.toUpperCase().includes("DOCTOR"));
          setIsDoctor(isDoctorRole);
        } else {
          // Gọi API lấy thông tin user nếu chưa có trong localStorage
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
        // Nếu lỗi thì mặc định không phải bác sĩ
        setIsDoctor(false);
      }
    };
    checkUserRole();
  }, [accessToken]);

  // Tự động set ngày nghỉ việc = 1 tháng sau khi chọn RESIGNATION
  useEffect(() => {
    if (formData.type === "RESIGNATION") {
      const today = new Date();
      const oneMonthLater = new Date(today);
      oneMonthLater.setMonth(today.getMonth() + 1);

      const formattedDate = oneMonthLater.toISOString().split("T")[0];
      setFormData((prev) => ({
        ...prev,
        startDate: formattedDate,
        endDate: formattedDate,
      }));
    }
  }, [formData.type]);

  // Xử lý gửi form tạo đơn xin nghỉ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      toast.error(t("leaveRequest.messages.noAccessToken"));
      return;
    }

    // Kiểm tra các trường bắt buộc
    if (!formData.startDate || !formData.endDate || !formData.reason) {
      toast.error(t("leaveRequest.messages.fillAllFields"));
      return;
    }

    // Ngày bắt đầu không được lớn hơn ngày kết thúc
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      toast.error(
        t("leaveRequest.messages.invalidDateRange")
      );
      return;
    }

    // Không cho phép xin nghỉ cho ngày trong quá khứ
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(formData.startDate);
    if (startDate < today) {
      toast.error(
        t("leaveRequest.messages.pastDate")
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
      // Nếu bác sĩ thì gửi cả ca làm việc
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
      toast.success(t("leaveRequest.messages.createSuccess"));
      onClose();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
        t("leaveRequest.messages.createFailed")
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
            {t("leaveRequest.createTitle")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            aria-label={t("common.close")}
            title={t("common.close")}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        {/* Form tạo đơn xin nghỉ */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("leaveRequest.startDate")} *
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
                  disabled={formData.type === "RESIGNATION"}
                  className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formData.type === "RESIGNATION" ? "bg-gray-100 cursor-not-allowed" : ""
                    }`}
                  required
                  aria-label={t("leaveRequest.startDate")}
                  title={formData.type === "RESIGNATION" ? t("leaveRequest.resignation.autoDateTitle") : ""}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("leaveRequest.endDate")} *
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
                  disabled={formData.type === "RESIGNATION"}
                  className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${formData.type === "RESIGNATION" ? "bg-gray-100 cursor-not-allowed" : ""
                    }`}
                  required
                  aria-label={t("leaveRequest.endDate")}
                  title={formData.type === "RESIGNATION" ? t("leaveRequest.resignation.autoDateTitle") : ""}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("leaveRequest.type")} *
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, type: e.target.value }))
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              aria-label={t("leaveRequest.type")}
            >
              <option value="VACATION">
                {t("leaveRequest.types.vacation")}
              </option>
              <option value="SICK">
                {t("leaveRequest.types.sick")}
              </option>
              <option value="PERSONAL">
                {t("leaveRequest.types.personal")}
              </option>
              <option value="RESIGNATION">
                {t("leaveRequest.types.resignation")}
              </option>
              <option value="OTHER">
                {t("leaveRequest.types.other")}
              </option>
            </select>
            {formData.type === "RESIGNATION" && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>{t("leaveRequest.resignation.note").split(":")[0]}:</strong> {t("leaveRequest.resignation.note").split(":")[1]}
                </p>
                <p className="text-sm text-yellow-800 mt-2">
                  <strong>{t("leaveRequest.resignation.dateNote", { date: "" }).split(":")[0]}:</strong> {t("leaveRequest.resignation.dateNote", { date: formData.startDate ? new Date(formData.startDate).toLocaleDateString("vi-VN") : "" }).split(":")[1]}
                </p>
              </div>
            )}
          </div>

          {/* Nếu là bác sĩ thì cho chọn ca làm việc */}
          {isDoctor && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("leaveRequest.shiftType")} *
              </label>
              <select
                value={formData.shiftType}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, shiftType: e.target.value }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                aria-label={t("leaveRequest.shiftType")}
              >
                <option value="FULL_DAY">
                  {t("leaveRequest.shiftTypes.fullDay")}
                </option>
                <option value="MORNING">
                  {t("leaveRequest.shiftTypes.morning")}
                </option>
                <option value="AFTERNOON">
                  {t("leaveRequest.shiftTypes.afternoon")}
                </option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {t("leaveRequest.shiftTypeHint")}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("leaveRequest.reason")} *
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, reason: e.target.value }))
              }
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t("leaveRequest.reasonPlaceholder")}
              required
            />
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading
                ? t("common.submitting")
                : t("common.submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

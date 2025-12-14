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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200/60">
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-t-2xl px-6 py-5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">
                {t("leaveRequest.createTitle", "Create Leave Request")}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white/20 rounded-xl transition-all"
              aria-label={t("common.close")}
              title={t("common.close")}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        {/* Form tạo đơn xin nghỉ */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                {t("leaveRequest.startDate", "Start Date")} *
              </label>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                  }
                  min={new Date().toISOString().split("T")[0]}
                  disabled={formData.type === "RESIGNATION"}
                  className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl text-base font-medium transition-all ${
                    formData.type === "RESIGNATION"
                      ? "bg-gradient-to-br from-slate-50 to-gray-100 border-slate-300 cursor-not-allowed text-slate-500"
                      : "border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                  }`}
                  required
                  aria-label={t("leaveRequest.startDate")}
                  title={formData.type === "RESIGNATION" ? t("leaveRequest.resignation.autoDateTitle") : ""}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                {t("leaveRequest.endDate", "End Date")} *
              </label>
              <div className="relative group">
                <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                  }
                  min={formData.startDate || new Date().toISOString().split("T")[0]}
                  disabled={formData.type === "RESIGNATION"}
                  className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl text-base font-medium transition-all ${
                    formData.type === "RESIGNATION"
                      ? "bg-gradient-to-br from-slate-50 to-gray-100 border-slate-300 cursor-not-allowed text-slate-500"
                      : "border-slate-200 bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                  }`}
                  required
                  aria-label={t("leaveRequest.endDate")}
                  title={formData.type === "RESIGNATION" ? t("leaveRequest.resignation.autoDateTitle") : ""}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              {t("leaveRequest.type", "Leave Type")} *
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, type: e.target.value }))
              }
              className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl text-base font-medium bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
              required
              aria-label={t("leaveRequest.type")}
            >
              <option value="VACATION">
                {t("leaveRequest.types.vacation", "Vacation")}
              </option>
              <option value="SICK">
                {t("leaveRequest.types.sick", "Sick Leave")}
              </option>
              <option value="PERSONAL">
                {t("leaveRequest.types.personal", "Personal Leave")}
              </option>
              <option value="RESIGNATION">
                {t("leaveRequest.types.resignation", "Resignation")}
              </option>
              <option value="OTHER">
                {t("leaveRequest.types.other", "Other")}
              </option>
            </select>
            {formData.type === "RESIGNATION" && (
              <div className="mt-4 p-5 bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 rounded-xl">
                <div className="flex items-start gap-3 mb-3">
                  <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-red-800 mb-1">
                      {t("leaveRequest.resignation.important", "Important")}
                    </p>
                    <p className="text-sm text-red-700">
                      {t("leaveRequest.resignation.note", "Note: Resignation requests need to be approved by HR and confirmed by Admin. Once approved, you may be permanently deleted from the system.")}
                    </p>
                  </div>
                </div>
                <div className="pl-8 pt-3 border-t border-red-200">
                  <p className="text-sm text-red-700">
                    <strong>{t("leaveRequest.resignation.dateNote", { date: formData.startDate ? new Date(formData.startDate).toLocaleDateString("vi-VN") : "" }).split(":")[0]}:</strong> {t("leaveRequest.resignation.dateNote", { date: formData.startDate ? new Date(formData.startDate).toLocaleDateString("vi-VN") : "" }).split(":")[1]}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Nếu là bác sĩ thì cho chọn ca làm việc */}
          {isDoctor && (
            <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl">
              <label className="block text-xs font-bold text-purple-700 uppercase tracking-wider mb-3">
                {t("leaveRequest.shiftType", "Shift")} *
              </label>
              <select
                value={formData.shiftType}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, shiftType: e.target.value }))
                }
                className="w-full px-4 py-3.5 border-2 border-purple-200 rounded-xl text-base font-medium bg-white focus:outline-none focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all"
                required
                aria-label={t("leaveRequest.shiftType")}
              >
                <option value="FULL_DAY">
                  {t("leaveRequest.shiftTypes.fullDay", "Full Day")}
                </option>
                <option value="MORNING">
                  {t("leaveRequest.shiftTypes.morning", "Morning Shift")}
                </option>
                <option value="AFTERNOON">
                  {t("leaveRequest.shiftTypes.afternoon", "Afternoon Shift")}
                </option>
              </select>
              <p className="mt-3 text-xs text-purple-600 font-medium">
                💡 {t("leaveRequest.shiftTypeHint", "Select the shift you want to take leave. If you select full day, you will be off for both morning and afternoon shifts.")}
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              {t("leaveRequest.reason", "Reason")} *
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, reason: e.target.value }))
              }
              rows={5}
              className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl text-base bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all resize-none"
              placeholder={t("leaveRequest.reasonPlaceholder", "Enter leave reason...")}
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t-2 border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3.5 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-bold text-base"
            >
              {t("common.cancel", "Cancel")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-xl transition-all font-bold text-base shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  {t("common.submitting", "Submitting...")}
                </>
              ) : (
                <>
                  <Calendar className="w-5 h-5" />
                  {t("common.submit", "Submit")}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

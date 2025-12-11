import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import employeeService from "../../../services/hr/employeeService";
import type { Employee } from "../../../services/hr/employeeService";
import {
  ArrowLeft,
  User,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from "react-i18next";

// Hiển thị thông tin chi tiết nhân viên
function EmployeeDetail() {
  const { t, i18n } = useTranslation("employees");
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarError, setAvatarError] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEmployeeDetail();
    }
  }, [id]);

  // Lấy dữ liệu chi tiết nhân viên
  const fetchEmployeeDetail = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await employeeService.getEmployee(id);
      setEmployee(response.data);
      setAvatarError(false);
    } catch (err: any) {
      console.error("Error fetching employee:", err);
      let errorMsg = t("detail.cannotLoad");

      if (err?.response?.data) {
        const errorData = err.response.data;
        errorMsg = errorData.message || errorData.error || errorMsg;
      } else if (err?.message) {
        errorMsg = err.message;
      }

      toast.error(errorMsg);
      setTimeout(() => {
        navigate("/hr/employees");
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  // Định dạng ngày theo ngôn ngữ
  const formatDate = (dateString?: string) => {
    if (!dateString) return t("common.na");
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  // Xử lý bật/tắt trạng thái tài khoản nhân viên
  const handleToggleStatus = async () => {
    if (!id || !employee) return;

    const newStatus = !employee.isActive;
    const action = newStatus ? t("detail.actions.activate") : t("detail.actions.deactivate");
    const confirmMessage = t("detail.actions.confirmToggle", {
      action,
      name: employee.fullName
    });

    if (!window.confirm(confirmMessage)) return;

    const reason = prompt(t("detail.actions.reason"));
    if (!reason || reason.trim() === "") {
      toast.warning(t("detail.actions.reasonRequired"));
      return;
    }

    setToggling(true);
    try {
      const response = await employeeService.toggleEmployeeStatus(id, newStatus, reason.trim());
      setEmployee(response.data);
      toast.success(
        newStatus
          ? t("detail.actions.activated")
          : t("detail.actions.deactivated")
      );
    } catch (err: any) {
      console.error("Error toggling status:", err);
      let errorMsg = t("detail.actions.toggleFailed");
      if (err?.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      toast.error(errorMsg);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">{t("detail.loading")}</div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">{t("detail.notFound")}</div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="min-h-screen bg-gray-50">
        {/* Header: Quay lại danh sách và tiêu đề */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <button
            onClick={() => navigate("/hr/employees")}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t("detail.back")}</span>
          </button>
          <h1 className="text-3xl font-semibold">
            <span className="text-gray-400 font-normal">{t("detail.profile")}</span>
            <span className="text-gray-400 font-normal ml-4">{employee.fullName}</span>
          </h1>
        </div>

        {/* Nội dung chính */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Thông tin bên trái (thẻ profile) */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {/* Avatar */}
                <div className="relative mb-4">
                  <div className="w-32 h-32 rounded-lg bg-gray-200 overflow-hidden flex items-center justify-center mx-auto">
                    {employee.avatarUrl && !avatarError ? (
                      <img
                        src={employee.avatarUrl.startsWith('http') ? employee.avatarUrl : `${apiBase}${employee.avatarUrl.startsWith('/') ? employee.avatarUrl : '/' + employee.avatarUrl}`}
                        alt={employee.fullName}
                        className="w-full h-full object-cover"
                        onError={() => setAvatarError(true)}
                      />
                    ) : (
                      <User className="w-16 h-16 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Họ tên nhân viên */}
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
                  {employee.fullName}
                </h2>

                {/* Badge chức vụ */}
                <div className="flex justify-center mb-6">
                  <span className="inline-flex px-4 py-1 rounded-full text-sm font-medium bg-blue-500 text-white">
                    {(employee.role as any)?.roleName || t("detail.employee")}
                  </span>
                </div>

                {/* Các box thông tin quan trọng */}
                <div className="space-y-3">
                  {employee.roleAtClinic && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">{t("detail.sections.journey")}</div>
                      <div className="text-sm font-medium text-gray-900">
                        {employee.roleAtClinic}
                      </div>
                    </div>
                  )}
                  {employee.code && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">{t("detail.sections.registration")}</div>
                      <div className="text-sm font-medium text-gray-900">
                        {employee.code}
                      </div>
                    </div>
                  )}
                  {employee.createdAt && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">{t("detail.sections.admissionDate")}</div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(employee.createdAt)}
                      </div>
                    </div>
                  )}
                  {(employee.role as any)?.roleName && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">{t("detail.sections.position")}</div>
                      <div className="text-sm font-medium text-gray-900">
                        {(employee.role as any).roleName}
                      </div>
                    </div>
                  )}
                  {(employee.department as any)?.departmentName && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">{t("detail.sections.department")}</div>
                      <div className="text-sm font-medium text-gray-900">
                        {(employee.department as any).departmentName}
                      </div>
                    </div>
                  )}
                  {(() => {
                    const roleName = (employee.role as any)?.roleName || "";
                    // Kiểm tra là bác sĩ
                    const isDoctor = roleName && (
                      roleName.toUpperCase().includes("DOCTOR") ||
                      roleName.toUpperCase().includes("BÁC SĨ")
                    );

                    // Nếu là bác sĩ => hiển thị toàn bộ chuyên khoa và phòng
                    if (isDoctor) {
                      // Tổng hợp tất cả chuyên khoa từ các nguồn
                      const allSpecialties = new Set<string>();

                      // Từ mảng specialties
                      if (employee.specialties && Array.isArray(employee.specialties)) {
                        employee.specialties.forEach((spec: string) => {
                          if (spec && spec.trim()) {
                            allSpecialties.add(spec.trim());
                          }
                        });
                      }

                      // Từ trường specialty (kiểu legacy, đơn lẻ)
                      if (employee.specialty && employee.specialty.trim()) {
                        allSpecialties.add(employee.specialty.trim());
                      }

                      // Từ mảng doctorSpecialties (danh mục bác sĩ - chuyên khoa)
                      if (employee.doctorSpecialties && Array.isArray(employee.doctorSpecialties)) {
                        employee.doctorSpecialties.forEach((ds: any) => {
                          const specName = ds.specialtyName || ds.specialty || ds.name;
                          if (specName && specName.trim() && ds.isActive !== false) {
                            allSpecialties.add(specName.trim());
                          }
                        });
                      }

                      const specialtiesList = Array.from(allSpecialties);

                      return (
                        <>
                          {specialtiesList.length > 0 && (
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                              <div className="text-xs text-gray-500 mb-2">{t("detail.sections.specialty")}</div>
                              <div className="flex flex-wrap gap-2">
                                {specialtiesList.map((spec, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                                    title={spec}
                                  >
                                    {spec}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {employee.room && (
                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                              <div className="text-xs text-gray-500 mb-1">{t("detail.sections.room")}</div>
                              <div className="text-sm font-medium text-gray-900">
                                {employee.room.roomName || "-"}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    }

                    // Nếu không phải bác sĩ, hiển thị phòng khám
                    if (employee.clinic) {
                      const clinic = employee.clinic as any;
                      return (
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <div className="text-xs text-gray-500 mb-1">{t("detail.sections.clinic")}</div>
                          <div className="text-sm font-medium text-gray-900">
                            {clinic.clinicName || clinic.name || "-"}
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })()}
                </div>
              </div>
            </div>

            {/* Nội dung bên phải */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Nội dung chi tiết */}
                <div className="p-6">
                  <div className="space-y-6">
                    {/* Thông tin cá nhân */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-900">
                          {t("detail.sections.personalData")}
                        </h3>
                      </div>
                      <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">
                              {t("detail.fields.fullName")}
                            </label>
                            <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                              <span className="text-sm font-medium text-gray-900">
                                {employee.fullName || t("common.na")}
                              </span>
                            </div>
                          </div>
                          {employee.username && (
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">
                                {t("detail.fields.username")}
                              </label>
                              <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                                <span className="text-sm font-medium text-gray-900">
                                  {employee.username}
                                </span>
                              </div>
                            </div>
                          )}
                          {employee.code && (
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">
                                {t("detail.fields.employeeCode")}
                              </label>
                              <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                                <span className="text-sm font-medium text-gray-900">
                                  {employee.code}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Thao tác (bật/tắt tài khoản) */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-900">{t("detail.sections.actions")}</h3>
                      </div>
                      <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex gap-3">
                          <button
                            onClick={handleToggleStatus}
                            disabled={loading || toggling}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${employee.isActive
                              ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                              : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {toggling
                              ? t("detail.actions.processing")
                              : employee.isActive
                                ? t("detail.actions.deactivateAccount")
                                : t("detail.actions.activateAccount")}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Thông tin liên hệ */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-900">{t("detail.sections.contact")}</h3>
                      </div>
                      <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs text-gray-500 mb-1 block">
                              {t("detail.fields.email")}
                            </label>
                            <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                              <span className="text-sm font-medium text-gray-900">
                                {employee.email || t("common.na")}
                              </span>
                            </div>
                          </div>
                          {employee.phone && (
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">
                                {t("detail.fields.phone")}
                              </label>
                              <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                                <span className="text-sm font-medium text-gray-900">
                                  {employee.phone}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default EmployeeDetail;

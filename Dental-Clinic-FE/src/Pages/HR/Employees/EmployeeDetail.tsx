import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { hrApi } from "../../../services/hr/hrApi";
import type { HrEmployee } from "../../../services/hr/hrApi";
import { useHrApi } from "../../../hooks/useHrApi";
import {
  ArrowLeft,
  User,
  Upload,
  FileText,
  Image as ImageIcon,
  Save,
  X,
  Loader2,
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

  const [employee, setEmployee] = useState<HrEmployee | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  const { execute: executeApi, loading } = useHrApi<any>();
  
  // CV Upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cvData, setCvData] = useState<{
    id?: number
    originalFileName?: string
    fileType?: string
    extractedText?: string
    extractedImages?: string[]
    cvFileUrl?: string
  } | null>(null);
  const [showCvPreview, setShowCvPreview] = useState(false);
  const [editableText, setEditableText] = useState<string>("");
  const [isEditingText, setIsEditingText] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEmployeeDetail();
      fetchCvData();
    }
  }, [id]);
  
  // Lấy CV data nếu có
  const fetchCvData = async () => {
    if (!id) return;
    try {
      const response = await hrApi.employees.getCvData(id);
      if (response.data) {
        setCvData(response.data);
        setEditableText(response.data.extractedText || "");
      }
    } catch (error) {
      // CV chưa có, không cần hiển thị lỗi
      setCvData(null);
      setEditableText("");
    }
  };
  
  // Xử lý chọn file
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Kiểm tra loại file
      const validTypes = ['application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        toast.error(t("detail.cv.validation.invalidFileType"));
        return;
      }
      // Kiểm tra kích thước (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(t("detail.cv.validation.fileTooLarge"));
        return;
      }
      setSelectedFile(file);
    }
  };
  
  // Upload và extract CV
  const handleUploadCv = async () => {
    if (!id || !selectedFile) return;
    
    setUploading(true);
    try {
      const response = await hrApi.employees.uploadCv(id, selectedFile);
      if (response.data) {
        setCvData(response.data);
        setEditableText(response.data.extractedText || "");
        setSelectedFile(null);
        setShowCvPreview(true);
        setIsEditingText(false);
        toast.success(t("detail.cv.messages.uploadSuccess"));
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("detail.cv.messages.uploadFailed"));
    } finally {
      setUploading(false);
    }
  };
  
  // Lưu extracted text đã chỉnh sửa
  const handleSaveCvText = async () => {
    if (!id || !cvData) return;
    
    setSaving(true);
    try {
      const response = await hrApi.employees.updateCvText(id, editableText);
      if (response.data) {
        setCvData({ ...cvData, extractedText: response.data.extractedText });
        setIsEditingText(false);
        toast.success(t("detail.cv.messages.saveSuccess"));
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("detail.cv.messages.saveFailed"));
    } finally {
      setSaving(false);
    }
  };
  
  // Xóa CV data
  const handleDeleteCv = async () => {
    if (!id) return;
    if (!window.confirm(t("detail.cv.messages.deleteConfirm"))) return;
    
    try {
      await hrApi.employees.deleteCvData(id);
      setCvData(null);
      setEditableText("");
      setShowCvPreview(false);
      setIsEditingText(false);
      toast.success(t("detail.cv.messages.deleteSuccess"));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("detail.cv.messages.deleteFailed"));
    }
  };

  // Lấy dữ liệu chi tiết nhân viên
  const fetchEmployeeDetail = async () => {
    if (!id) return;

    await executeApi(() => hrApi.employees.getById(id), {
      onSuccess: (data: any) => {
        setEmployee(data as HrEmployee);
        setAvatarError(false);
      },
      onError: () => {
        setTimeout(() => {
          navigate("/hr/employees");
        }, 2000);
      },
      errorMessage: t("detail.cannotLoad"),
    });
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

    await executeApi(() => hrApi.employees.toggleStatus(id, newStatus, reason.trim()), {
      onSuccess: (data: any) => {
        setEmployee(data as HrEmployee);
        toast.success(
          newStatus
            ? t("detail.actions.activated")
            : t("detail.actions.deactivated")
        );
      },
      errorMessage: t("detail.actions.toggleFailed"),
    });
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
                            disabled={loading}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${employee.isActive
                              ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                              : "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {loading
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

                    {/* Upload CV và Extract */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-900">{t("detail.cv.title")}</h3>
                      </div>
                      <div className="bg-white rounded-lg border border-gray-200 p-6">
                        {!cvData ? (
                          // Chưa có CV - hiển thị form upload
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t("detail.cv.upload.label")}
                              </label>
                              <div className="flex items-center gap-4">
                                <label className="flex-1 cursor-pointer">
                                  <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    disabled={uploading}
                                  />
                                  <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors">
                                    <Upload className="w-5 h-5 text-gray-400" />
                                    <span className="text-sm text-gray-600">
                                      {selectedFile ? selectedFile.name : t("detail.cv.upload.selectFile")}
                                    </span>
                                  </div>
                                </label>
                                {selectedFile && (
                                  <button
                                    onClick={handleUploadCv}
                                    disabled={uploading}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {uploading ? (
                                      <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>{t("detail.cv.upload.processing")}</span>
                                      </>
                                    ) : (
                                      <>
                                        <Save className="w-4 h-4" />
                                        <span>{t("detail.cv.upload.button")}</span>
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                              {selectedFile && (
                                <p className="mt-2 text-xs text-gray-500">
                                  {t("detail.cv.upload.fileInfo", {
                                    name: selectedFile.name,
                                    size: (selectedFile.size / 1024 / 1024).toFixed(2)
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          // Đã có CV - hiển thị thông tin
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <FileText className="w-5 h-5 text-blue-600" />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setShowCvPreview(!showCvPreview)}
                                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                                >
                                  {showCvPreview ? t("detail.cv.view.hide") : t("detail.cv.view.show")} {t("detail.cv.view.details")}
                                </button>
                                <button
                                  onClick={handleDeleteCv}
                                  className="px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100"
                                  title={t("detail.cv.view.deleteTitle")}
                                  aria-label={t("detail.cv.view.delete")}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {showCvPreview && (
                              <div className="mt-4 space-y-4 border-t pt-4">
                                {/* Extracted Text */}
                                {editableText && (
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <label className="block text-sm font-medium text-gray-700">
                                        {t("detail.cv.extractedText.label")}
                                      </label>
                                      <div className="flex gap-2">
                                        {isEditingText ? (
                                          <>
                                            <button
                                              onClick={handleSaveCvText}
                                              disabled={saving}
                                              className="flex items-center gap-1 px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                            >
                                              {saving ? (
                                                <>
                                                  <Loader2 className="w-3 h-3 animate-spin" />
                                                  <span>{t("detail.cv.extractedText.saving")}</span>
                                                </>
                                              ) : (
                                                <>
                                                  <Save className="w-3 h-3" />
                                                  <span>{t("detail.cv.extractedText.save")}</span>
                                                </>
                                              )}
                                            </button>
                                            <button
                                              onClick={() => {
                                                setEditableText(cvData.extractedText || "");
                                                setIsEditingText(false);
                                              }}
                                              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                            >
                                              {t("detail.cv.extractedText.cancel")}
                                            </button>
                                          </>
                                        ) : (
                                          <button
                                            onClick={() => setIsEditingText(true)}
                                            className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                                          >
                                            {t("detail.cv.extractedText.edit")}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    {isEditingText ? (
                                      <textarea
                                        value={editableText}
                                        onChange={(e) => setEditableText(e.target.value)}
                                        className="w-full min-h-[200px] p-4 bg-white rounded-lg border border-gray-300 text-xs text-gray-700 font-mono resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder={t("detail.cv.extractedText.placeholder")}
                                      />
                                    ) : (
                                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-60 overflow-y-auto">
                                        <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                                          {editableText}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Extracted Images */}
                                {cvData.extractedImages && cvData.extractedImages.length > 0 && (
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                      {t("detail.cv.extractedImages.label", { count: cvData.extractedImages.length })}
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                      {cvData.extractedImages.map((imageUrl, index) => (
                                        <div key={index} className="relative group">
                                          <img
                                            src={imageUrl}
                                            alt={`Extracted image ${index + 1}`}
                                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af"%3EImage%3C/text%3E%3C/svg%3E';
                                            }}
                                          />
                                          <a
                                            href={imageUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg"
                                            title={t("detail.cv.extractedImages.viewImage", { index: index + 1 })}
                                            aria-label={t("detail.cv.extractedImages.viewImageLabel", { index: index + 1 })}
                                          >
                                            <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100" />
                                          </a>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
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
    </>
  );
}

export default EmployeeDetail;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { hrApi } from "../../../services/hr/hrApi";
import type { Department, Role, HrClinic } from "../../../services/hr/hrApi";
import { useHrApi } from "../../../hooks/useHrApi";
import { X, Save, ArrowLeft } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from "react-i18next";

function CreateEmployeeForm() {
  const { t } = useTranslation("employees");
  const navigate = useNavigate();

  // State form cho các trường thông tin nhân viên
  const [code, setCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const password = "123456"; // mật khẩu mặc định
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [roleId, setRoleId] = useState<number | null>(null);
  const [clinicId, setClinicId] = useState<number | null>(null);
  const [specialties, setSpecialties] = useState<string[]>([]);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [clinics, setClinics] = useState<HrClinic[]>([]);

  const { execute: executeApi, loading } = useHrApi<any>();
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    fetchOptions();
  }, []);

  // Lấy dữ liệu các lựa chọn phòng ban, vai trò, phòng khám từ API và lọc dữ liệu không hợp lệ
  const fetchOptions = async () => {
    setLoadingOptions(true);
    
    await executeApi(hrApi.management.getDepartments, {
      onSuccess: (data: any) => {
        const forbiddenDepartmentNames = ["ADMIN", "ADMINISTRATION", "HUMAN RESOURCES", "HUMAN RESOURCE"];
        const departmentsData = ((data as Department[]) || []).filter((dept) => {
          if (!dept.departmentName) return false;
          const name = dept.departmentName.toUpperCase();
          return !forbiddenDepartmentNames.some(forbidden =>
            name === forbidden || name.includes(forbidden)
          );
        });
        setDepartments(departmentsData);
      },
      errorMessage: t("create.messages.failedToLoad"),
      showErrorToast: false,
    });

    await executeApi(hrApi.management.getRoles, {
      onSuccess: (data: any) => {
        const filteredRoles = ((data as Role[]) || []).filter((role) => {
          if (!role.roleName) return false;
          const normalized = role.roleName.toUpperCase();
          return normalized !== "ADMIN" &&
            normalized !== "USER" &&
            normalized !== "HR" &&
            !normalized.includes("HR");
        });
        setRoles(filteredRoles);
      },
      errorMessage: t("create.messages.failedToLoad"),
      showErrorToast: false,
    });

    await executeApi(hrApi.management.getClinics, {
      onSuccess: (data: any) => {
        const clinicsData = ((data as HrClinic[]) || []).map((c: any) => ({
          id: c.id,
          clinicName: c.clinicName || c.name,
          isActive: c.isActive !== undefined ? c.isActive : true,
        }));
        setClinics(clinicsData);
      },
      errorMessage: t("create.messages.failedToLoad"),
      showErrorToast: false,
    });

    setLoadingOptions(false);
  };

  // Xử lý submit form tạo nhân viên mới
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate dữ liệu bắt buộc nhập
    if (!fullName || !email || !phone || !code || !roleId || !departmentId) {
      toast.error(t("create.validation.fillRequired"));
      return;
    }

    // Kiểm tra clinicId: cần thiết với các vai trò không phải bác sĩ
    const selectedRole = roles.find(r => r.id === roleId);
    if (!selectedRole) {
      toast.error(t("create.validation.selectRole"));
      return;
    }

    // Kiểm tra nhân viên có phải là bác sĩ
    const isDoctor = selectedRole.roleName?.toUpperCase() === "DOCTOR" ||
      selectedRole.roleName?.toUpperCase() === "BÁC SĨ" ||
      selectedRole.roleName?.toLowerCase().includes("doctor") ||
      selectedRole.roleName?.toLowerCase().includes("bác sĩ");

    if (!isDoctor && !clinicId) {
      toast.error(t("create.validation.selectClinic"));
      return;
    }

    // Dữ liệu gửi lên backend
    const employeeRequest: any = {
      code,
      fullName,
      email,
      phone,
      password,
      departmentId,
      roleId,
      ...(isDoctor ? {} : { clinicId }),
      ...(isDoctor && specialties.length > 0 ? { specialties } : {}),
    };

    await executeApi(() => hrApi.employees.create(employeeRequest), {
      onSuccess: () => {
        toast.success(t("create.messages.createdSuccess"));
        navigate("/hr/employees");
      },
      errorMessage: t("create.messages.failedToCreate"),
    });
  };

  if (loadingOptions) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">{t("create.loading")}</div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <button
            onClick={() => navigate("/hr/employees")}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t("create.back")}</span>
          </button>
          <h1 className="text-3xl font-semibold">
            <span className="text-gray-400 font-normal">{t("create.title")}</span>
          </h1>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <form onSubmit={handleSubmit} noValidate className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-blue-800 mb-1">
                    {t("create.faceRegistration.title")}
                  </h3>
                  <p className="text-sm text-blue-700">
                    {t("create.faceRegistration.description")}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("create.form.employeeCode.label")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t("create.form.employeeCode.placeholder")}
                  aria-label={t("create.form.employeeCode.label")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("create.form.fullName.label")} <span className="text-red-500">{t("create.form.fullName.required")}</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t("create.form.fullName.placeholder")}
                  aria-label={t("create.form.fullName.label")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("create.form.email.label")} <span className="text-red-500">{t("create.form.email.required")}</span>
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t("create.form.email.placeholder")}
                  aria-label={t("create.form.email.label")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("create.form.phone.label")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t("create.form.phone.placeholder")}
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {t("create.form.assignment")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("create.form.role.label")} <span className="text-red-500">{t("create.form.role.required")}</span>
                  </label>
                  <select
                    value={roleId || ""}
                    onChange={(e) => {
                      const newRoleId = e.target.value ? Number(e.target.value) : null;
                      setRoleId(newRoleId);
                      // Reset specialties và clinicId dựa trên role
                      if (newRoleId) {
                        const selectedRole = roles.find(r => r.id === newRoleId);
                        const isDoctor = selectedRole?.roleName?.toUpperCase() === "DOCTOR" ||
                          selectedRole?.roleName?.toUpperCase() === "BÁC SĨ" ||
                          selectedRole?.roleName?.toLowerCase().includes("doctor") ||
                          selectedRole?.roleName?.toLowerCase().includes("bác sĩ");
                        if (isDoctor) {
                          setSpecialties([]);
                          setClinicId(null); // Bác sĩ không cần clinic
                        } else {
                          setSpecialties([]);
                          // Nhân viên khác có thể có clinic
                        }
                      } else {
                        setSpecialties([]);
                        setClinicId(null);
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27m6 8 4 4 4-4%27/%3E%3C/svg%3E')] bg-no-repeat bg-right-2.5 bg-[length:1.5em_1.5em] pr-10"
                    aria-label={t("create.form.role.label")}
                  >
                    <option value="">{t("create.form.role.placeholder")}</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.roleName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("create.form.department.label")} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={departmentId || ""}
                    onChange={(e) =>
                      setDepartmentId(
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27m6 8 4 4 4-4%27/%3E%3C/svg%3E')] bg-no-repeat bg-right-2.5 bg-[length:1.5em_1.5em] pr-10"
                    aria-label={t("create.form.department.label")}
                  >
                    <option value="">{t("create.form.department.placeholder")}</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.departmentName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Clinic field - chỉ hiển thị khi KHÔNG phải DOCTOR */}
                {roleId && (() => {
                  const selectedRole = roles.find(r => r.id === roleId);
                  const isDoctor = selectedRole?.roleName?.toUpperCase() === "DOCTOR" ||
                    selectedRole?.roleName?.toUpperCase() === "BÁC SĨ" ||
                    selectedRole?.roleName?.toLowerCase().includes("doctor") ||
                    selectedRole?.roleName?.toLowerCase().includes("bác sĩ");

                  if (isDoctor) return null; // Bác sĩ không hiển thị clinic

                  return (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t("create.form.clinic.label")} <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={clinicId || ""}
                        onChange={(e) =>
                          setClinicId(
                            e.target.value ? Number(e.target.value) : null
                          )
                        }
                        required
                        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27m6 8 4 4 4-4%27/%3E%3C/svg%3E')] bg-no-repeat bg-right-2.5 bg-[length:1.5em_1.5em] pr-10"
                        aria-label={t("create.form.clinic.label")}
                      >
                        <option value="">{t("create.form.clinic.placeholder")}</option>
                        {clinics.filter(c => c.isActive !== false).map((clinic) => (
                          <option key={clinic.id} value={clinic.id}>
                            {clinic.clinicName}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })()}

                {/* Specialty field - chỉ hiển thị khi chọn role DOCTOR */}
                {roleId && (() => {
                  const selectedRole = roles.find(r => r.id === roleId);
                  const isDoctor = selectedRole?.roleName?.toUpperCase() === "DOCTOR" ||
                    selectedRole?.roleName?.toUpperCase() === "BÁC SĨ" ||
                    selectedRole?.roleName?.toLowerCase().includes("doctor") ||
                    selectedRole?.roleName?.toLowerCase().includes("bác sĩ");

                  if (!isDoctor) return null;

                  const specialtyOptions = [
                    { value: "Preventive Care", label: t("specialties.preventiveCare") },
                    { value: "Dental Implants", label: t("specialties.dentalImplants") },
                    { value: "Orthodontics", label: t("specialties.orthodontics") },
                    { value: "Cosmetic Dentistry", label: t("specialties.cosmeticDentistry") },
                    { value: "Oral Surgery", label: t("specialties.oralSurgery") },
                    { value: "Pediatric Dentistry", label: t("specialties.pediatricDentistry") }
                  ];

                  const handleSpecialtyToggle = (specialtyName: string) => {
                    setSpecialties(prev => {
                      if (prev.includes(specialtyName)) {
                        // Xóa chuyên khoa nếu đã chọn
                        return prev.filter(s => s !== specialtyName);
                      } else {
                        // Thêm chuyên khoa mới
                        return [...prev, specialtyName];
                      }
                    });
                  };

                  const removeSpecialty = (specialtyName: string) => {
                    setSpecialties(prev => prev.filter(s => s !== specialtyName));
                  };

                  return (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t("create.form.specialty.label")} <span className="text-gray-500 text-xs">({t("create.form.specialty.optional")})</span>
                      </label>

                      {/* Multi-select dropdown */}
                      <div className="relative">
                        <select
                          value=""
                          onChange={(e) => {
                            const selected = e.target.value;
                            if (selected && !specialties.includes(selected)) {
                              setSpecialties([...specialties, selected]);
                            }
                            e.target.value = ""; // Reset dropdown
                          }}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27m6 8 4 4 4-4%27/%3E%3C/svg%3E')] bg-no-repeat bg-right-2.5 bg-[length:1.5em_1.5em] pr-10"
                          aria-label={t("create.form.specialty.label")}
                        >
                          <option value="">{t("create.form.specialty.placeholder")} - {t("create.form.specialty.selectToAdd")}</option>
                          {specialtyOptions
                            .filter(spec => !specialties.includes(spec.value))
                            .map((spec) => (
                              <option key={spec.value} value={spec.value}>
                                {spec.label}
                              </option>
                            ))}
                        </select>
                      </div>

                      {/* Hiển thị các chuyên khoa đã chọn dưới dạng tags */}
                      {specialties.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {specialties.map((spec) => (
                            <span
                              key={spec}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium"
                            >
                              {specialtyOptions.find(opt => opt.value === spec)?.label || spec}
                              <button
                                type="button"
                                onClick={() => removeSpecialty(spec)}
                                className="text-blue-600 hover:text-blue-800 focus:outline-none"
                                aria-label={t("create.form.specialty.removeSpecialty", { name: specialtyOptions.find(opt => opt.value === spec)?.label || spec })}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Checkbox list để chọn nhanh */}
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-xs font-medium text-gray-700 mb-2">{t("create.form.specialty.quickSelect")}</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {specialtyOptions.map((spec) => (
                            <label
                              key={spec.value}
                              className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded"
                            >
                              <input
                                type="checkbox"
                                checked={specialties.includes(spec.value)}
                                onChange={() => handleSpecialtyToggle(spec.value)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">{spec.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <p className="mt-2 text-xs text-gray-500">
                        {t("create.form.specialty.hint")} - {t("create.form.specialty.multipleSpecialtiesHint")}
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate("/hr/employees")}
                className="px-6 py-2 text-gray-700 border rounded-lg hover:bg-gray-100"
              >
                {t("create.form.cancel")}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                {loading ? t("create.form.creating") : t("create.form.create")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default CreateEmployeeForm;


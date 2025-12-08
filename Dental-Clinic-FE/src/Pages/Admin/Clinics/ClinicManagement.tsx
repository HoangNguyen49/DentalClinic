import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { Calendar, ChevronDown, ChevronUp } from "lucide-react";

// Định nghĩa kiểu dữ liệu cho phòng khám
type AdminClinic = {
  id: number;
  clinicCode?: string;
  clinicName: string;
  address?: string;
  phone?: string;
  email?: string;
  openingHours?: string;
  active: boolean;
  activeDoctorsCount?: number;
  activeEmployeesCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

// Định nghĩa kiểu dữ liệu cho nhân viên/bác sĩ
type StaffDetail = {
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  roleName: string;
  roleAtClinic: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  isDoctor: boolean;
};

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";

function ClinicManagement() {
  const { t } = useTranslation("admin");
  const [clinics, setClinics] = useState<AdminClinic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [selectedClinicId, setSelectedClinicId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [staffDetails, setStaffDetails] = useState<StaffDetail[]>([]);
  const [loadingStaff, setLoadingStaff] = useState<boolean>(false);
  const [expandedClinic, setExpandedClinic] = useState<number | null>(null);

  const accessToken = localStorage.getItem("accessToken");

  // Lấy danh sách phòng khám
  const fetchClinics = async () => {
    if (!accessToken) {
      toast.error(t("messages.noAccessToken", { defaultValue: "Missing access token" }));
      return;
    }
    try {
      setLoading(true);
      const response = await axios.get<AdminClinic[]>(`${apiBase}/api/admin/clinics`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setClinics(response.data || []);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t("messages.loadClinicsFailed", { defaultValue: "Unable to load clinics" });
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  // Lấy danh sách nhân viên theo phòng khám và ngày
  const fetchStaffDetails = async (clinicId: number, date?: string) => {
    if (!accessToken) {
      toast.error(t("messages.noAccessToken", { defaultValue: "Missing access token" }));
      return;
    }
    try {
      setLoadingStaff(true);
      const url = `${apiBase}/api/admin/clinics/${clinicId}/staff${date ? `?date=${date}` : ""}`;
      const response = await axios.get<StaffDetail[]>(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setStaffDetails(response.data || []);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t("messages.loadStaffFailed", { defaultValue: "Unable to load staff details" });
      toast.error(message);
      setStaffDetails([]);
    } finally {
      setLoadingStaff(false);
    }
  };

  // Xem chi tiết nhân viên của phòng khám
  const handleViewDetails = (clinicId: number) => {
    if (expandedClinic === clinicId) {
      setExpandedClinic(null);
      setStaffDetails([]);
    } else {
      setExpandedClinic(clinicId);
      setSelectedClinicId(clinicId);
      fetchStaffDetails(clinicId, selectedDate);
    }
  };

  // Khi thay đổi ngày xem nhân sự
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    if (selectedClinicId) {
      fetchStaffDetails(selectedClinicId, date);
    }
  };

  // Bật/tắt trạng thái hoạt động của phòng khám
  const toggleClinic = async (clinic: AdminClinic) => {
    if (!accessToken) {
      toast.error(t("messages.noAccessToken", { defaultValue: "Missing access token" }));
      return;
    }
    try {
      setUpdatingId(clinic.id);
      await axios.patch(
        `${apiBase}/api/admin/clinics/${clinic.id}/activation`,
        { active: !clinic.active },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      setClinics((prev) =>
        prev.map((item) =>
          item.id === clinic.id
            ? {
                ...item,
                active: !clinic.active,
              }
            : item
        )
      );
      toast.success(
        !clinic.active
          ? t("messages.clinicActivated", { defaultValue: "Clinic activated" })
          : t("messages.clinicDeactivated", { defaultValue: "Clinic deactivated" })
      );
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t("messages.updateClinicFailed", { defaultValue: "Unable to update clinic" });
      toast.error(message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900">{t("pageTitles.clinicManagement")}</h1>
        <p className="text-sm text-gray-600">
          {t("pageDescriptions.clinicManagement", {
            defaultValue:
              "View and control the activity status of each clinic. Clinics marked as inactive will be hidden from scheduling.",
          })}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            {t("tableHeaders.clinicList", { defaultValue: "Clinic List" })}
          </h2>
          <button
            onClick={fetchClinics}
            className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition"
          >
            {t("actions.refresh", { defaultValue: "Refresh" })}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t("tableHeaders.clinicCode", { defaultValue: "Code" })}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t("tableHeaders.clinicName", { defaultValue: "Clinic" })}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t("tableHeaders.address", { defaultValue: "Address" })}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t("tableHeaders.contact", { defaultValue: "Contact" })}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t("tableHeaders.openingHours", { defaultValue: "Opening Hours" })}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t("tableHeaders.status", { defaultValue: "Status" })}
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t("tableHeaders.actions", { defaultValue: "Actions" })}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                    {t("messages.loading", { defaultValue: "Loading clinics..." })}
                  </td>
                </tr>
              ) : clinics.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                    {t("messages.noClinics", { defaultValue: "No clinics found" })}
                  </td>
                </tr>
              ) : (
                clinics.map((clinic) => (
                  <tr key={clinic.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm text-gray-700">{clinic.clinicCode || "—"}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{clinic.clinicName}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="max-w-xs truncate">{clinic.address || "—"}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="flex flex-col">
                        <span>{clinic.phone || "—"}</span>
                        <span className="text-xs text-gray-500">{clinic.email || ""}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{clinic.openingHours || "—"}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          clinic.active
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "bg-red-100 text-red-700 border border-red-200"
                        }`}
                      >
                        {clinic.active
                          ? t("status.active", { defaultValue: "Active" })
                          : t("status.inactive", { defaultValue: "Inactive" })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <button
                        onClick={() => toggleClinic(clinic)}
                        disabled={updatingId === clinic.id}
                        className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded border transition ${
                          clinic.active
                            ? "text-red-600 border-red-200 hover:bg-red-50 disabled:bg-red-50 disabled:text-red-300"
                            : "text-green-600 border-green-200 hover:bg-green-50 disabled:bg-green-50 disabled:text-green-300"
                        }`}
                      >
                        {updatingId === clinic.id
                          ? t("actions.updating", { defaultValue: "Updating..." })
                          : clinic.active
                          ? t("actions.setInactive", { defaultValue: "Set inactive" })
                          : t("actions.setActive", { defaultValue: "Set active" })}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Phần thống kê nhân sự các phòng khám */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">
            {t("tableHeaders.staffStatistics", { defaultValue: "Thống kê nhân sự theo cơ sở" })}
          </h2>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Select date to view staff statistics"
              title="Select date to view staff statistics"
            />
          </div>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center text-gray-500 py-8">
              {t("messages.loading", { defaultValue: "Loading..." })}
            </div>
          ) : clinics.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {t("messages.noClinics", { defaultValue: "No clinics found" })}
            </div>
          ) : (
            <div className="space-y-4">
              {clinics.map((clinic) => (
                <div
                  key={clinic.id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <div
                    className="p-4 hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => handleViewDetails(clinic.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900 mb-3">
                          {clinic.clinicName}
                        </h3>
                        <div className="flex gap-6">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                              {t("tableHeaders.activeDoctors", { defaultValue: "Bác sĩ" })}:
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                              {clinic.activeDoctorsCount ?? 0}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                              {t("tableHeaders.activeEmployees", { defaultValue: "Nhân viên" })}:
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                              {clinic.activeEmployeesCount ?? 0}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        {expandedClinic === clinic.id ? (
                          <ChevronUp className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                    </div>
                  </div>

                  {expandedClinic === clinic.id && (
                    <div className="border-t border-gray-200 bg-gray-50 p-4">
                      {loadingStaff ? (
                        <div className="text-center text-gray-500 py-4">
                          {t("messages.loading", { defaultValue: "Loading details..." })}
                        </div>
                      ) : staffDetails.length === 0 ? (
                        <div className="text-center text-gray-500 py-4">
                          {t("messages.noStaff", { defaultValue: "No staff found for this date" })}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="mb-4">
                            {/* Danh sách bác sĩ */}
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">
                              {t("tableHeaders.doctors", { defaultValue: "Bác sĩ" })}
                            </h4>
                            <div className="space-y-2">
                              {staffDetails
                                .filter((staff) => staff.isDoctor)
                                .map((staff) => (
                                  <div
                                    key={staff.userId}
                                    className="bg-white p-3 rounded border border-gray-200"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <p className="font-medium text-gray-900">{staff.fullName}</p>
                                        <p className="text-sm text-gray-600">{staff.email}</p>
                                        <p className="text-sm text-gray-600">{staff.phone}</p>
                                        <div className="mt-1 flex gap-2">
                                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                            {staff.roleName}
                                          </span>
                                          {staff.roleAtClinic && (
                                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                                              {staff.roleAtClinic}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>

                          <div>
                            {/* Danh sách nhân viên */}
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">
                              {t("tableHeaders.employees", { defaultValue: "Nhân viên" })}
                            </h4>
                            <div className="space-y-2">
                              {staffDetails
                                .filter((staff) => !staff.isDoctor)
                                .map((staff) => (
                                  <div
                                    key={staff.userId}
                                    className="bg-white p-3 rounded border border-gray-200"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <p className="font-medium text-gray-900">{staff.fullName}</p>
                                        <p className="text-sm text-gray-600">{staff.email}</p>
                                        <p className="text-sm text-gray-600">{staff.phone}</p>
                                        <div className="mt-1 flex gap-2">
                                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                            {staff.roleName}
                                          </span>
                                          {staff.roleAtClinic && (
                                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                                              {staff.roleAtClinic}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClinicManagement;

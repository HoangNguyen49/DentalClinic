import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";

type AdminClinic = {
  id: number;
  clinicCode?: string;
  clinicName: string;
  address?: string;
  phone?: string;
  email?: string;
  openingHours?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";

function ClinicManagement() {
  const { t } = useTranslation("admin");
  const [clinics, setClinics] = useState<AdminClinic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const accessToken = localStorage.getItem("accessToken");

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    </div>
  );
}

export default ClinicManagement;


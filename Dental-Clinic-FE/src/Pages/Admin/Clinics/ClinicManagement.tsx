import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { adminApi, type AdminClinic } from "../../../services/admin/adminApi";
import { useAdminApi } from "../../../hooks/useAdminApi";
import { RefreshCw, Edit2, Power, Save, X } from "lucide-react";
import { toast } from "react-toastify";

function ClinicManagement() {
  const { t } = useTranslation("admin");
  const [clinics, setClinics] = useState<AdminClinic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<AdminClinic>>({});
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const { execute } = useAdminApi<AdminClinic[]>();

  // Lấy danh sách phòng khám từ server
  const fetchClinics = async () => {
    setLoading(true);
    await execute(
      () => adminApi.clinics.getAll(),
      {
        showErrorToast: true,
        errorMessage: t("messages.loadClinicsFailed", { defaultValue: "Unable to load clinics" }),
        onSuccess: (data) => {
          setClinics(data || []);
        },
      }
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchClinics();
  }, []);

  // Bắt đầu chỉnh sửa
  const startEdit = (clinic: AdminClinic) => {
    setEditingId(clinic.id);
    setEditForm({
      clinicCode: clinic.clinicCode || "",
      clinicName: clinic.clinicName || "",
      address: clinic.address || "",
      phone: clinic.phone || "",
      email: clinic.email || "",
      openingHours: clinic.openingHours || "",
    });
  };

  // Hủy chỉnh sửa
  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  // Lưu thay đổi
  const saveEdit = async (clinicId: number) => {
    if (!editForm.clinicCode || !editForm.clinicName) {
      toast.error(t("messages.fillRequired", { defaultValue: "Please fill required fields" }));
      return;
    }

    setUpdatingId(clinicId);
    try {
      await adminApi.clinics.update(clinicId, {
        clinicCode: editForm.clinicCode,
        clinicName: editForm.clinicName,
        address: editForm.address,
        phone: editForm.phone,
        email: editForm.email,
        openingHours: editForm.openingHours,
      });
      toast.success(t("messages.updateSuccess", { defaultValue: "Updated successfully" }));
      setEditingId(null);
      setEditForm({});
      fetchClinics();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          t("messages.updateFailed", { defaultValue: "Update failed" })
      );
    } finally {
      setUpdatingId(null);
    }
  };

  // Toggle activation status
  const toggleActivation = async (clinic: AdminClinic) => {
    setUpdatingId(clinic.id);
    try {
      await adminApi.clinics.updateActivation(clinic.id, !clinic.active);
      toast.success(
        t("messages.updateSuccess", { defaultValue: "Updated successfully" })
      );
      fetchClinics();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          t("messages.updateFailed", { defaultValue: "Update failed" })
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            {t("pageTitles.clinicManagement", { defaultValue: "Clinic Management" })}
          </h1>
          <button
            onClick={fetchClinics}
            className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {t("actions.refresh", { defaultValue: "Refresh" })}
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            {t("pageDescriptions.clinicManagement", {
              defaultValue:
                "View and control the activity status of each clinic. Clinics marked as inactive will not appear in scheduling.",
            })}
          </p>

          {loading ? (
            <div className="text-center py-8 text-gray-500">
              {t("messages.loading", { defaultValue: "Loading..." })}
            </div>
          ) : clinics.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {t("messages.noClinics", { defaultValue: "No clinics found" })}
            </div>
          ) : (
            <div className="space-y-4">
              {clinics.map((clinic) => (
                <div
                  key={clinic.id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  {editingId === clinic.id ? (
                    // Edit mode
                    <div className="bg-white p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t("tableHeaders.clinicCode", { defaultValue: "Clinic Code" })} *
                          </label>
                          <input
                            type="text"
                            value={editForm.clinicCode || ""}
                            onChange={(e) =>
                              setEditForm({ ...editForm, clinicCode: e.target.value })
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label={t("tableHeaders.clinicCode", { defaultValue: "Clinic Code" })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t("tableHeaders.clinicName", { defaultValue: "Clinic Name" })} *
                          </label>
                          <input
                            type="text"
                            value={editForm.clinicName || ""}
                            onChange={(e) =>
                              setEditForm({ ...editForm, clinicName: e.target.value })
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label={t("tableHeaders.clinicName", { defaultValue: "Clinic Name" })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t("tableHeaders.address", { defaultValue: "Address" })}
                          </label>
                          <input
                            type="text"
                            value={editForm.address || ""}
                            onChange={(e) =>
                              setEditForm({ ...editForm, address: e.target.value })
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label={t("tableHeaders.address", { defaultValue: "Address" })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t("tableHeaders.phone", { defaultValue: "Phone" })}
                          </label>
                          <input
                            type="text"
                            value={editForm.phone || ""}
                            onChange={(e) =>
                              setEditForm({ ...editForm, phone: e.target.value })
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label={t("tableHeaders.phone", { defaultValue: "Phone" })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t("tableHeaders.email", { defaultValue: "Email" })}
                          </label>
                          <input
                            type="email"
                            value={editForm.email || ""}
                            onChange={(e) =>
                              setEditForm({ ...editForm, email: e.target.value })
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label={t("tableHeaders.email", { defaultValue: "Email" })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t("tableHeaders.openingHours", { defaultValue: "Opening Hours" })}
                          </label>
                          <input
                            type="text"
                            value={editForm.openingHours || ""}
                            onChange={(e) =>
                              setEditForm({ ...editForm, openingHours: e.target.value })
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label={t("tableHeaders.openingHours", { defaultValue: "Opening Hours" })}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <button
                          onClick={cancelEdit}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          {t("actions.cancel", { defaultValue: "Cancel" })}
                        </button>
                        <button
                          onClick={() => saveEdit(clinic.id)}
                          disabled={updatingId === clinic.id}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          {updatingId === clinic.id
                            ? t("messages.saving", { defaultValue: "Saving..." })
                            : t("actions.save", { defaultValue: "Save" })}
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="bg-white p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {clinic.clinicName}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">
                                {t("tableHeaders.clinicCode", { defaultValue: "Code" })}:
                              </span>{" "}
                              {clinic.clinicCode || "—"}
                            </div>
                            <div>
                              <span className="font-medium">
                                {t("tableHeaders.address", { defaultValue: "Address" })}:
                              </span>{" "}
                              {clinic.address || "—"}
                            </div>
                            <div>
                              <span className="font-medium">
                                {t("tableHeaders.phone", { defaultValue: "Phone" })}:
                              </span>{" "}
                              {clinic.phone || "—"}
                            </div>
                            <div>
                              <span className="font-medium">
                                {t("tableHeaders.email", { defaultValue: "Email" })}:
                              </span>{" "}
                              {clinic.email || "—"}
                            </div>
                            <div className="md:col-span-2">
                              <span className="font-medium">
                                {t("tableHeaders.openingHours", { defaultValue: "Opening Hours" })}:
                              </span>{" "}
                              {clinic.openingHours || "—"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => startEdit(clinic)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title={t("actions.edit", { defaultValue: "Edit" })}
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => toggleActivation(clinic)}
                            disabled={updatingId === clinic.id}
                            className={`p-2 rounded-lg transition ${
                              clinic.active
                                ? "text-green-600 hover:bg-green-50"
                                : "text-gray-400 hover:bg-gray-50"
                            } disabled:opacity-50`}
                            title={
                              clinic.active
                                ? t("actions.deactivate", { defaultValue: "Deactivate" })
                                : t("actions.activate", { defaultValue: "Activate" })
                            }
                          >
                            <Power className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            clinic.active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {clinic.active
                            ? t("status.active", { defaultValue: "Active" })
                            : t("status.inactive", { defaultValue: "Inactive" })}
                        </span>
                      </div>
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

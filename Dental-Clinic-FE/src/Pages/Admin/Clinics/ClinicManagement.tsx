import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { adminApi, type AdminClinic } from "../../../services/admin/adminApi";
import { useAdminApi } from "../../../hooks/useAdminApi";
import { RefreshCw, Edit2, Power, Save, X, Building2, MapPin, Phone, Mail, Clock } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <section className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl shadow-lg ring-4 ring-teal-100">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            {t("pageTitles.clinicManagement", { defaultValue: "Clinic Management" })}
          </h1>
              <p className="text-sm text-gray-600 font-medium mt-1">
                {t("pageDescriptions.clinicManagement", { defaultValue: "Manage clinic locations and settings" })}
              </p>
            </div>
          </div>
          <button
            onClick={fetchClinics}
            className="px-6 py-3 text-base font-medium bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 flex items-center gap-2 shadow-md"
          >
            <RefreshCw className="w-5 h-5" />
            {t("actions.refresh", { defaultValue: "Refresh" })}
          </button>
        </section>

          {loading ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center gap-3 text-slate-600">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
              <span className="text-lg font-medium">{t("messages.loading", { defaultValue: "Loading..." })}</span>
            </div>
            </div>
          ) : clinics.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-lg">
              {t("messages.noClinics", { defaultValue: "No clinics found" })}
            </div>
          ) : (
          <div className="grid grid-cols-1 gap-6">
              {clinics.map((clinic) => (
                <div
                  key={clinic.id}
                className="relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-sm border border-slate-200/60 shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                  {editingId === clinic.id ? (
                    // Edit mode
                  <div className="bg-gradient-to-br from-white to-slate-50 p-6">
                    <div className="mb-4 pb-4 border-b border-slate-200">
                      <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Edit2 className="w-5 h-5 text-teal-600" />
                        Edit Clinic Information
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                            {t("tableHeaders.clinicCode", { defaultValue: "Clinic Code" })} *
                          </label>
                          <input
                            type="text"
                            value={editForm.clinicCode || ""}
                            onChange={(e) =>
                              setEditForm({ ...editForm, clinicCode: e.target.value })
                            }
                          className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-4 focus:ring-teal-100 focus:border-teal-500 transition-all bg-white"
                            aria-label={t("tableHeaders.clinicCode", { defaultValue: "Clinic Code" })}
                          />
                        </div>
                        <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                            {t("tableHeaders.clinicName", { defaultValue: "Clinic Name" })} *
                          </label>
                          <input
                            type="text"
                            value={editForm.clinicName || ""}
                            onChange={(e) =>
                              setEditForm({ ...editForm, clinicName: e.target.value })
                            }
                          className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-4 focus:ring-teal-100 focus:border-teal-500 transition-all bg-white"
                            aria-label={t("tableHeaders.clinicName", { defaultValue: "Clinic Name" })}
                          />
                        </div>
                        <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                            {t("tableHeaders.address", { defaultValue: "Address" })}
                          </label>
                          <input
                            type="text"
                            value={editForm.address || ""}
                            onChange={(e) =>
                              setEditForm({ ...editForm, address: e.target.value })
                            }
                          className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-4 focus:ring-teal-100 focus:border-teal-500 transition-all bg-white"
                            aria-label={t("tableHeaders.address", { defaultValue: "Address" })}
                          />
                        </div>
                        <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                            {t("tableHeaders.phone", { defaultValue: "Phone" })}
                          </label>
                          <input
                            type="text"
                            value={editForm.phone || ""}
                            onChange={(e) =>
                              setEditForm({ ...editForm, phone: e.target.value })
                            }
                          className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-4 focus:ring-teal-100 focus:border-teal-500 transition-all bg-white"
                            aria-label={t("tableHeaders.phone", { defaultValue: "Phone" })}
                          />
                        </div>
                        <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                            {t("tableHeaders.email", { defaultValue: "Email" })}
                          </label>
                          <input
                            type="email"
                            value={editForm.email || ""}
                            onChange={(e) =>
                              setEditForm({ ...editForm, email: e.target.value })
                            }
                          className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-4 focus:ring-teal-100 focus:border-teal-500 transition-all bg-white"
                            aria-label={t("tableHeaders.email", { defaultValue: "Email" })}
                          />
                        </div>
                        <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                            {t("tableHeaders.openingHours", { defaultValue: "Opening Hours" })}
                          </label>
                          <input
                            type="text"
                            value={editForm.openingHours || ""}
                            onChange={(e) =>
                              setEditForm({ ...editForm, openingHours: e.target.value })
                            }
                          className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-4 focus:ring-teal-100 focus:border-teal-500 transition-all bg-white"
                            aria-label={t("tableHeaders.openingHours", { defaultValue: "Opening Hours" })}
                          />
                        </div>
                      </div>
                    <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200">
                        <button
                          onClick={cancelEdit}
                        className="px-6 py-3 text-base font-medium text-slate-700 bg-white border-2 border-slate-300 rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2"
                        >
                        <X className="w-5 h-5" />
                          {t("actions.cancel", { defaultValue: "Cancel" })}
                        </button>
                        <button
                          onClick={() => saveEdit(clinic.id)}
                          disabled={updatingId === clinic.id}
                        className="px-6 py-3 text-base font-bold text-white bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 shadow-md"
                        >
                        <Save className="w-5 h-5" />
                          {updatingId === clinic.id
                            ? t("messages.saving", { defaultValue: "Saving..." })
                            : t("actions.save", { defaultValue: "Save" })}
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                  <div className="bg-gradient-to-br from-white via-slate-50 to-white p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl shadow-lg ring-4 ring-teal-100">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-slate-900 mb-1">
                            {clinic.clinicName}
                          </h3>
                          <p className="text-sm text-slate-500 font-medium">
                            Code: {clinic.clinicCode || "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-bold shadow-lg ${
                            clinic.active
                              ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-200/50"
                              : "bg-gradient-to-r from-slate-500 to-gray-600 text-white shadow-slate-200/50"
                          }`}
                        >
                          {clinic.active
                            ? t("status.active", { defaultValue: "Active" })
                            : t("status.inactive", { defaultValue: "Inactive" })}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <MapPin className="w-4 h-4 text-purple-600" />
                        </div>
                            <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Address</p>
                          <p className="text-sm text-slate-900 mt-0.5">{clinic.address || "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Phone className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone</p>
                          <p className="text-sm text-slate-900 mt-0.5">{clinic.phone || "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200">
                        <div className="p-2 bg-pink-100 rounded-lg">
                          <Mail className="w-4 h-4 text-pink-600" />
                            </div>
                            <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email</p>
                          <p className="text-sm text-slate-900 mt-0.5">{clinic.email || "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Clock className="w-4 h-4 text-orange-600" />
                            </div>
                            <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Opening Hours</p>
                          <p className="text-sm text-slate-900 mt-0.5">{clinic.openingHours || "—"}</p>
                            </div>
                          </div>
                        </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                          <button
                            onClick={() => startEdit(clinic)}
                        className="px-5 py-2.5 text-sm font-medium text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-xl transition-all flex items-center gap-2"
                            title={t("actions.edit", { defaultValue: "Edit" })}
                          >
                        <Edit2 className="w-4 h-4" />
                        {t("actions.edit", { defaultValue: "Edit" })}
                          </button>
                          <button
                            onClick={() => toggleActivation(clinic)}
                            disabled={updatingId === clinic.id}
                        className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center gap-2 shadow-md disabled:opacity-50 ${
                              clinic.active
                            ? "bg-gradient-to-r from-red-500 to-rose-600 text-white hover:shadow-lg shadow-red-200/50"
                            : "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg shadow-green-200/50"
                        }`}
                            title={
                              clinic.active
                                ? t("actions.deactivate", { defaultValue: "Deactivate" })
                                : t("actions.activate", { defaultValue: "Activate" })
                            }
                          >
                        <Power className="w-4 h-4" />
                        {clinic.active
                          ? t("actions.deactivate", { defaultValue: "Deactivate" })
                          : t("actions.activate", { defaultValue: "Activate" })}
                          </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}

export default ClinicManagement;

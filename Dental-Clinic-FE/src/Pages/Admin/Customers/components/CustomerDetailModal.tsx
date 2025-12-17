import { X, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { type AdminCustomer } from "../../../../services/admin/adminApi";
import { formatDate } from "../../../../utils/adminUtils";

interface CustomerDetailModalProps {
  customer: AdminCustomer;
  onClose: () => void;
}

export default function CustomerDetailModal({ customer, onClose }: CustomerDetailModalProps) {
  const { t } = useTranslation("admin");

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">
                {t("customers.detail.title", "Customer Details")}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white/20 rounded-xl transition-all"
              aria-label="Close modal"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
              <label className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2 block">
                {t("customers.detail.fullName", "Full Name")}
              </label>
              <p className="text-slate-900 font-bold text-lg">{customer.fullName}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
              <label className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-2 block">
                {t("customers.detail.patientCode", "Patient Code")}
              </label>
              <p className="text-slate-900 font-bold text-lg">{customer.patientCode || "-"}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
              <label className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2 block">
                {t("customers.detail.gender", "Gender")}
              </label>
              <p className="text-slate-900 font-bold text-lg">{customer.gender || "-"}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-100">
              <label className="text-xs font-bold text-orange-700 uppercase tracking-wider mb-2 block">
                {t("customers.detail.dateOfBirth", "Date of Birth")}
              </label>
              <p className="text-slate-900 font-bold text-lg">
                {customer.dateOfBirth ? formatDate(customer.dateOfBirth) : "-"}
              </p>
            </div>
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-4 rounded-xl border border-cyan-100">
              <label className="text-xs font-bold text-cyan-700 uppercase tracking-wider mb-2 block">
                {t("customers.detail.phone", "Phone Number")}
              </label>
              <p className="text-slate-900 font-bold text-lg">{customer.phone || "-"}</p>
            </div>
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-4 rounded-xl border border-pink-100">
              <label className="text-xs font-bold text-pink-700 uppercase tracking-wider mb-2 block">
                {t("customers.detail.email", "Email")}
              </label>
              <p className="text-slate-900 font-bold text-lg">{customer.email || "-"}</p>
            </div>
            <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-slate-50 to-gray-50 p-4 rounded-xl border border-slate-200">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">
                {t("customers.detail.address", "Address")}
              </label>
              <p className="text-slate-900 font-medium">{customer.address || "-"}</p>
            </div>
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 p-4 rounded-xl border border-teal-100">
              <label className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-2 block">
                {t("customers.detail.status", "Status")}
              </label>
              <span
                className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold shadow-md ${
                  customer.isActive
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-200/50"
                    : "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-red-200/50"
                }`}
              >
                {customer.isActive
                  ? t("customers.table.active", "Active")
                  : t("customers.table.inactive", "Inactive")}
              </span>
            </div>
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 p-4 rounded-xl border border-violet-100">
              <label className="text-xs font-bold text-violet-700 uppercase tracking-wider mb-2 block">
                {t("customers.detail.userId", "Account ID")}
              </label>
              <p className="text-slate-900 font-bold text-lg">
                {customer.userId ? customer.userId : t("customers.detail.noAccount", "None")}
              </p>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-xl border border-indigo-100">
              <label className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2 block">
                {t("customers.detail.createdAt", "Created")}
              </label>
              <p className="text-slate-900 font-medium">{formatDate(customer.createdAt)}</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-4 rounded-xl border border-amber-100">
              <label className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 block">
                {t("customers.detail.updatedAt", "Last Updated")}
              </label>
              <p className="text-slate-900 font-medium">{formatDate(customer.updatedAt)}</p>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium text-base"
            >
              {t("customers.actions.close", "Close")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


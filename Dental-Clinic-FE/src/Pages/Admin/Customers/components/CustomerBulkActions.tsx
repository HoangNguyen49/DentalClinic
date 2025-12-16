import { CheckCircle, UserCheck, UserX, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CustomerBulkActionsProps {
  selectedCount: number;
  onActivate: () => void;
  onDeactivate: () => void;
  onClear: () => void;
}

export default function CustomerBulkActions({
  selectedCount,
  onActivate,
  onDeactivate,
  onClear,
}: CustomerBulkActionsProps) {
  const { t } = useTranslation("admin");

  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
      <span className="text-sm font-bold text-blue-900 flex items-center gap-2">
        <CheckCircle className="w-5 h-5 text-blue-600" />
        {t("customers.bulkActions.selected", "Selected")} {selectedCount}{" "}
        {selectedCount > 1
          ? t("customers.bulkActions.customersPlural", "customers")
          : t("customers.bulkActions.customers", "customer")}
      </span>
      <div className="flex gap-3">
        <button
          onClick={onActivate}
          className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-bold rounded-xl hover:shadow-lg transition-all shadow-md flex items-center gap-2"
        >
          <UserCheck className="w-4 h-4" />
          {t("customers.actions.activate", "Activate")}
        </button>
        <button
          onClick={onDeactivate}
          className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-bold rounded-xl hover:shadow-lg transition-all shadow-md flex items-center gap-2"
        >
          <UserX className="w-4 h-4" />
          {t("customers.actions.deactivate", "Deactivate")}
        </button>
        <button
          onClick={onClear}
          className="px-5 py-2.5 border-2 border-slate-300 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2"
        >
          <XCircle className="w-4 h-4" />
          {t("customers.actions.clear", "Clear")}
        </button>
      </div>
    </div>
  );
}


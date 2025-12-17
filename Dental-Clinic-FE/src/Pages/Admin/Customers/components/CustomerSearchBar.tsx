import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CustomerSearchBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
}

export default function CustomerSearchBar({
  search,
  onSearchChange,
  onSearch,
  onClear,
}: CustomerSearchBarProps) {
  const { t } = useTranslation("admin");

  return (
    <section className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/60 p-6 space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex-1 group">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            {t("customers.filters.search", "Search")}
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSearch();
              }}
              placeholder={t(
                "customers.filters.searchPlaceholder",
                "Search by name, patient code, phone or email..."
              )}
              className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-base bg-gradient-to-br from-white to-slate-50"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onSearch}
            className="px-6 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-bold text-base shadow-md flex items-center gap-2"
          >
            <Search className="w-5 h-5" />
            {t("customers.actions.search", "Search")}
          </button>
          <button
            onClick={onClear}
            className="px-6 py-3.5 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium text-base flex items-center gap-2"
          >
            <X className="w-5 h-5" />
            {t("customers.actions.clear", "Clear")}
          </button>
        </div>
      </div>
    </section>
  );
}


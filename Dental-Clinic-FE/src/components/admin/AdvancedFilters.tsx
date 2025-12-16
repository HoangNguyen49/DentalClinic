import { useState, useEffect, useRef } from "react";
import { Filter, X, ChevronDown, Check } from "lucide-react";
import { useTranslation } from "react-i18next";

// Kiểu option bộ lọc
export interface FilterOption {
  key: string;
  label: string;
  type: "select" | "text" | "date" | "boolean";
  options?: { value: string; label: string }[];
}

interface AdvancedFiltersProps {
  filters: FilterOption[];
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  onReset?: () => void;
}

export default function AdvancedFilters({
  filters,
  values,
  onChange,
  onReset,
}: AdvancedFiltersProps) {
  const { t } = useTranslation("admin");
  const [isOpen, setIsOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  // Lưu giá trị bộ lọc tạm thời khi chỉnh sửa popup
  const [localValues, setLocalValues] = useState<Record<string, any>>(values);

  // Sync localValues với values khi values thay đổi từ bên ngoài
  useEffect(() => {
    setLocalValues(values);
  }, [values]);

  // Tính toán vị trí popup dựa trên vị trí button
  useEffect(() => {
    if (isOpen && buttonRef.current && popupRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const popup = popupRef.current;
      
      // Đặt popup ngay dưới button, căn phải
      popup.style.position = 'fixed';
      popup.style.top = `${buttonRect.bottom + 8}px`;
      popup.style.right = `${window.innerWidth - buttonRect.right}px`;
      popup.style.left = 'auto';
      
      // Nếu popup bị tràn màn hình, điều chỉnh
      const popupRect = popup.getBoundingClientRect();
      if (popupRect.right > window.innerWidth) {
        popup.style.right = '16px';
      }
      if (popupRect.bottom > window.innerHeight) {
        popup.style.top = `${buttonRect.top - popupRect.height - 8}px`;
      }
    }
  }, [isOpen]);

  // Đếm số bộ lọc đang được áp dụng (không ở trạng thái all/rỗng)
  const activeFiltersCount = Object.values(values).filter(
    (v) => v !== null && v !== undefined && v !== "" && v !== "all"
  ).length;

  // Áp dụng bộ lọc khi bấm nút Áp dụng
  const handleApply = () => {
    onChange(localValues);
    setIsOpen(false);
  };

  // Đặt lại giá trị lọc về mặc định
  const handleReset = () => {
    const resetValues: Record<string, any> = {};
    filters.forEach((f) => {
      resetValues[f.key] = f.type === "boolean" ? null : f.type === "select" ? "all" : "";
    });
    setLocalValues(resetValues);
    onChange(resetValues);
    if (onReset) {
      onReset();
    }
    setIsOpen(false);
  };

  // Cập nhật local value khi người dùng chỉnh sửa input/select
  const updateLocalValue = (key: string, value: any) => {
    setLocalValues((prev) => ({ ...prev, [key]: value }));
  };

  // Đóng popup khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        const button = (event.target as HTMLElement).closest('button');
        if (!button || !button.querySelector('svg[class*="Filter"]')) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  return (
    <div className="relative">
      {/* Nút mở popup bộ lọc */}
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`flex items-center gap-2.5 px-6 py-3.5 rounded-xl transition-all duration-200 font-semibold text-sm shadow-sm ${
          activeFiltersCount > 0
            ? "bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 scale-105"
            : "border-2 border-slate-300 text-slate-700 bg-white hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 hover:border-blue-400 hover:shadow-md"
        }`}
      >
        <Filter className={`w-5 h-5 ${activeFiltersCount > 0 ? "text-white" : "text-slate-600"}`} />
        <span>{t("common.filters", "Filters")}</span>
        {activeFiltersCount > 0 && (
          <span className="bg-white/25 backdrop-blur-md text-white text-xs font-extrabold px-2.5 py-0.5 rounded-full border border-white/40 shadow-sm">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Overlay nền xám khi mở popup */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998] animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />
          {/* Popup bộ lọc nâng cao */}
          <div 
            ref={popupRef}
            className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-2xl z-[9999] min-w-[380px] max-w-md flex flex-col animate-in fade-in slide-in-from-top-2 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30">
                  <Filter className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {t("common.advancedFilters", "Advanced Filters")}
                  </h3>
                  {activeFiltersCount > 0 && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {activeFiltersCount} {activeFiltersCount === 1 ? 'filter' : 'filters'} active
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all duration-200 hover:scale-110"
                aria-label={t("common.closeFilters", "Close filters")}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Danh sách option bộ lọc - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-5">
                {filters.map((filter) => {
                  const hasValue = localValues[filter.key] && localValues[filter.key] !== "all" && localValues[filter.key] !== "";
                  return (
                    <div key={filter.key} className="space-y-2.5 group">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                        {filter.label}
                        {hasValue && (
                          <span className="ml-auto text-xs font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                      </label>
                      {filter.type === "select" && (
                        <div className="relative">
                          <select
                            value={localValues[filter.key] || "all"}
                            onChange={(e) => updateLocalValue(filter.key, e.target.value)}
                            className="w-full appearance-none border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gradient-to-br from-white to-slate-50/50 hover:border-blue-300 hover:from-white hover:to-blue-50/30 cursor-pointer font-medium text-slate-700"
                            aria-label={filter.label}
                          >
                            <option value="all">{t("common.all", "All")}</option>
                            {filter.options?.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      )}
                      {filter.type === "text" && (
                        <input
                          type="text"
                          value={localValues[filter.key] || ""}
                          onChange={(e) => updateLocalValue(filter.key, e.target.value)}
                          placeholder={t("common.enterFilter", "Enter {{label}}...", { label: filter.label.toLowerCase() })}
                          className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gradient-to-br from-white to-slate-50/50 hover:border-blue-300 hover:from-white hover:to-blue-50/30 placeholder:text-slate-400"
                          aria-label={filter.label}
                        />
                      )}
                      {filter.type === "date" && (
                        <input
                          type="date"
                          value={localValues[filter.key] || ""}
                          onChange={(e) => updateLocalValue(filter.key, e.target.value)}
                          className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gradient-to-br from-white to-slate-50/50 hover:border-blue-300 hover:from-white hover:to-blue-50/30 text-slate-700"
                          aria-label={filter.label}
                        />
                      )}
                      {filter.type === "boolean" && (
                        <div className="relative">
                          <select
                            value={localValues[filter.key] === null ? "all" : localValues[filter.key] ? "true" : "false"}
                            onChange={(e) => {
                              const val = e.target.value === "all" ? null : e.target.value === "true";
                              updateLocalValue(filter.key, val);
                            }}
                            className="w-full appearance-none border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gradient-to-br from-white to-slate-50/50 hover:border-blue-300 hover:from-white hover:to-blue-50/30 cursor-pointer font-medium text-slate-700"
                            aria-label={filter.label}
                          >
                            <option value="all">{t("common.all", "All")}</option>
                            <option value="true">{t("common.yes", "Yes")}</option>
                            <option value="false">{t("common.no", "No")}</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Nút Đặt lại và Áp dụng - Luôn hiển thị ở cuối */}
            <div className="flex gap-3 p-6 pt-4 border-t border-slate-200 bg-white/95 backdrop-blur-sm">
              <button
                type="button"
                onClick={handleReset}
                className="flex-1 px-5 py-3 border-2 border-slate-300 rounded-xl text-slate-700 hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 hover:border-slate-400 font-semibold transition-all duration-200 hover:shadow-md active:scale-95"
              >
                {t("common.reset", "Reset")}
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                {t("common.apply", "Apply")}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

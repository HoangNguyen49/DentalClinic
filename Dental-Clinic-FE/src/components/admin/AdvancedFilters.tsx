import { useState } from "react";
import { Filter, X } from "lucide-react";

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
  const [isOpen, setIsOpen] = useState(false);
  // Lưu giá trị bộ lọc tạm thời khi chỉnh sửa popup
  const [localValues, setLocalValues] = useState<Record<string, any>>(values);

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

  return (
    <div className="relative">
      {/* Nút mở popup bộ lọc */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 transition"
      >
        <Filter className="w-4 h-4" />
        <span>Bộ lọc</span>
        {activeFiltersCount > 0 && (
          <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Overlay nền xám khi mở popup */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          {/* Popup bộ lọc nâng cao */}
          <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 min-w-[300px] max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Bộ lọc nâng cao</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Đóng bộ lọc"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Danh sách option bộ lọc */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filters.map((filter) => (
                <div key={filter.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {filter.label}
                  </label>
                  {filter.type === "select" && (
                    <select
                      value={localValues[filter.key] || "all"}
                      onChange={(e) => updateLocalValue(filter.key, e.target.value)}
                      className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label={filter.label}
                    >
                      <option value="all">Tất cả</option>
                      {filter.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                  {filter.type === "text" && (
                    <input
                      type="text"
                      value={localValues[filter.key] || ""}
                      onChange={(e) => updateLocalValue(filter.key, e.target.value)}
                      placeholder={`Nhập ${filter.label.toLowerCase()}...`}
                      className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label={filter.label}
                    />
                  )}
                  {filter.type === "date" && (
                    <input
                      type="date"
                      value={localValues[filter.key] || ""}
                      onChange={(e) => updateLocalValue(filter.key, e.target.value)}
                      className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label={filter.label}
                    />
                  )}
                  {filter.type === "boolean" && (
                    <select
                      value={localValues[filter.key] === null ? "all" : localValues[filter.key] ? "true" : "false"}
                      onChange={(e) => {
                        const val = e.target.value === "all" ? null : e.target.value === "true";
                        updateLocalValue(filter.key, val);
                      }}
                      className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label={filter.label}
                    >
                      <option value="all">Tất cả</option>
                      <option value="true">Có</option>
                      <option value="false">Không</option>
                    </select>
                  )}
                </div>
              ))}
            </div>

            {/* Nút Đặt lại và Áp dụng */}
            <div className="flex gap-2 mt-4 pt-4 border-t">
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Đặt lại
              </button>
              <button
                onClick={handleApply}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Áp dụng
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

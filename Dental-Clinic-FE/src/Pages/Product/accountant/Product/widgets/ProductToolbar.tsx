import { useState } from "react";
import { Search, Filter, ChevronDown } from "lucide-react";

type ProductToolbarProps = {
  totalElements: number;

  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void; // Giữ lại cho sự kiện Enter

  minPrice?: number;
  maxPrice?: number;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;

  active: boolean | null;
  onActiveChange: (value: string) => void;

  onClearFilters: () => void;

  brandsOptions: string[];
  brandFilters: string[];
  setBrandFilters: (v: string[]) => void;

  typeOptions: string[];
  typeFilters: string[];
  setTypeFilters: (v: string[]) => void;
};

function ProductToolbar({
  totalElements,
  searchInput,
  onSearchInputChange,
  onSearch,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  active,
  onActiveChange,
  onClearFilters,
  brandsOptions,
  brandFilters,
  setBrandFilters,
  typeOptions,
  typeFilters,
  setTypeFilters,
}: ProductToolbarProps) {
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleSelectStatus = (value: "" | "true" | "false") => {
    onActiveChange(value);
    setIsStatusOpen(false); // Đóng dropdown sau khi chọn
  };

  const isAllSelected = active === null;
  const isActiveSelected = active === true;
  const isInactiveSelected = active === false;

  const getOptionClass = (selected: boolean) =>
    selected
      ? "font-semibold underline text-gray-900 text-left block w-full px-2 py-1"
      : "text-gray-500 hover:text-gray-700 text-left block w-full px-2 py-1";

  const buildSummary = (selected: string[], allLabel: string) => {
    if (selected.length === 0) return allLabel;
    if (selected.length === 1) return selected[0];
    const [first, ...rest] = selected;
    return `${first} (+${rest.length})`;
  };

  const typeSummary = buildSummary(typeFilters, "All");
  const brandSummary = buildSummary(brandFilters, "All");
  const summaryLabel = `${typeSummary} & ${brandSummary}`;

  return (
    <div className="space-y-6">
      {/* 1. HEADER AREA: Title Left - Search Right */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-gray-200">
        {/* Left: Title & Description */}
        <div>
          <h1 className="text-3xl font-extrabold text-[#0D1B3E]">
            Product Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage product details, pricing, and category settings. Total:{" "}
            <span className="font-extrabold text-gray-900">
              {totalElements.toLocaleString()}
            </span>{" "}
            products
          </p>
        </div>

        {/* Right: Search Input (Inline Icon) */}
        <div className="relative group w-full md:w-72 flex-shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow shadow-sm"
            placeholder="Search SKU or Product..."
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
          />
        </div>
      </div>

      {/* 2. FILTERS BOX (ONE ROW on Large Screens) */}
      <div className="bg-white rounded-xl p-5 shadow-md border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
        </div>

        {/* Flex Container: Xếp tất cả filter nằm ngang trên màn hình lớn (lg) */}
        <div className="flex flex-col lg:flex-row gap-4 lg:items-end">
          
          {/* 1. Brands & Types (Chiếm phần lớn không gian còn lại - flex-1) */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brands & Types
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsFilterOpen((prev) => !prev)}
                className="w-full border rounded-lg px-3 py-2 flex items-center justify-between bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150"
              >
                <span className="font-semibold text-gray-800 truncate block text-left">
                  {summaryLabel}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-700 flex-shrink-0 transition-transform ${
                    isFilterOpen ? "rotate-180" : "rotate-0"
                  }`}
                />
              </button>

              {isFilterOpen && (
                <div className="absolute left-0 mt-2 w-full min-w-[300px] bg-white border rounded-lg shadow-xl px-4 py-3 z-30">
                  {/* Types */}
                  <div className="mb-3">
                    <div className="text-xs font-semibold text-gray-700 mb-2">
                      Types
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs md:text-sm">
                      {typeOptions.map((t) => {
                        const selected = typeFilters.includes(t);
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              const set = new Set(typeFilters);
                              if (set.has(t)) set.delete(t);
                              else set.add(t);
                              setTypeFilters(Array.from(set));
                            }}
                            className={
                              selected
                                ? "text-gray-900 font-semibold underline text-left"
                                : "text-gray-400 hover:text-gray-700 text-left"
                            }
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="h-px bg-gray-200 my-2" />
                  {/* Brands */}
                  <div>
                    <div className="text-xs font-semibold text-gray-700 mb-2">
                      Brands
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {brandsOptions.map((b) => {
                        const selected = brandFilters.includes(b);
                        return (
                          <button
                            key={b}
                            type="button"
                            onClick={() => {
                              const set = new Set(brandFilters);
                              if (set.has(b)) set.delete(b);
                              else set.add(b);
                              setBrandFilters(Array.from(set));
                            }}
                            className={
                              selected
                                ? "text-gray-900 font-semibold underline text-left"
                                : "text-gray-400 hover:text-gray-700 text-left"
                            }
                          >
                            {b}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. Min Price (Kích thước cố định hoặc co dãn nhẹ) */}
          <div className="w-full lg:w-32 xl:w-40">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min price
            </label>
            <input
              type="number"
              value={minPrice ?? ""}
              onChange={(e) => onMinPriceChange(e.target.value)}
              placeholder="0"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150"
            />
          </div>

          {/* 3. Max Price */}
          <div className="w-full lg:w-32 xl:w-40">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max price
            </label>
            <input
              type="number"
              value={maxPrice ?? ""}
              onChange={(e) => onMaxPriceChange(e.target.value)}
              placeholder="Max"
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150"
            />
          </div>

          {/* 4. Status (Dropdown nhỏ hơn) */}
          <div className="w-full lg:w-36">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsStatusOpen((prev) => !prev)}
                className="w-full border rounded-lg px-3 py-2 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150"
              >
                <span
                  className={`truncate ${
                    isAllSelected
                      ? "text-gray-400"
                      : "font-semibold underline text-gray-900"
                  }`}
                >
                  {isAllSelected
                    ? "All"
                    : isActiveSelected
                    ? "Active"
                    : "Inactive"}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-600 flex-shrink-0" />
              </button>

              {isStatusOpen && (
                <div className="absolute right-0 mt-2 w-full bg-white border rounded-lg shadow-xl p-2 z-30">
                  <button
                    type="button"
                    className={getOptionClass(isAllSelected)}
                    onClick={() => handleSelectStatus("")}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={getOptionClass(isActiveSelected)}
                    onClick={() => handleSelectStatus("true")}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    className={getOptionClass(isInactiveSelected)}
                    onClick={() => handleSelectStatus("false")}
                  >
                    Inactive
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 5. Clear Button (Nút bấm nằm cuối hàng) */}
          <div className="flex-shrink-0 pt-4 lg:pt-0">
            <button
              onClick={onClearFilters}
              className="w-full lg:w-auto px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition duration-150 whitespace-nowrap"
            >
              Clear
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default ProductToolbar;
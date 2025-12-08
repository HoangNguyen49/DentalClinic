import { useState } from "react";
import { PlusCircle, Search, Filter, ChevronDown } from "lucide-react";

type ProductToolbarProps = {
  totalElements: number;
  onAddProduct: () => void;

  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void;

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
  onAddProduct,
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
  };

  const isAllSelected = active === null;
  const isActiveSelected = active === true;
  const isInactiveSelected = active === false;

  const getOptionClass = (selected: boolean) =>
    selected
      ? "font-semibold underline text-gray-900"
      : "text-gray-500 hover:text-gray-700";

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#0D1B3E] mb-2">
            Product Management
          </h1>
          <p className="text-gray-600 text-base">
            Total:{" "}
            <span className="font-extrabold text-gray-900">
              {totalElements.toLocaleString()}
            </span>{" "}
            products
          </p>
        </div>
        <button
          onClick={onAddProduct}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusCircle className="w-5 h-5" />
          Add Product
        </button>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
        </div>

        {/* Row 1: Search + Brands/Types dropdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search by name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search by name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => onSearchInputChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSearch()}
                placeholder="Enter product name..."
                className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={onSearch}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                title="Search"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Brands & Types dropdown (combined) */}
          <div className="md:col-span-1 lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brands & Types
            </label>
            <div className="relative inline-block w-full max-w-xl">
              <button
                type="button"
                onClick={() => setIsFilterOpen((prev) => !prev)}
                className="w-full border rounded px-3 py-2 flex items-center justify-between bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <span className="font-semibold text-gray-800 truncate">
                  {summaryLabel}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-700 flex-shrink-0 transition-transform ${
                    isFilterOpen ? "rotate-180" : "rotate-0"
                  }`}
                />
              </button>

              {isFilterOpen && (
                <div className="mt-2 w-full bg-white border rounded-lg shadow-md px-4 py-3">
                  {/* Types */}
                  <div className="mb-3">
                    <div className="text-xs font-semibold text-gray-700 mb-2">
                      Types
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-xs md:text-sm">
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
                                ? "text-gray-900 font-semibold underline"
                                : "text-gray-400 hover:text-gray-700"
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
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2 text-sm">
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
                                ? "text-gray-900 font-semibold underline"
                                : "text-gray-400 hover:text-gray-700"
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
        </div>

        {/* Row 2: price + status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min price
              </label>
              <input
                type="number"
                value={minPrice ?? ""}
                onChange={(e) => onMinPriceChange(e.target.value)}
                placeholder="0"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max price
              </label>
              <input
                type="number"
                value={maxPrice ?? ""}
                onChange={(e) => onMaxPriceChange(e.target.value)}
                placeholder="1000000"
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Status dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <div className="relative inline-block">
              <button
                type="button"
                onClick={() => setIsStatusOpen((prev) => !prev)}
                className="w-40 border rounded px-3 py-2 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <span
                  className={
                    isAllSelected
                      ? "text-gray-400"
                      : "font-semibold underline text-gray-900"
                  }
                >
                  {isAllSelected
                    ? "All status"
                    : isActiveSelected
                    ? "Active"
                    : "Inactive"}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </button>

              {isStatusOpen && (
                <div className="mt-2 w-40 bg-white border rounded-lg shadow-md p-3">
                  <div className="flex flex-col text-sm">
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
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={onClearFilters}
            className="px-4 py-2 text-gray-700 border rounded hover:bg-gray-100"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductToolbar;

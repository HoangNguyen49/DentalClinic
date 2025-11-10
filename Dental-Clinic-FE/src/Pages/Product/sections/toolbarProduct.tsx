import React, { useMemo, useState } from "react";
import { type SortKey } from "./GetAllProducts/useGetAllProducts";

type Props = {
  q: string;
  setQ: (v: string) => void;
  sort: SortKey;
  setSort: (v: SortKey) => void;
  glassInner: string;

  brandsOptions: string[];
  brandFilters: string[];
  setBrandFilters: (v: string[]) => void;

  typeFilters: string[];
  setTypeFilters: (v: string[]) => void;
  typeOptions: string[];
};

export default function ToolbarProduct({
  q,
  setQ,
  sort,
  setSort,
  glassInner,
  brandsOptions,
  brandFilters,
  setBrandFilters,
  typeFilters,
  setTypeFilters,
  typeOptions,
}: Props) {
  const [openSearch, setOpenSearch] = useState(false);
  const isBrandActive = brandFilters.length > 0;
  const isTypeActive = typeFilters.length > 0;

  const [tempQ, setTempQ] = useState<string>(q);

  const handleSearch = () => {
    const query = tempQ.trim();
    if (query !== q) setQ(query);
  };

  const commonPill =
    "px-0.5 py-0.5 bg-gradient-to-r from-[#66CCFF] to-[#3366FF] rounded-full p-[2px] shadow-lg active:scale-[0.98] transition duration-200";
  const innerPill = `${glassInner} relative rounded-full backdrop-blur-2xl bg-white/10 border border-white/25 `;
  const btnClass =
    "group relative flex items-center justify-center px-3 py-2 text-white rounded-full w-[100px] text-[14px] font-bold leading-none overflow-hidden";
  const searchPill =
    "px-[3px] py-[3px] bg-gradient-to-r from-[#66CCFF] to-[#3366FF] rounded-full p-[2px] shadow-lg transition duration-200";
  const searchInnerPill = `${glassInner} relative flex items-center rounded-full backdrop-blur-2xl bg-white/10 border border-white/25`;

  const [openFilter, setOpenFilter] = useState(false);
  const isFilterActive = isBrandActive || isTypeActive;

  const filterLabel = "Filter";


  return (
    <div className="w-full flex flex-wrap items-center justify-between gap-3 isolate relative z-[10]">
      <div className="flex items-center gap-3">
        {/* A–Z */}
        <div className={commonPill}>
          <div className={innerPill}>
            <button
              onClick={() =>
                setSort((sort === "name-asc" ? "name-desc" : "name-asc") as SortKey)
              }
              className={btnClass}
            >
              <div
                className={`absolute inset-[-1px] bg-gradient-to-r from-[#AACCFF] via-[#6699FF] to-[#3366FF] transition-all duration-700 ease-in-out ${sort === "name-desc" ? "translate-x-0 opacity-80" : "-translate-x-full opacity-0"
                  } group-hover:opacity-90`}
              />
              <div
                className={`absolute inset-[-1px] bg-gradient-to-l from-[#AACCFF] via-[#6699FF] to-[#3366FF] transition-all duration-700 ease-in-out ${sort === "name-asc" ? "translate-x-0 opacity-80" : "translate-x-full opacity-0"
                  } group-hover:opacity-90`}
              />
              <span className="relative z-10 flex items-center gap-1 text-white tracking-wider">
                {sort === "name-desc" ? (
                  <>
                    <span>A</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.0"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-[1em] h-[1em]"
                    >
                      <path d="M5 12h14" />
                      <path d="M13 6l6 6-6 6" />
                    </svg>
                    <span>Z</span>
                  </>
                ) : (
                  <>
                    <span>Z</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.0"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-[1em] h-[1em] rotate-180"
                    >
                      <path d="M5 12h14" />
                      <path d="M13 6l6 6-6 6" />
                    </svg>
                    <span>A</span>
                  </>
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Price */}
        <div className={commonPill}>
          <div className={innerPill}>
            <button
              onClick={() =>
                setSort((sort === "price-asc" ? "price-desc" : "price-asc") as SortKey)
              }
              className={`${btnClass} pr-5`}
            >
              <div
                className={`absolute inset-[-1px] bg-gradient-to-b from-[#AACCFF] via-[#6699FF] to-[#3366FF] transition-all duration-700 ease-in-out ${sort === "price-desc" ? "translate-y-0 opacity-80" : "-translate-y-full opacity-0"
                  } group-hover:opacity-90`}
              />
              <div
                className={`absolute inset-[-1px] bg-gradient-to-t from-[#AACCFF] via-[#6699FF] to-[#3366FF] transition-all duration-700 ease-in-out ${sort === "price-asc" ? "translate-y-0 opacity-80" : "translate-y-full opacity-0"
                  } group-hover:opacity-90`}
              />
              <span className="relative z-10 truncate">Price</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-transform duration-500 ${sort === "price-desc" ? "rotate-180" : "rotate-0"
                  }`}
              >
                <path d="M12 5v14" />
                <path d="M6 13l6 6 6-6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filter (Brand + Type) */}
        <div className="basis-full" /> {/* đẩy xuống hàng mới */}

        <div className={`${commonPill} relative overflow-visible z-[10]`}>
          <div className={innerPill}>
            <button
              onClick={() => setOpenFilter(o => !o)}
              className={`${btnClass} pr-5 group`}
            >
              {/* NỀN ĐẬM: hiện khi mở hoặc có filter */}
              <div
                className={`pointer-events-none absolute inset-[-1px] bg-gradient-to-b from-[#AACCFF] via-[#6699FF] to-[#3366FF]
        transition-transform transition-opacity duration-700 ease-in-out
        ${(openFilter || isFilterActive) ? "translate-y-0 opacity-80" : "-translate-y-[120%] opacity-0"}
        group-hover:opacity-90`}
              />

              {/* Nhãn tổng hợp */}
              <span className="relative z-10 truncate">{filterLabel}</span>

              {/* Chevron giữ nguyên style Brand */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-transform duration-300 ${openFilter ? "rotate-180" : "rotate-0"}`}
                viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          </div>

          {/* PANEL 2 HÀNG: Brand & Type (cấu trúc như ảnh, chỉ đổi text/ghi chú) */}
          {openFilter && (
            <div className="absolute left-0 top-full mt-2 z-[10] min-w-[520px] max-w-[80vw] rounded-2xl bg-white/95 text-[#0D1B3E] p-3 shadow-xl pointer-events-auto">
              {/* Row 1: Type */}
              <div className="flex items-start gap-3 py-1">
                <div className="shrink-0 w-[90px] text-sm font-semibold leading-[1.15] pt-2">Type:</div>
                <div className="flex flex-wrap gap-2">
                  {/* All */}
                  <button
                    onClick={() => setTypeFilters([])}
                    className={`px-3 py-1.5 rounded-xl border text-sm ${typeFilters.length === 0 ? "bg-[#3366FF]/10 border-[#3366FF]" : "bg-white border-black/10"
                      }`}
                  >
                    All
                  </button>

                  {typeOptions.map((t) => {
                    const active = typeFilters.includes(t);
                    return (
                      <button
                        key={t}
                        onClick={() => {
                          const set = new Set(typeFilters);
                          if (set.has(t)) set.delete(t); else set.add(t);
                          setTypeFilters(Array.from(set));
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-sm ${active ? "bg-[#3366FF]/10 border-[#3366FF]" : "bg-white border-black/10"}`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Divider mảnh */}
              <div className="h-px bg-black/10 my-2" />

              {/* Row 2: Brand */}
              <div className="flex items-start gap-3 py-1">
                <div className="shrink-0 w-[90px] text-sm font-semibold leading-[1.15] pt-2">Brand:</div>
                <div className="flex flex-wrap gap-2">
                  {/* All */}
                  <button
                    onClick={() => setBrandFilters([])}
                    className={`px-3 py-1.5 rounded-xl border text-sm ${brandFilters.length === 0 ? "bg-[#3366FF]/10 border-[#3366FF]" : "bg-white border-black/10"
                      }`}
                  >
                    All
                  </button>

                  {brandsOptions.map((b) => {
                    const active = brandFilters.includes(b);
                    return (
                      <button
                        key={b}
                        onClick={() => {
                          const set = new Set(brandFilters);
                          if (set.has(b)) set.delete(b); else set.add(b);
                          setBrandFilters(Array.from(set));
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-sm ${active ? "bg-[#3366FF]/10 border-[#3366FF]" : "bg-white border-black/10"}`}
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

      <div className={`${searchPill} ml-auto`}>
        <div
          className={`${searchInnerPill} transition-all duration-300
    ${openSearch ? "w-[260px] h-[38px] px-3 justify-start" : "w-[38px] h-[38px] px-0 justify-center"}`}
        >
          {/* Nút search */}
          <button
            onClick={() => {
              if (openSearch) handleSearch(); 
              setOpenSearch((o) => !o);      
            }}
            className="flex items-center justify-center w-[26px] h-[26px]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>

          {/* Input */}
          <input
            value={tempQ}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTempQ(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") {
                handleSearch();
                e.currentTarget.blur(); // đóng bàn phím trên mobile
              }
            }}
            placeholder="Search products..."
            className={`bg-transparent outline-none text-white placeholder-white/70 transition-all duration-300 text-[14px]
      ${openSearch ? "ml-2 flex-1 block opacity-100" : "ml-0 hidden opacity-0 w-0"}`}
            inputMode="search"
            enterKeyHint="search" // hiển thị nút “Search” trên mobile
          />
        </div>
      </div>



    </div>
  );
}

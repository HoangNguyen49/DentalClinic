import React from "react";

type Props = {
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  glassInner: string;
};

export default function paginationProduct({ page, setPage, totalPages, glassInner }: Props) {
  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
  const neighbors = 2;
  const start = clamp(page - neighbors, 1, Math.max(1, totalPages - neighbors * 2));
  const end = clamp(start + neighbors * 2, 1, totalPages);
  const items = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className="flex items-center justify-center pt-6">
      <div
        tabIndex={0}
        onWheel={(e) => {
          if (e.deltaY > 0) setPage((p) => clamp(p + 1, 1, totalPages));
          if (e.deltaY < 0) setPage((p) => clamp(p - 1, 1, totalPages));
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowUp") setPage((p) => clamp(p + 1, 1, totalPages));
          if (e.key === "ArrowLeft" || e.key === "ArrowDown") setPage((p) => clamp(p - 1, 1, totalPages));
          if (e.key === "Home") setPage(1);
          if (e.key === "End") setPage(totalPages);
        }}
        className="outline-none"
      >
        <div className="px-0.5 py-0.5 bg-gradient-to-r from-[#66CCFF] to-[#3366FF] rounded-full p-[2px] shadow-lg">
          <div className={`${glassInner} relative rounded-full backdrop-blur-2xl bg-white/10 border border-white/25`}>
            <div className="relative w-[120px] h-6 overflow-hidden">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/10" />
              <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-center gap-2 px-3">
                {items.map((n) => {
                  const isActive = n === page;
                  return (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={[
                        "h-5 w-5 min-w-5 px-2 text-[11px] rounded-full transition-all duration-200",
                        "focus:outline-none active:scale-[0.98]",
                        isActive
                          ? "bg-gradient-to-r from-[#66CCFF] to-[#3366FF] text-white font-bold shadow-md scale-105"
                          : "bg-white/10 text-white/80 hover:bg-white/20",
                      ].join(" ")}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

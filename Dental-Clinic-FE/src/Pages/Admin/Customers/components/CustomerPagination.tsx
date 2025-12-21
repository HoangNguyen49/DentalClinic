import { useTranslation } from "react-i18next";

interface CustomerPaginationProps {
  page: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}

export default function CustomerPagination({
  page,
  totalPages,
  totalElements,
  pageSize,
  loading,
  onPageChange,
}: CustomerPaginationProps) {
  const { t } = useTranslation("admin");

  if (totalPages <= 1) return null;

  return (
    <section className="flex items-center justify-between bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/60 px-6 py-4">
      <div className="text-sm text-slate-700 font-medium">
        {t("common.showing", "Showing")}{" "}
        <span className="font-bold text-blue-600">
          {page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalElements)}
        </span>{" "}
        {t("common.of", "of")} <span className="font-bold">{totalElements}</span>{" "}
        {t("common.results", "results")}
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={page === 0 || loading}
          className="px-5 py-2.5 border-2 border-slate-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-all font-medium"
        >
          {t("common.previous", "Previous")}
        </button>
        <div className="flex items-center gap-2">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 5) {
              pageNum = i;
            } else if (page < 3) {
              pageNum = i;
            } else if (page > totalPages - 4) {
              pageNum = totalPages - 5 + i;
            } else {
              pageNum = page - 2 + i;
            }
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                disabled={loading}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  page === pageNum
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200/50"
                    : "border-2 border-slate-200 hover:bg-slate-50"
                } disabled:opacity-50`}
              >
                {pageNum + 1}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1 || loading}
          className="px-5 py-2.5 border-2 border-slate-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-all font-medium"
        >
          {t("common.next", "Next")}
        </button>
      </div>
    </section>
  );
}


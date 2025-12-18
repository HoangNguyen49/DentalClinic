import { useTranslation } from "react-i18next";

type PaginationProps = {
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
};

export default function Pagination({
  page,
  size,
  totalPages,
  totalElements,
  onPageChange,
  onSizeChange,
}: PaginationProps) {
  const { t } = useTranslation("attendance");

  return (
    <div className="flex items-center justify-between mt-4 px-4 py-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700">{t("pagination.rowsPerPage")}</span>
        <select
          value={size}
          // chọn số dòng/trang, về trang đầu khi thay đổi số dòng
          onChange={(e) => {
            onSizeChange(Number(e.target.value));
            onPageChange(0);
          }}
          className="px-2 py-1 border border-gray-300 rounded text-sm"
          title={t("pagination.selectRowsPerPage")}
          aria-label={t("pagination.selectRowsPerPage")}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700">
          {totalElements > 0 
            // Hiển thị số dòng hiện tại
            ? `${page * size + 1}-${Math.min((page + 1) * size, totalElements)} ${t("pagination.of")} ${totalElements}`
            : `0 ${t("pagination.of")} 0`}
        </span>
        <button
          // về trang đầu
          onClick={() => onPageChange(0)}
          disabled={page === 0}
          className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          {t("pagination.first")}
        </button>
        <button
          // về trang trước đó
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          {t("pagination.previous")}
        </button>
        <span className="text-sm text-gray-700">
          {/* Hiển thị số trang hiện tại và tổng số trang */}
          {t("pagination.page")} {totalPages > 0 ? page + 1 : 0} {t("pagination.of")} {totalPages || 1}
        </span>
        <button
          // sang trang tiếp theo
          onClick={() => {
            if (totalPages > 0 && page < totalPages - 1) {
              onPageChange(page + 1);
            }
          }}
          disabled={totalPages <= 0 || page >= totalPages - 1}
          className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          {t("pagination.next")}
        </button>
        <button
          // tới trang cuối
          onClick={() => {
            if (totalPages > 0) {
              onPageChange(totalPages - 1);
            }
          }}
          disabled={totalPages <= 0 || page >= totalPages - 1}
          className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          {t("pagination.last")}
        </button>
      </div>
    </div>
  );
}


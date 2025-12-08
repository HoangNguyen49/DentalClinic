import { ChevronLeft, ChevronRight } from "lucide-react";

type ProductPaginationProps = {
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
};

function ProductPagination({
  page,
  size,
  totalPages,
  totalElements,
  onPageChange,
  onSizeChange,
}: ProductPaginationProps) {
  return (
    <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700">
          Show{" "}
          <select
            value={size}
            onChange={(e) => {
              onSizeChange(Number(e.target.value));
              onPageChange(0);
            }}
            className="border rounded px-2 py-1 mx-1"
            aria-label="Items per page"
          >
            <option value={8}>8</option>
            <option value={16}>16</option>
            <option value={32}>32</option>
            <option value={64}>64</option>
          </select>
          of {totalElements} results
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(0)}
          disabled={page === 0}
          className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          title="First page"
          aria-label="First page"
        >
          First
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          title="Previous page"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="px-3 py-1 text-sm text-gray-700">
          Page {page + 1} / {totalPages || 1}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          title="Next page"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPageChange(totalPages - 1)}
          disabled={page >= totalPages - 1}
          className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          title="Last page"
          aria-label="Last page"
        >
          Last
        </button>
      </div>
    </div>
  );
}

export default ProductPagination;

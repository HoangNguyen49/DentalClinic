import { ChevronUp, ChevronDown } from "lucide-react";

// Kiểu dữ liệu cho trạng thái sắp xếp
export type SortDirection = "asc" | "desc" | null;

// Props cho component TableSortHeader
interface TableSortHeaderProps {
  label: string;
  sortKey: string;
  currentSortKey: string | null;
  currentDirection: SortDirection;
  onSort: (key: string, direction: SortDirection) => void;
  className?: string;
}

export default function TableSortHeader({
  label,
  sortKey,
  currentSortKey,
  currentDirection,
  onSort,
  className = "",
}: TableSortHeaderProps) {
  // Kiểm tra xem cột hiện tại có đang được sắp xếp không
  const isActive = currentSortKey === sortKey;
  const direction = isActive ? currentDirection : null;

  // Xử lý khi click tiêu đề cột để chuyển đổi trạng thái sắp xếp
  const handleClick = () => {
    if (!isActive) {
      onSort(sortKey, "asc");
    } else if (direction === "asc") {
      onSort(sortKey, "desc");
    } else {
      onSort(sortKey, null);
    }
  };

  return (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition ${className}`}
      onClick={handleClick}
    >
      <div className="flex items-center gap-2">
        <span>{label}</span>
        {/* Hiển thị icon sắp xếp lên/xuống */}
        <div className="flex flex-col">
          <ChevronUp
            className={`w-3 h-3 ${
              direction === "asc" ? "text-blue-600" : "text-gray-300"
            }`}
          />
          <ChevronDown
            className={`w-3 h-3 -mt-1 ${
              direction === "desc" ? "text-blue-600" : "text-gray-300"
            }`}
          />
        </div>
      </div>
    </th>
  );
}

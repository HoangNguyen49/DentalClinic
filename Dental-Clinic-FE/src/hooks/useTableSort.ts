import { useState, useCallback } from "react";
import type { SortDirection } from "../components/admin/TableSortHeader";

// Trạng thái sắp xếp, gồm key (cột) và thứ tự (asc/desc/null)
export interface SortState {
  key: string | null;
  direction: SortDirection;
}

export function useTableSort<T>(defaultSort?: { key: keyof T; direction: SortDirection }) {
  // State lưu trạng thái sắp xếp
  const [sortState, setSortState] = useState<SortState>({
    key: defaultSort?.key as string || null,
    direction: defaultSort?.direction || null,
  });

  // Xử lý khi đổi sắp xếp (bấm vào tiêu đề cột)
  const handleSort = useCallback((key: string, direction: SortDirection) => {
    setSortState({ key, direction });
  }, []);

  // Sắp xếp dữ liệu dựa theo state hiện tại
  const sortData = useCallback((data: T[]): T[] => {
    if (!sortState.key || !sortState.direction) {
      return data;
    }

    return [...data].sort((a, b) => {
      const aValue = (a as any)[sortState.key!];
      const bValue = (b as any)[sortState.key!];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Sắp xếp cho mảng (ví dụ roles, clinics)
      if (Array.isArray(aValue) && Array.isArray(bValue)) {
        const aStr = aValue.join(", ");
        const bStr = bValue.join(", ");
        return sortState.direction === "asc"
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      }

      // Sắp xếp cho kiểu string
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortState.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Sắp xếp cho kiểu number
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortState.direction === "asc" ? aValue - bValue : bValue - aValue;
      }

      // Sắp xếp cho kiểu ngày (date)
      const aDate = new Date(aValue);
      const bDate = new Date(bValue);
      if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
        return sortState.direction === "asc"
          ? aDate.getTime() - bDate.getTime()
          : bDate.getTime() - aDate.getTime();
      }

      // Sắp xếp fallback cho các kiểu còn lại
      const aStr = String(aValue);
      const bStr = String(bValue);
      return sortState.direction === "asc"
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }, [sortState]);

  return {
    sortState,
    handleSort,
    sortData,
    // Reset trạng thái sắp xếp về mặc định
    resetSort: useCallback(() => {
      setSortState({ key: null, direction: null });
    }, []),
  };
}

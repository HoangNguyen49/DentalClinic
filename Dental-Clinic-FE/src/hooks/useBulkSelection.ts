import { useState, useCallback, useMemo } from "react";

// Hook dùng cho việc chọn nhiều dòng (multi select) theo id
export function useBulkSelection<T extends { id: number }>(items: T[]) {
  // Danh sách id đã được chọn
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Lấy danh sách item đã chọn dựa vào selectedIds
  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(item.id)),
    [items, selectedIds]
  );

  // Đã chọn tất cả hay chưa
  const isAllSelected = useMemo(
    () => items.length > 0 && selectedIds.size === items.length,
    [items.length, selectedIds.size]
  );

  // Trạng thái chọn một phần (indeterminate)
  const isIndeterminate = useMemo(
    () => selectedIds.size > 0 && selectedIds.size < items.length,
    [items.length, selectedIds.size]
  );

  // Chọn/bỏ chọn một item theo id
  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Chọn tất cả hoặc bỏ chọn tất cả
  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((item) => item.id)));
    }
  }, [isAllSelected, items]);

  // Bỏ chọn toàn bộ
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Chọn nhiều items theo mảng id truyền vào
  const selectItems = useCallback((ids: number[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  return {
    selectedIds,
    selectedItems,
    isAllSelected,
    isIndeterminate,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    selectItems,
  };
}

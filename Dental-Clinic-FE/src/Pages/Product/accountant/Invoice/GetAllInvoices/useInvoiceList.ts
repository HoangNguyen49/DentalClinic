import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom"; // [1] Import hook này
import { invoiceApi, type ProductInvoiceListDto } from "../../../../../huybro_api/invoiceApi";

export const useInvoiceList = () => {
  const [searchParams, setSearchParams] = useSearchParams(); // [2] Sử dụng hook

  const [invoices, setInvoices] = useState<ProductInvoiceListDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // [3] Khởi tạo giá trị từ URL thay vì hardcode
  // Nếu URL không có thì mới lấy giá trị mặc định (0, 8, "")
  const [filters, setFilters] = useState({
    page: Number(searchParams.get("page") ?? 0),
    size: Number(searchParams.get("size") ?? 8),
    status: searchParams.get("status") || "",
    keyword: searchParams.get("keyword") || "",
  });

  // [4] Fetch API (Giữ nguyên logic cũ)
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await invoiceApi.getInvoices({
        page: filters.page,
        size: filters.size,
        status: filters.status || undefined,
        keyword: filters.keyword || undefined,
      });

      setInvoices(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load invoices.");
      setInvoices([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // [5] Sync State -> URL (Logic quan trọng nhất để hiện URL chuẩn)
  useEffect(() => {
    const params: Record<string, string> = {};

    // LUÔN LUÔN set page và size (để hiện ?page=0&size=10)
    params.page = String(filters.page);
    params.size = String(filters.size);

    // Các filter khác chỉ hiện khi có giá trị
    if (filters.status) params.status = filters.status;
    if (filters.keyword) params.keyword = filters.keyword;

    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  // Actions (Giữ nguyên)
  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleSizeChange = (newSize: number) => {
    setFilters((prev) => ({ ...prev, size: newSize, page: 0 }));
  };

  const handleStatusChange = (status: string) => {
    setFilters((prev) => ({ ...prev, status, page: 0 }));
  };

  const handleSearch = (keyword: string) => {
    setFilters((prev) => ({ ...prev, keyword, page: 0 }));
  };

  return {
    invoices,
    loading,
    error,
    totalPages,
    totalElements,
    page: filters.page,
    size: filters.size,
    filters,
    handlePageChange,
    handleSizeChange,
    handleStatusChange,
    handleSearch,
    refreshData: fetchInvoices
  };
};
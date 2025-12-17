import { useEffect, useState, useMemo, useCallback } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from "react-i18next";
import { Users } from "lucide-react";
import { adminApi, type AdminCustomer } from "../../../services/admin/adminApi";
import { useDebounce } from "../../../hooks/useDebounce";
import { useAdminApi } from "../../../hooks/useAdminApi";
import { useTableSort } from "../../../hooks/useTableSort";
import { useBulkSelection } from "../../../hooks/useBulkSelection";
import { toast } from "react-toastify";
import CustomerSearchBar from "./components/CustomerSearchBar";
import CustomerBulkActions from "./components/CustomerBulkActions";
import CustomerTable from "./components/CustomerTable";
import CustomerDetailModal from "./components/CustomerDetailModal";
import CustomerPagination from "./components/CustomerPagination";

export default function AdminCustomerManagement() {
  const { t } = useTranslation("admin");
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [filters, setFilters] = useState<Record<string, any>>({
    isActive: null,
    gender: "all",
  });
  const pageSize = 20;
  const debouncedSearch = useDebounce(search, 500);
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const { loading, execute } = useAdminApi<any>();
  const { execute: executeDetail } = useAdminApi<AdminCustomer>();
  const { execute: executeToggle } = useAdminApi<any>();

  // Sort dữ liệu bảng
  const { sortState, handleSort, sortData, resetSort } = useTableSort<AdminCustomer>();

  // Xử lý chọn hàng loạt
  const {
    selectedIds,
    isAllSelected,
    isIndeterminate,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
  } = useBulkSelection(customers);

  // Lấy danh sách khách hàng từ API
  const fetchCustomers = useCallback(async (keyword?: string, pageNum: number = 0) => {
    await execute(
      () => adminApi.customers.getAll({ 
        search: keyword, 
        page: pageNum, 
        size: pageSize 
      }),
      {
        showErrorToast: true,
        errorMessage: t("customers.messages.loadFailed", "Unable to load customers"),
        onSuccess: (data) => {
          // Backend luôn trả về Page response với pagination
          if (data && typeof data === 'object' && 'content' in data) {
            setCustomers(data.content || []);
            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0);
          } else {
            // Fallback nếu response không đúng format
            console.warn("Unexpected response format from customers API:", data);
            setCustomers([]);
            setTotalPages(0);
            setTotalElements(0);
          }
        },
      }
    );
  }, [execute, t]);

  // Lọc và sort dữ liệu khách hàng
  const filteredAndSortedCustomers = useMemo(() => {
    let filtered = [...customers];

    if (filters.isActive !== null) {
      filtered = filtered.filter((c) => c.isActive === filters.isActive);
    }
    if (filters.gender && filters.gender !== "all") {
      filtered = filtered.filter((c) => c.gender === filters.gender);
    }

    return sortData(filtered);
  }, [customers, filters, sortData]);


  // Khi search (debounce) thay đổi, reset về trang đầu
  useEffect(() => {
    setPage(0);
    fetchCustomers(debouncedSearch.trim() || undefined, 0);
  }, [debouncedSearch, fetchCustomers]);

  // Khi đổi trang
  useEffect(() => {
    fetchCustomers(debouncedSearch.trim() || undefined, page);
  }, [page, debouncedSearch, fetchCustomers]);

  // Tìm kiếm theo từ khoá nhập
  const handleSearch = useCallback(() => {
    setPage(0);
    fetchCustomers(search.trim() || undefined, 0);
  }, [search, fetchCustomers]);

  // Hành động hàng loạt: Kích hoạt / vô hiệu hóa nhiều khách hàng
  const handleBulkToggleStatus = useCallback(async (isActive: boolean) => {
    if (selectedIds.size === 0) {
      toast.warning("Vui lòng chọn ít nhất một khách hàng");
      return;
    }

    const selectedIdsArray = Array.from(selectedIds);
    let successCount = 0;
    let failCount = 0;

    // Gọi API toggle status cho từng customer đã chọn
    for (const customerId of selectedIdsArray) {
      try {
        await executeToggle(
          () => adminApi.customers.toggleStatus(customerId, isActive),
          {
            showErrorToast: false, // Không hiển thị toast cho từng lỗi
            onSuccess: () => {
              successCount++;
              // Cập nhật state ngay lập tức
              setCustomers((prev) =>
                prev.map((item) =>
                  item.id === customerId
                    ? { ...item, isActive }
                    : item
                )
              );
            },
            onError: () => {
              failCount++;
            },
          }
        );
      } catch (error) {
        failCount++;
      }
    }

    // Hiển thị kết quả tổng hợp
    if (successCount > 0) {
      toast.success(
        `Đã ${isActive ? "kích hoạt" : "vô hiệu hóa"} ${successCount} khách hàng${failCount > 0 ? ` (${failCount} thất bại)` : ""}`
      );
    } else {
      toast.error(`Không thể ${isActive ? "kích hoạt" : "vô hiệu hóa"} khách hàng`);
    }

    clearSelection();
    // Refresh lại danh sách để đảm bảo dữ liệu đồng bộ
    fetchCustomers(debouncedSearch.trim() || undefined, page);
  }, [selectedIds, clearSelection, debouncedSearch, page, fetchCustomers, executeToggle]);

  // Xem chi tiết một khách hàng
  const handleViewDetail = async (customerId: number) => {
    await executeDetail(
      () => adminApi.customers.getById(customerId),
      {
        showErrorToast: true,
        errorMessage: t("customers.messages.loadDetailFailed", "Unable to load customer details"),
        onSuccess: (data) => {
          setSelectedCustomer(data);
          setShowDetailModal(true);
        },
      }
    );
  };

  // Khóa / Bỏ khóa 1 khách hàng
  const handleToggleStatus = async (customer: AdminCustomer) => {
    setUpdatingId(customer.id);
    await executeToggle(
      () => adminApi.customers.toggleStatus(customer.id, !customer.isActive),
      {
        showErrorToast: true,
        errorMessage: t("customers.messages.updateFailed", "Unable to update customer status"),
        onSuccess: () => {
          setCustomers((prev) =>
            prev.map((item) =>
              item.id === customer.id
                ? {
                    ...item,
                    isActive: !customer.isActive,
                  }
                : item
            )
          );
          toast.success(
            !customer.isActive
              ? t("customers.messages.activated", "Khách hàng đã được kích hoạt")
              : t("customers.messages.blocked", "Khách hàng đã bị chặn")
          );
        },
      }
    );
    setUpdatingId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 p-8">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <section className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg ring-4 ring-blue-100">
            <Users className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {t("pageTitles.customerManagement", "Customer Management")}
        </h1>
            <p className="text-sm text-gray-600 font-medium mt-1">
          {t(
            "customers.pageDescription",
                "Manage all customers in the system, including contact info and history"
          )}
        </p>
      </div>
        </section>

      {/* Thanh tìm kiếm và bộ lọc */}
      <CustomerSearchBar
        search={search}
        onSearchChange={setSearch}
        onSearch={handleSearch}
        onClear={() => {
          setSearch("");
          setFilters({ isActive: null, gender: "all" });
          resetSort();
          fetchCustomers();
        }}
      />

      {/* Thanh công cụ thao tác hàng loạt */}
      <CustomerBulkActions
        selectedCount={selectedIds.size}
        onActivate={() => handleBulkToggleStatus(true)}
        onDeactivate={() => handleBulkToggleStatus(false)}
        onClear={clearSelection}
      />

      {/* Bảng danh sách khách hàng */}
      <CustomerTable
        customers={filteredAndSortedCustomers}
        loading={loading}
        selectedIds={selectedIds}
        isAllSelected={isAllSelected}
        isIndeterminate={isIndeterminate}
        sortState={sortState}
        totalElements={totalElements}
        updatingId={updatingId}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
        onSort={handleSort}
        onViewDetail={handleViewDetail}
        onToggleStatus={handleToggleStatus}
      />

      {/* Phân trang cho bảng */}
      <CustomerPagination
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        pageSize={pageSize}
        loading={loading}
        onPageChange={setPage}
      />

      {/* Modal xem chi tiết khách hàng */}
      {showDetailModal && selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedCustomer(null);
          }}
        />
      )}
      </div>
    </div>
  );
}

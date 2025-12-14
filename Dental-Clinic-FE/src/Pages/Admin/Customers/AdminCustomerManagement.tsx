import { useEffect, useState, useMemo, useCallback } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from "react-i18next";
import { Eye, UserX, UserCheck, Users, Search, X, CheckCircle, XCircle } from "lucide-react";
import { adminApi, type AdminCustomer } from "../../../services/admin/adminApi";
import { formatDate } from "../../../utils/adminUtils";
import { useDebounce } from "../../../hooks/useDebounce";
import { useAdminApi } from "../../../hooks/useAdminApi";
import { useTableSort } from "../../../hooks/useTableSort";
import { useBulkSelection } from "../../../hooks/useBulkSelection";
import TableSortHeader from "../../../components/admin/TableSortHeader";
import AdvancedFilters, { type FilterOption } from "../../../components/admin/AdvancedFilters";
import { toast } from "react-toastify";

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

  // Thiết lập lựa chọn filter động cho giới tính
  const filterOptions = useMemo(() => {
    const genders = Array.from(new Set(customers.map((c) => c.gender).filter(Boolean))) as string[];
    return [
      {
        key: "isActive",
        label: "Trạng thái",
        type: "boolean" as const,
      },
      {
        key: "gender",
        label: "Giới tính",
        type: "select" as const,
        options: [
          { value: "all", label: "Tất cả" },
          ...genders.map((g) => ({ value: g, label: g })),
        ],
      },
    ] as FilterOption[];
  }, [customers]);

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
        <section className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/60 p-6 space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1 group">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                {t("customers.filters.search", "Search")}
            </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              placeholder={t(
                "customers.filters.searchPlaceholder",
                    "Search by name, patient code, phone or email..."
              )}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-base bg-gradient-to-br from-white to-slate-50"
            />
          </div>
            </div>
            <div className="flex gap-3">
            <button
              onClick={handleSearch}
                className="px-6 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-bold text-base shadow-md flex items-center gap-2"
            >
                <Search className="w-5 h-5" />
                {t("customers.actions.search", "Search")}
            </button>
            <button
              onClick={() => {
                setSearch("");
                setFilters({ isActive: null, gender: "all" });
                resetSort();
                fetchCustomers();
              }}
                className="px-6 py-3.5 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium text-base flex items-center gap-2"
            >
                <X className="w-5 h-5" />
                {t("customers.actions.clear", "Clear")}
            </button>
            <AdvancedFilters
              filters={filterOptions}
              values={filters}
              onChange={setFilters}
              onReset={() => {
                setFilters({ isActive: null, gender: "all" });
              }}
            />
          </div>
        </div>

        {/* Thanh công cụ thao tác hàng loạt */}
        {selectedIds.size > 0 && (
            <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4">
              <span className="text-sm font-bold text-blue-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                Selected {selectedIds.size} customer{selectedIds.size > 1 ? 's' : ''}
            </span>
              <div className="flex gap-3">
              <button
                onClick={() => handleBulkToggleStatus(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-bold rounded-xl hover:shadow-lg transition-all shadow-md flex items-center gap-2"
              >
                  <UserCheck className="w-4 h-4" />
                  Activate
              </button>
              <button
                onClick={() => handleBulkToggleStatus(false)}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-bold rounded-xl hover:shadow-lg transition-all shadow-md flex items-center gap-2"
              >
                  <UserX className="w-4 h-4" />
                  Deactivate
              </button>
              <button
                onClick={clearSelection}
                  className="px-5 py-2.5 border-2 border-slate-300 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-all flex items-center gap-2"
              >
                  <XCircle className="w-4 h-4" />
                  Clear
              </button>
            </div>
          </div>
        )}
        </section>

      {/* Bảng danh sách khách hàng */}
        <section className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Customer List</h2>
                <p className="text-sm text-slate-600">
                  Total: {totalElements} customer{totalElements !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
              <thead className="bg-gradient-to-r from-slate-50 via-gray-50 to-slate-50">
            <tr>
                  <th className="px-6 py-4 text-left">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isIndeterminate;
                  }}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      aria-label="Select all"
                />
              </th>
              <TableSortHeader
                    label={t("customers.table.customer", "Customer")}
                sortKey="fullName"
                currentSortKey={sortState.key}
                currentDirection={sortState.direction}
                onSort={handleSort}
              />
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    {t("customers.table.contact", "Contact")}
              </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    {t("customers.table.address", "Address")}
              </th>
              <TableSortHeader
                    label={t("customers.table.status", "Status")}
                sortKey="isActive"
                currentSortKey={sortState.key}
                currentDirection={sortState.direction}
                onSort={handleSort}
              />
              <TableSortHeader
                    label={t("customers.table.createdAt", "Created")}
                sortKey="createdAt"
                currentSortKey={sortState.key}
                currentDirection={sortState.direction}
                onSort={handleSort}
              />
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                    {t("customers.table.actions", "Actions")}
              </th>
            </tr>
          </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
            {/* Hiển thị trạng thái loading hoặc không có dữ liệu */}
            {loading ? (
              <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="text-slate-600 font-medium">{t("customers.messages.loading", "Loading customers...")}</p>
                      </div>
                </td>
              </tr>
            ) : filteredAndSortedCustomers.length === 0 ? (
              <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-slate-100 rounded-2xl">
                          <Users className="w-12 h-12 text-slate-400" />
                        </div>
                        <p className="text-slate-600 font-medium text-lg">{t("customers.messages.noData", "No customers found")}</p>
                      </div>
                </td>
              </tr>
            ) : (
              filteredAndSortedCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/20 transition-all duration-200">
                      <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(customer.id)}
                      onChange={() => toggleSelect(customer.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          aria-label={`Select ${customer.fullName}`}
                    />
                  </td>
                      <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg ring-4 ring-blue-100">
                            <span className="text-white text-base font-bold">
                          {customer.fullName?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                            <div className="text-sm font-bold text-slate-900">{customer.fullName}</div>
                            <div className="text-xs text-slate-500 font-medium">
                              {customer.patientCode ? `Code: ${customer.patientCode}` : `ID: ${customer.id}`}
                        </div>
                        {customer.userId && (
                              <span className="inline-flex mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                                Has Account
                              </span>
                        )}
                      </div>
                    </div>
                  </td>
                      <td className="px-6 py-4 text-sm text-slate-700">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{customer.phone || "-"}</span>
                          <span className="text-xs text-slate-500">{customer.email || "-"}</span>
                    </div>
                  </td>
                      <td className="px-6 py-4 text-sm text-slate-700 max-w-xs truncate">
                    {customer.address || "-"}
                  </td>
                      <td className="px-6 py-4 text-sm">
                    <span
                          className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold shadow-md ${
                        customer.isActive
                              ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-200/50"
                              : "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-red-200/50"
                      }`}
                    >
                      {customer.isActive
                            ? t("customers.table.active", "Active")
                            : t("customers.table.inactive", "Inactive")}
                    </span>
                  </td>
                      <td className="px-6 py-4 text-sm text-slate-700 font-medium">{formatDate(customer.createdAt)}</td>
                      <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDetail(customer.id)}
                            className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all hover:shadow-md"
                            title={t("customers.actions.viewDetail", "View Details")}
                            aria-label={t("customers.actions.viewDetail", "View Details")}
                      >
                            <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(customer)}
                        disabled={updatingId === customer.id}
                            className={`p-2.5 rounded-lg transition-all hover:shadow-md ${
                          customer.isActive
                            ? "text-red-600 hover:bg-red-50"
                            : "text-green-600 hover:bg-green-50"
                        } ${updatingId === customer.id ? "opacity-50 cursor-not-allowed" : ""}`}
                        title={
                          customer.isActive
                                ? t("customers.actions.block", "Block Customer")
                                : t("customers.actions.unblock", "Unblock Customer")
                            }
                            aria-label={
                              customer.isActive
                                ? t("customers.actions.block", "Block Customer")
                                : t("customers.actions.unblock", "Unblock Customer")
                        }
                      >
                            {customer.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
        </section>

      {/* Phân trang cho bảng */}
      {totalPages > 1 && (
          <section className="flex items-center justify-between bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/60 px-6 py-4">
            <div className="text-sm text-slate-700 font-medium">
              {t("common.showing", "Showing")} <span className="font-bold text-blue-600">{page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalElements)}</span> {t("common.of", "of")} <span className="font-bold">{totalElements}</span> {t("common.results", "results")}
          </div>
            <div className="flex gap-3">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
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
                    onClick={() => setPage(pageNum)}
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
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1 || loading}
                className="px-5 py-2.5 border-2 border-slate-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-all font-medium"
            >
                {t("common.next", "Next")}
            </button>
          </div>
          </section>
      )}

      {/* Modal xem chi tiết khách hàng */}
      {showDetailModal && selectedCustomer && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
              <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">
                      {t("customers.detail.title", "Customer Details")}
                </h2>
                  </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedCustomer(null);
                  }}
                    className="p-2 text-white hover:bg-white/20 rounded-xl transition-all"
                    aria-label="Close modal"
                    title="Close"
                >
                    <X className="w-6 h-6" />
                </button>
              </div>
              </div>

              <div className="p-8">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                    <label className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2 block">
                      {t("customers.detail.fullName", "Full Name")}
                    </label>
                    <p className="text-slate-900 font-bold text-lg">{selectedCustomer.fullName}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-100">
                    <label className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-2 block">
                      {t("customers.detail.patientCode", "Patient Code")}
                    </label>
                    <p className="text-slate-900 font-bold text-lg">{selectedCustomer.patientCode || "-"}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                    <label className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2 block">
                      {t("customers.detail.gender", "Gender")}
                    </label>
                    <p className="text-slate-900 font-bold text-lg">{selectedCustomer.gender || "-"}</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-100">
                    <label className="text-xs font-bold text-orange-700 uppercase tracking-wider mb-2 block">
                      {t("customers.detail.dateOfBirth", "Date of Birth")}
                    </label>
                    <p className="text-slate-900 font-bold text-lg">
                      {selectedCustomer.dateOfBirth
                        ? formatDate(selectedCustomer.dateOfBirth)
                        : "-"}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-4 rounded-xl border border-cyan-100">
                    <label className="text-xs font-bold text-cyan-700 uppercase tracking-wider mb-2 block">
                      {t("customers.detail.phone", "Phone Number")}
                    </label>
                    <p className="text-slate-900 font-bold text-lg">{selectedCustomer.phone || "-"}</p>
                  </div>
                  <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-4 rounded-xl border border-pink-100">
                    <label className="text-xs font-bold text-pink-700 uppercase tracking-wider mb-2 block">
                      {t("customers.detail.email", "Email")}
                    </label>
                    <p className="text-slate-900 font-bold text-lg">{selectedCustomer.email || "-"}</p>
                  </div>
                  <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-slate-50 to-gray-50 p-4 rounded-xl border border-slate-200">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">
                      {t("customers.detail.address", "Address")}
                    </label>
                    <p className="text-slate-900 font-medium">{selectedCustomer.address || "-"}</p>
                  </div>
                  <div className="bg-gradient-to-br from-teal-50 to-emerald-50 p-4 rounded-xl border border-teal-100">
                    <label className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-2 block">
                      {t("customers.detail.status", "Status")}
                    </label>
                      <span
                      className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold shadow-md ${
                          selectedCustomer.isActive
                          ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-200/50"
                          : "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-red-200/50"
                        }`}
                      >
                        {selectedCustomer.isActive
                        ? t("customers.table.active", "Active")
                        : t("customers.table.inactive", "Inactive")}
                      </span>
                  </div>
                  <div className="bg-gradient-to-br from-violet-50 to-purple-50 p-4 rounded-xl border border-violet-100">
                    <label className="text-xs font-bold text-violet-700 uppercase tracking-wider mb-2 block">
                      {t("customers.detail.userId", "Account ID")}
                    </label>
                    <p className="text-slate-900 font-bold text-lg">
                      {selectedCustomer.userId ? selectedCustomer.userId : t("customers.detail.noAccount", "None")}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-xl border border-indigo-100">
                    <label className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2 block">
                      {t("customers.detail.createdAt", "Created")}
                    </label>
                    <p className="text-slate-900 font-medium">{formatDate(selectedCustomer.createdAt)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-4 rounded-xl border border-amber-100">
                    <label className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 block">
                      {t("customers.detail.updatedAt", "Last Updated")}
                    </label>
                    <p className="text-slate-900 font-medium">{formatDate(selectedCustomer.updatedAt)}</p>
                </div>
              </div>

                <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-200">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedCustomer(null);
                  }}
                    className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium text-base"
                >
                    {t("customers.actions.close", "Close")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

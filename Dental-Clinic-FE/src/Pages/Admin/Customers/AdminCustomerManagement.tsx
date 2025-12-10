import { useEffect, useState, useMemo, useCallback } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from "react-i18next";
import { FaEye, FaBan, FaCheckCircle } from "react-icons/fa";
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
          // Xử lý phản hồi có phân trang hoặc không phân trang
          if (Array.isArray(data)) {
            setCustomers(data);
            setTotalPages(0);
            setTotalElements(data.length);
          } else if (data && typeof data === 'object' && 'content' in data) {
            setCustomers(data.content || []);
            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0);
          } else {
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
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("pageTitles.customerManagement", "Quản lý khách hàng")}
        </h1>
        <p className="text-sm text-gray-600">
          {t(
            "customers.pageDescription",
            "Tổng quan về tất cả khách hàng trong hệ thống, bao gồm thông tin liên hệ và lịch sử."
          )}
        </p>
      </div>

      {/* Thanh tìm kiếm và bộ lọc */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("customers.filters.search", "Tìm kiếm")}
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              placeholder={t(
                "customers.filters.searchPlaceholder",
                "Tìm theo tên, mã bệnh nhân, SĐT hoặc email"
              )}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              {t("customers.actions.search", "Tìm kiếm")}
            </button>
            <button
              onClick={() => {
                setSearch("");
                setFilters({ isActive: null, gender: "all" });
                resetSort();
                fetchCustomers();
              }}
              className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100 transition"
            >
              {t("customers.actions.clear", "Xóa")}
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
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
            <span className="text-sm font-medium text-blue-900">
              Đã chọn {selectedIds.size} khách hàng
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkToggleStatus(true)}
                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
              >
                Kích hoạt
              </button>
              <button
                onClick={() => handleBulkToggleStatus(false)}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition"
              >
                Vô hiệu hóa
              </button>
              <button
                onClick={clearSelection}
                className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-100 transition"
              >
                Bỏ chọn
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bảng danh sách khách hàng */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isIndeterminate;
                  }}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  aria-label="Chọn tất cả"
                />
              </th>
              <TableSortHeader
                label={t("customers.table.customer", "Khách hàng")}
                sortKey="fullName"
                currentSortKey={sortState.key}
                currentDirection={sortState.direction}
                onSort={handleSort}
              />
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t("customers.table.contact", "Liên hệ")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t("customers.table.address", "Địa chỉ")}
              </th>
              <TableSortHeader
                label={t("customers.table.status", "Trạng thái")}
                sortKey="isActive"
                currentSortKey={sortState.key}
                currentDirection={sortState.direction}
                onSort={handleSort}
              />
              <TableSortHeader
                label={t("customers.table.createdAt", "Ngày tạo")}
                sortKey="createdAt"
                currentSortKey={sortState.key}
                currentDirection={sortState.direction}
                onSort={handleSort}
              />
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t("customers.table.actions", "Thao tác")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {/* Hiển thị trạng thái loading hoặc không có dữ liệu */}
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  {t("customers.messages.loading", "Đang tải khách hàng...")}
                </td>
              </tr>
            ) : filteredAndSortedCustomers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  {t("customers.messages.noData", "Không tìm thấy khách hàng")}
                </td>
              </tr>
            ) : (
              filteredAndSortedCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(customer.id)}
                      onChange={() => toggleSelect(customer.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      aria-label={`Chọn ${customer.fullName}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 text-sm font-semibold">
                          {customer.fullName?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{customer.fullName}</div>
                        <div className="text-xs text-gray-500">
                          {customer.patientCode ? `Mã: ${customer.patientCode}` : `ID: ${customer.id}`}
                        </div>
                        {customer.userId && (
                          <div className="text-xs text-blue-600">Có tài khoản</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <div className="flex flex-col">
                      <span>{customer.phone || "-"}</span>
                      <span className="text-xs text-gray-500">{customer.email || "-"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                    {customer.address || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        customer.isActive
                          ? "bg-green-100 text-green-700 border border-green-200"
                          : "bg-red-100 text-red-700 border border-red-200"
                      }`}
                    >
                      {customer.isActive
                        ? t("customers.table.active", "Hoạt động")
                        : t("customers.table.inactive", "Không hoạt động")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatDate(customer.createdAt)}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDetail(customer.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                        title={t("customers.actions.viewDetail", "Xem chi tiết")}
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(customer)}
                        disabled={updatingId === customer.id}
                        className={`p-2 rounded transition ${
                          customer.isActive
                            ? "text-red-600 hover:bg-red-50"
                            : "text-green-600 hover:bg-green-50"
                        } ${updatingId === customer.id ? "opacity-50 cursor-not-allowed" : ""}`}
                        title={
                          customer.isActive
                            ? t("customers.actions.block", "Chặn khách hàng")
                            : t("customers.actions.unblock", "Bỏ chặn khách hàng")
                        }
                      >
                        {customer.isActive ? <FaBan /> : <FaCheckCircle />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Phân trang cho bảng */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-700">
            {t("common.showing", "Hiển thị")} {page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalElements)} {t("common.of", "của")} {totalElements} {t("common.results", "kết quả")}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
            >
              {t("common.previous", "Trước")}
            </button>
            <div className="flex items-center gap-1">
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
                    className={`px-3 py-2 rounded-lg text-sm transition ${
                      page === pageNum
                        ? "bg-blue-600 text-white"
                        : "border hover:bg-gray-50"
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
              className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
            >
              {t("common.next", "Sau")}
            </button>
          </div>
        </div>
      )}

      {/* Modal xem chi tiết khách hàng */}
      {showDetailModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {t("customers.detail.title", "Chi tiết khách hàng")}
                </h2>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedCustomer(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      {t("customers.detail.fullName", "Họ và tên")}
                    </label>
                    <p className="text-gray-900">{selectedCustomer.fullName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      {t("customers.detail.patientCode", "Mã bệnh nhân")}
                    </label>
                    <p className="text-gray-900">{selectedCustomer.patientCode || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      {t("customers.detail.gender", "Giới tính")}
                    </label>
                    <p className="text-gray-900">{selectedCustomer.gender || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      {t("customers.detail.dateOfBirth", "Ngày sinh")}
                    </label>
                    <p className="text-gray-900">
                      {selectedCustomer.dateOfBirth
                        ? formatDate(selectedCustomer.dateOfBirth)
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      {t("customers.detail.phone", "Số điện thoại")}
                    </label>
                    <p className="text-gray-900">{selectedCustomer.phone || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      {t("customers.detail.email", "Email")}
                    </label>
                    <p className="text-gray-900">{selectedCustomer.email || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-700">
                      {t("customers.detail.address", "Địa chỉ")}
                    </label>
                    <p className="text-gray-900">{selectedCustomer.address || "-"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      {t("customers.detail.status", "Trạng thái")}
                    </label>
                    <p className="text-gray-900">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          selectedCustomer.isActive
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "bg-red-100 text-red-700 border border-red-200"
                        }`}
                      >
                        {selectedCustomer.isActive
                          ? t("customers.table.active", "Hoạt động")
                          : t("customers.table.inactive", "Không hoạt động")}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      {t("customers.detail.userId", "ID Tài khoản")}
                    </label>
                    <p className="text-gray-900">
                      {selectedCustomer.userId ? selectedCustomer.userId : t("customers.detail.noAccount", "Không có")}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      {t("customers.detail.createdAt", "Ngày tạo")}
                    </label>
                    <p className="text-gray-900">{formatDate(selectedCustomer.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      {t("customers.detail.updatedAt", "Cập nhật lần cuối")}
                    </label>
                    <p className="text-gray-900">{formatDate(selectedCustomer.updatedAt)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedCustomer(null);
                  }}
                  className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100 transition"
                >
                  {t("customers.actions.close", "Đóng")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

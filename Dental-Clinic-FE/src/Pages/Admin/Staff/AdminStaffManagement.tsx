import { useEffect, useState, useMemo, useCallback } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from "react-i18next";
import { adminApi, type AdminStaff } from "../../../services/admin/adminApi";
import { formatDate } from "../../../utils/adminUtils";
import { useDebounce } from "../../../hooks/useDebounce";
import { useAdminApi } from "../../../hooks/useAdminApi";
import { useTableSort } from "../../../hooks/useTableSort";
import TableSortHeader from "../../../components/admin/TableSortHeader";
import AdvancedFilters, { type FilterOption } from "../../../components/admin/AdvancedFilters";

export default function AdminStaffManagement() {
  const { t } = useTranslation("admin");
  const [staff, setStaff] = useState<AdminStaff[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [filters, setFilters] = useState<Record<string, any>>({
    active: null,
    department: "all",
    role: "all",
  });
  const pageSize = 20;
  const debouncedSearch = useDebounce(search, 500);
  const { loading, execute } = useAdminApi<any>();

  // Sắp xếp dữ liệu bảng (dùng custom hook)
  const { sortState, handleSort, sortData, resetSort } = useTableSort<AdminStaff>();

  // Hàm lấy danh sách nhân viên từ API
  const fetchStaff = useCallback(async (keyword?: string, pageNum: number = 0) => {
    await execute(
      () => adminApi.staff.getAll({ 
        search: keyword, 
        page: pageNum, 
        size: pageSize 
      }),
      {
        showErrorToast: true,
        errorMessage: t("staff.messages.loadFailed", "Unable to load staff"),
        onSuccess: (data) => {
          // Xử lý trường hợp trả về mảng hoặc dạng phân trang
          if (Array.isArray(data)) {
            setStaff(data);
            setTotalPages(0);
            setTotalElements(data.length);
          } else if (data && typeof data === 'object' && 'content' in data) {
            setStaff(data.content || []);
            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0);
          } else {
            setStaff([]);
            setTotalPages(0);
            setTotalElements(0);
          }
        },
      }
    );
  }, []);

  // Lọc + sort dữ liệu hiện tại sau khi API trả về
  const filteredAndSortedStaff = useMemo(() => {
    let filtered = [...staff];

    if (filters.active !== null) {
      filtered = filtered.filter((s) => s.active === filters.active);
    }
    if (filters.department && filters.department !== "all") {
      filtered = filtered.filter((s) => s.departmentName === filters.department);
    }
    if (filters.role && filters.role !== "all") {
      filtered = filtered.filter((s) => s.roles.includes(filters.role));
    }

    return sortData(filtered);
  }, [staff, filters, sortData]);

  // Lấy danh sách phòng ban và vai trò unique phục vụ bộ lọc động
  const filterOptions = useMemo(() => {
    const departments = Array.from(new Set(staff.map((s) => s.departmentName).filter(Boolean))) as string[];
    const roles = Array.from(new Set(staff.flatMap((s) => s.roles)));
    
    return [
      {
        key: "active",
        label: "Trạng thái",
        type: "boolean" as const,
      },
      {
        key: "department",
        label: "Phòng ban",
        type: "select" as const,
        options: [
          { value: "all", label: "Tất cả" },
          ...departments.map((d) => ({ value: d, label: d })),
        ],
      },
      {
        key: "role",
        label: "Vai trò",
        type: "select" as const,
        options: [
          { value: "all", label: "Tất cả" },
          ...roles.map((r) => ({ value: r, label: r })),
        ],
      },
    ] as FilterOption[];
  }, [staff]);

  // Fetch lại danh sách khi search thay đổi (debounce)
  useEffect(() => {
    setPage(0);
    fetchStaff(debouncedSearch.trim() || undefined, 0);
  }, [debouncedSearch, fetchStaff]);

  // Fetch lại khi chuyển trang
  useEffect(() => {
    fetchStaff(debouncedSearch.trim() || undefined, page);
  }, [page, debouncedSearch, fetchStaff]);

  // Hàm xử lý khi nhấn Tìm kiếm
  const handleSearch = useCallback(() => {
    setPage(0);
    fetchStaff(search.trim() || undefined, 0);
  }, [search, fetchStaff]);


  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900">{t("pageTitles.staffManagement", "Staff Management")}</h1>
        <p className="text-sm text-gray-600">
          {t(
            "staff.pageDescription",
            "Overview of all employees in the organization, including their roles, departments, and clinic assignments."
          )}
        </p>
      </div>

      {/* Thanh tìm kiếm và bộ lọc nâng cao */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("staff.filters.search", "Search")}
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              placeholder={t("staff.filters.searchPlaceholder", "Search by name, email, phone, or code")}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              {t("staff.actions.search", "Search")}
            </button>
            <button
              onClick={() => {
                setSearch("");
                setFilters({ active: null, department: "all", role: "all" });
                resetSort();
                fetchStaff();
              }}
              className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100 transition"
            >
              {t("staff.actions.clear", "Clear")}
            </button>
            <AdvancedFilters
              filters={filterOptions}
              values={filters}
              onChange={setFilters}
              onReset={() => {
                setFilters({ active: null, department: "all", role: "all" });
              }}
            />
          </div>
        </div>

      </div>

      {/* Bảng danh sách nhân viên */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <TableSortHeader
                label={t("staff.table.employee", "Employee")}
                sortKey="fullName"
                currentSortKey={sortState.key}
                currentDirection={sortState.direction}
                onSort={handleSort}
              />
              <TableSortHeader
                label={t("staff.table.department", "Department")}
                sortKey="departmentName"
                currentSortKey={sortState.key}
                currentDirection={sortState.direction}
                onSort={handleSort}
              />
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t("staff.table.roles", "Roles")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t("staff.table.clinics", "Clinics")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t("staff.table.contact", "Contact")}
              </th>
              <TableSortHeader
                label={t("staff.table.status", "Status")}
                sortKey="active"
                currentSortKey={sortState.key}
                currentDirection={sortState.direction}
                onSort={handleSort}
              />
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t("staff.table.resignation", "Resignation")}
              </th>
              <TableSortHeader
                label={t("staff.table.createdAt", "Created At")}
                sortKey="createdAt"
                currentSortKey={sortState.key}
                currentDirection={sortState.direction}
                onSort={handleSort}
              />
              <TableSortHeader
                label={t("staff.table.lastLogin", "Last Login")}
                sortKey="lastLoginAt"
                currentSortKey={sortState.key}
                currentDirection={sortState.direction}
                onSort={handleSort}
              />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              // Hiển thị dòng loading khi đang lấy dữ liệu
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-gray-500">
                  {t("staff.messages.loading", "Loading staff...")}
                </td>
              </tr>
            ) : filteredAndSortedStaff.length === 0 ? (
              // Hiển thị khi không có dữ liệu
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-gray-500">
                  {t("staff.messages.noData", "No staff found")}
                </td>
              </tr>
            ) : (
              // Hiển thị các dòng nhân viên
              filteredAndSortedStaff.map((person) => (
                <tr key={person.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    {/* Hiển thị avatar và thông tin cơ bản */}
                    <div className="flex items-center gap-3">
                      {person.avatarUrl ? (
                        <img
                          src={person.avatarUrl}
                          alt={person.fullName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500 text-sm font-semibold">
                            {person.fullName?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{person.fullName}</div>
                        <div className="text-xs text-gray-500">
                          {person.code ? `#${person.code}` : `ID: ${person.id}`}
                        </div>
                        {person.username && (
                          <div className="text-xs text-gray-500">{person.username}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {person.departmentName || t("staff.table.noDepartment", "Not assigned")}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {person.roles.length > 0 ? person.roles.join(", ") : t("staff.table.noRole", "N/A")}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {person.clinics.length > 0 ? person.clinics.join(", ") : t("staff.table.noClinic", "N/A")}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <div className="flex flex-col">
                      <span>{person.phone || "-"}</span>
                      <span className="text-xs text-gray-500">{person.email || "-"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {/* Trạng thái hoạt động */}
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        person.active
                          ? "bg-green-100 text-green-700 border border-green-200"
                          : "bg-red-100 text-red-700 border border-red-200"
                      }`}
                    >
                      {person.active
                        ? t("staff.table.active", "Active")
                        : t("staff.table.inactive", "Inactive")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {/* Duyệt nghỉ việc */}
                    {person.hasApprovedResignation ? (
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                        {t("staff.table.approvedResignation", "Approved Resignation")}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatDate(person.createdAt)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatDate(person.lastLoginAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Phân trang khi số trang nhiều hơn 1 */}
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
              {/* Ô chọn số trang */}
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
    </div>
  );
}

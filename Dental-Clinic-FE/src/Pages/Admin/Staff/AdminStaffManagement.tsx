import { useEffect, useState, useMemo, useCallback } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from "react-i18next";
import { Building2 } from "lucide-react";
import { adminApi, type AdminStaff } from "../../../services/admin/adminApi";
import { formatDate } from "../../../utils/adminUtils";
import { useDebounce } from "../../../hooks/useDebounce";
import { useAdminApi } from "../../../hooks/useAdminApi";
import { useTableSort } from "../../../hooks/useTableSort";
import TableSortHeader from "../../../components/admin/TableSortHeader";
import { Filter } from "lucide-react";
import { type FilterOption } from "../../../components/admin/AdvancedFilters";

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
          // Backend luôn trả về Page response với pagination
          if (data && typeof data === 'object' && 'content' in data) {
            setStaff(data.content || []);
            setTotalPages(data.totalPages || 0);
            setTotalElements(data.totalElements || 0);
          } else {
            // Fallback nếu response không đúng format
            console.warn("Unexpected response format from staff API:", data);
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

  // Đếm số bộ lọc đang được áp dụng
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.active !== null) count++;
    if (filters.department && filters.department !== "all") count++;
    if (filters.role && filters.role !== "all") count++;
    return count;
  }, [filters]);

  // Lấy danh sách phòng ban và vai trò unique phục vụ bộ lọc động
  const filterOptions = useMemo(() => {
    const departments = Array.from(new Set(staff.map((s) => s.departmentName).filter(Boolean))) as string[];
    const roles = Array.from(new Set(staff.flatMap((s) => s.roles)));
    
    return [
      {
        key: "active",
        label: t("staff.filters.status", "Status"),
        type: "boolean" as const,
      },
      {
        key: "department",
        label: t("staff.filters.department", "Department"),
        type: "select" as const,
        options: [
          { value: "all", label: t("staff.filters.allDepartments", "All departments") },
          ...departments.map((d) => ({ value: d, label: d })),
        ],
      },
      {
        key: "role",
        label: t("staff.filters.role", "Role"),
        type: "select" as const,
        options: [
          { value: "all", label: t("staff.filters.allRoles", "All roles") },
          ...roles.map((r) => ({ value: r, label: r })),
        ],
      },
    ] as FilterOption[];
  }, [staff, t]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 p-8">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="max-w-7xl mx-auto space-y-8">

      <section className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg ring-4 ring-purple-100">
          <Building2 className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">{t("pageTitles.staffManagement", "Staff Management")}</h1>
          <p className="text-sm text-gray-600 font-medium mt-1">
            {t("staff.pageDescription", "Manage employees and their assignments")}
        </p>
      </div>
      </section>

      {/* Thanh tìm kiếm và bộ lọc nâng cao */}
      <section className="bg-white/90 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 shadow-xl space-y-6">
        {/* Search bar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">
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
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gradient-to-br from-white to-slate-50/50 hover:border-blue-300"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSearch}
              className="px-6 py-3 text-base font-medium bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all"
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
              className="px-6 py-3 text-base font-medium border-2 border-slate-300 rounded-xl text-gray-700 hover:bg-slate-50 hover:border-slate-400 transition-all"
            >
              {t("staff.actions.clear", "Clear")}
            </button>
          </div>
        </div>

        {/* Inline Filters */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-200">
          <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            {t("common.filters", "Filters")}:
          </span>
          
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-600 whitespace-nowrap">
              {t("staff.filters.status", "Status")}:
            </label>
            <select
              value={filters.active === null ? "all" : filters.active ? "true" : "false"}
              onChange={(e) => {
                const val = e.target.value === "all" ? null : e.target.value === "true";
                setFilters({ ...filters, active: val });
              }}
              className="px-4 py-2 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-blue-300 font-medium text-slate-700 min-w-[120px]"
              aria-label={t("staff.filters.status", "Status")}
            >
              <option value="all">{t("common.all", "All")}</option>
              <option value="true">{t("staff.table.active", "Active")}</option>
              <option value="false">{t("staff.table.inactive", "Inactive")}</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-600 whitespace-nowrap">
              {t("staff.filters.department", "Department")}:
            </label>
            <select
              value={filters.department || "all"}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="px-4 py-2 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-blue-300 font-medium text-slate-700 min-w-[180px]"
              aria-label={t("staff.filters.department", "Department")}
            >
              <option value="all">{t("staff.filters.allDepartments", "All departments")}</option>
              {filterOptions.find(f => f.key === "department")?.options?.slice(1).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-600 whitespace-nowrap">
              {t("staff.filters.role", "Role")}:
            </label>
            <select
              value={filters.role || "all"}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="px-4 py-2 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white hover:border-blue-300 font-medium text-slate-700 min-w-[150px]"
              aria-label={t("staff.filters.role", "Role")}
            >
              <option value="all">{t("staff.filters.allRoles", "All roles")}</option>
              {filterOptions.find(f => f.key === "role")?.options?.slice(1).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Active filters indicator */}
          {activeFiltersCount > 0 && (
            <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
              <span className="text-xs font-semibold text-blue-700">
                {activeFiltersCount} {activeFiltersCount === 1 ? 'filter' : 'filters'} active
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Bảng danh sách nhân viên */}
      <section className="bg-white/90 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200/60 bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
              <Building2 className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Staff Directory</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50">
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
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                {t("staff.table.roles", "Roles")}
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                {t("staff.table.clinics", "Clinics")}
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
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
          <tbody className="bg-white divide-y divide-slate-200">
            {loading ? (
              // Hiển thị dòng loading khi đang lấy dữ liệu
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span>{t("staff.messages.loading", "Loading staff...")}</span>
                  </div>
                </td>
              </tr>
            ) : filteredAndSortedStaff.length === 0 ? (
              // Hiển thị khi không có dữ liệu
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                  {t("staff.messages.noData", "No staff found")}
                </td>
              </tr>
            ) : (
              // Hiển thị các dòng nhân viên
              filteredAndSortedStaff.map((person) => (
                <tr key={person.id} className="hover:bg-gradient-to-r hover:from-purple-50/30 hover:to-pink-50/20 transition-all duration-200">
                  <td className="px-6 py-5">
                    {/* Hiển thị avatar và thông tin cơ bản */}
                    <div className="flex items-center gap-4">
                      {person.avatarUrl ? (
                        <img
                          src={person.avatarUrl}
                          alt={person.fullName}
                          className="w-12 h-12 rounded-2xl object-cover shadow-lg ring-4 ring-purple-100"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg ring-4 ring-purple-100">
                          <span className="text-white text-base font-bold">
                            {person.fullName?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-slate-900 text-base">{person.fullName}</div>
                        <div className="text-sm text-slate-500">
                          {person.code ? `#${person.code}` : `ID: ${person.id}`}
                        </div>
                        {person.username && (
                          <div className="text-xs text-slate-400">{person.username}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-700">
                    {person.departmentName || <span className="italic text-slate-400">{t("staff.table.noDepartment", "Not assigned")}</span>}
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-700">
                    {person.roles.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {person.roles.map((role, idx) => (
                          <span key={idx} className="inline-flex px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-semibold shadow-md">
                            {role}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="italic text-slate-400">{t("staff.table.noRole", "N/A")}</span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-700">
                    {person.clinics.length > 0 ? person.clinics.join(", ") : <span className="italic text-slate-400">{t("staff.table.noClinic", "N/A")}</span>}
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-700">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{person.phone || "-"}</span>
                      <span className="text-xs text-slate-500">{person.email || "-"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm">
                    {/* Trạng thái hoạt động */}
                    <span
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold shadow-lg whitespace-nowrap ${
                        person.active
                          ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-200/50"
                          : "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-red-200/50"
                      }`}
                    >
                      {person.active
                        ? t("staff.table.active", "Active")
                        : t("staff.table.inactive", "Inactive")}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-sm">
                    {/* Duyệt nghỉ việc */}
                    {person.hasApprovedResignation ? (
                      <span className="inline-flex px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-200/50">
                        {t("staff.table.approvedResignation", "Approved Resignation")}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-700">{formatDate(person.createdAt)}</td>
                  <td className="px-6 py-5 text-sm text-slate-700">{formatDate(person.lastLoginAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </section>

      {/* Phân trang khi số trang nhiều hơn 1 */}
      {totalPages > 1 && (
        <section className="flex items-center justify-between bg-white/90 backdrop-blur-sm border border-slate-200/60 rounded-2xl px-6 py-4 shadow-xl">
          <div className="text-base text-slate-700 font-medium">
            {t("common.showing", "Hiển thị")} <span className="font-semibold">{page * pageSize + 1}</span> - <span className="font-semibold">{Math.min((page + 1) * pageSize, totalElements)}</span> {t("common.of", "của")} <span className="font-semibold">{totalElements}</span> {t("common.results", "kết quả")}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="px-5 py-2.5 text-sm font-medium border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
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
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      page === pageNum
                        ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200/50"
                        : "border border-slate-300 hover:bg-slate-50"
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
              className="px-5 py-2.5 text-sm font-medium border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-all"
            >
              {t("common.next", "Sau")}
            </button>
          </div>
        </section>
      )}
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { hrApi } from "../../../services/hr/hrApi";
import type { HrEmployee, Department } from "../../../services/hr/hrApi";
import { useHrApi } from "../../../hooks/useHrApi";
import {
  Search,
  Filter,
  UserPlus,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from "react-i18next";

// Dropdown thao tác từng nhân viên - xử lý vị trí và hành động
function DropdownCell({
  isOpen,
  onToggle,
  onViewProfile,
  onHardDelete,
  hasApprovedResignation,
  isHr,
  t
}: {
  isOpen: boolean;
  onToggle: () => void;
  onViewProfile: () => void;
  onHardDelete?: () => void;
  hasApprovedResignation?: boolean;
  isHr?: boolean;
  t: (key: string) => string;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && buttonRef.current && dropdownRef.current) {
      // Căn vị trí dropdown để tránh bị tràn lề màn hình
      const updatePosition = () => {
        if (!buttonRef.current || !dropdownRef.current) return;
        const btnRect = buttonRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const margin = 8;
        const dropdownWidth = 208;

        dropdownRef.current.style.position = 'fixed';
        dropdownRef.current.style.zIndex = '9999';

        // Nếu còn đủ chỗ bên phải thì dropdown bật phải, ngược lại qua trái
        const spaceOnRight = viewportWidth - btnRect.right;
        if (spaceOnRight >= dropdownWidth + margin) {
          dropdownRef.current.style.left = `${btnRect.right + margin}px`;
          dropdownRef.current.style.right = 'auto';
        } else {
          dropdownRef.current.style.right = `${viewportWidth - btnRect.left + margin}px`;
          dropdownRef.current.style.left = 'auto';
        }

        // Nếu gần sát đáy thì bật lên trên, ngược lại bám top
        const isNearBottom = btnRect.bottom > (viewportHeight - 200);
        if (isNearBottom) {
          dropdownRef.current.style.bottom = `${viewportHeight - btnRect.top}px`;
          dropdownRef.current.style.top = 'auto';
        } else {
          dropdownRef.current.style.top = `${btnRect.top}px`;
          dropdownRef.current.style.bottom = 'auto';
        }
      };
      setTimeout(updatePosition, 0);
    }
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="p-1 rounded hover:bg-gray-100 transition-colors"
        title={t("list.table.moreActions")}
      >
        <MoreVertical className="w-4 h-4 text-gray-600" />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[100]" onClick={onToggle}></div>
          <div
            ref={dropdownRef}
            className="w-52 bg-white rounded-xl border border-gray-200 shadow-xl ring-1 ring-black ring-opacity-5 py-1.5 transition-all duration-200"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewProfile();
              }}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 hover:text-[#3366FF] flex items-center gap-3 transition-colors duration-150"
            >
              <Eye className="w-4 h-4" />
              {t("list.table.viewProfile")}
            </button>
            {/* Chỉ HR mới được xóa vĩnh viễn và chỉ khi đã duyệt nghỉ việc */}
            {isHr && hasApprovedResignation && onHardDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onHardDelete();
                }}
                className="w-full px-4 py-2.5 text-left text-sm text-red-700 hover:bg-red-100 hover:text-red-800 flex items-center gap-3 transition-colors duration-150 font-semibold border-t border-red-200 mt-1 pt-2"
              >
                <Trash2 className="w-4 h-4" />
                {t("list.table.hardDeleteEmployee")}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function EmployeesList() {
  const { t, i18n } = useTranslation(["employees", "web"]);
  const navigate = useNavigate();
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const { execute: executeApi } = useHrApi<any>();

  const [employees, setEmployees] = useState<HrEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filter, search
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [roleId, setRoleId] = useState<number | null>(null);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<{ id: number; roleName: string }[]>([]);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  // Trạng thái hoạt động của nhân viên
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "resignation">("active");

  useEffect(() => {
    fetchMasterData();
  }, []);

  useEffect(() => {
    // Khi thay đổi filter hoặc phân trang thì gọi lại danh sách
    fetchEmployees();
  }, [page, size, search, departmentId, roleId, statusFilter]);

  // Lấy phòng ban và role để lọc danh sách
  const fetchMasterData = async () => {
    await executeApi(hrApi.management.getDepartments, {
      onSuccess: (data: any) => {
        setDepartments((data as Department[]) || []);
      },
      errorMessage: t("messages.cannotLoadMasterData"),
    });

    await executeApi(hrApi.management.getRoles, {
      onSuccess: (data: any) => {
        setRoles((data as { id: number; roleName: string }[]) || []);
      },
      errorMessage: t("messages.cannotLoadMasterData"),
    });
  };

  // Lấy danh sách nhân viên theo phân trang, bộ lọc
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        size,
      };
      if (search && search.trim()) params.search = search.trim();
      if (departmentId !== null && departmentId !== undefined) params.departmentId = Number(departmentId);
      if (roleId !== null && roleId !== undefined) params.roleId = Number(roleId);
      // Không gửi isActive nếu lọc theo nghỉ việc
      if (statusFilter !== "resignation" && statusFilter !== "all") {
        params.isActive = statusFilter === "active";
      }

      const response = await executeApi(
        () => hrApi.employees.getAll(params),
        {
          errorMessage: t("messages.cannotLoadList"),
          showErrorToast: false,
        }
      ) as { content: HrEmployee[]; totalPages: number; totalElements: number } | null;

      if (!response || !response.content) {
        setEmployees([]);
        setTotalPages(0);
        setTotalElements(0);
        setLoading(false);
        return;
      }

      let employeesList = response.content || [];

      // Nếu chọn nghỉ việc thì chỉ giữ lại những ai đã duyệt đơn nghỉ
      if (statusFilter === "resignation") {
        employeesList = employeesList.filter((emp: HrEmployee) => emp.hasApprovedResignation === true);
      }
      let totalElementsValue = response.totalElements || 0;
      let totalPagesValue = response.totalPages || 0;

      // Nếu BE trả về 0 nhưng vẫn có data thì lấy số lượng bằng API thống kê
      if (totalElementsValue === 0 && employeesList.length > 0) {
        const statsParams: any = {};
        if (departmentId !== null && departmentId !== undefined) {
          statsParams.departmentId = departmentId;
        }
        // Không truyền roleId, isActive khi thống kê
        const statsRes = (await executeApi(
          () => hrApi.employees.getStatistics(statsParams),
          {
            showErrorToast: false,
          }
        )) as { totalEmployees?: number } | null;
        if (statsRes?.totalEmployees !== undefined && statsRes.totalEmployees > 0) {
          totalElementsValue = statsRes.totalEmployees;
        }
      }

      // Nếu vẫn không có totalElements nhưng có content, ước tính từ content.length
      if (totalElementsValue === 0 && employeesList.length > 0) {
        // Nếu content.length = size, có thể còn trang tiếp theo
        if (employeesList.length === size) {
          // Ước tính totalElements để cho phép có trang tiếp theo
          totalElementsValue = (page + 1) * size + 1; // Ước tính tối thiểu
          totalPagesValue = Math.ceil(totalElementsValue / size);
        } else {
          // Đây là trang cuối
          totalElementsValue = page * size + employeesList.length;
          totalPagesValue = page + 1;
        }
      } else if (totalPagesValue === 0 && totalElementsValue > 0) {
        // Tính totalPages từ totalElements
        totalPagesValue = Math.ceil(totalElementsValue / size);
      } else if (totalPagesValue === 0 && employeesList.length > 0) {
        // Có content nhưng không có totalElements và totalPages
        totalElementsValue = employeesList.length;
        totalPagesValue = 1;
      }

      // Đảm bảo totalPages ít nhất là 1 nếu có dữ liệu
      if (totalPagesValue === 0 && employeesList.length > 0) {
        totalPagesValue = 1;
        totalElementsValue = employeesList.length;
      }

      console.log('Employees List:', {
        page,
        size,
        contentLength: employeesList.length,
        totalElements: totalElementsValue,
        totalPages: totalPagesValue,
        backendTotalElements: response.totalElements,
        backendTotalPages: response.totalPages
      });

      setEmployees(employeesList);
      setTotalPages(totalPagesValue);
      setTotalElements(totalElementsValue);
    } catch (err: any) {
      setEmployees([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý tìm kiếm
  const handleSearch = () => {
    setSearch(searchInput);
    setPage(0);
  };

  const handleResetFilters = () => {
    setSearch("");
    setSearchInput("");
    setDepartmentId(null);
    setRoleId(null);
    setStatusFilter("active");
    setPage(0);
  };

  // Khi đổi filter thì reset về trang đầu
  const handleFilterChange = () => {
    setPage(0);
  };

  // Hàm xóa vĩnh viễn nhân viên - chỉ HR mới dùng và phải nhập lý do
  const handleHardDelete = async (employeeId: number, employeeName: string) => {
    // Hiển thị cảnh báo xác nhận
    const warningMessage = t("web:leaveRequest.resignation.hardDelete.confirmMessage", { name: employeeName });

    if (!window.confirm(warningMessage)) return;

    let reason = prompt(t("web:leaveRequest.resignation.hardDelete.reasonPrompt"));

    if (!reason || reason.trim() === "") {
      toast.warning(t("web:leaveRequest.resignation.hardDelete.enterReason"));
      return;
    }

    if (reason.trim().length < 10) {
      toast.warning(t("web:leaveRequest.resignation.hardDelete.reasonTooShort"));
      return;
    }

    // Xác nhận lần cuối
    const finalConfirm = window.confirm(
      t("web:leaveRequest.resignation.hardDelete.finalConfirm", { name: employeeName })
    );

    if (!finalConfirm) return;

    const result = await executeApi(() => hrApi.employees.hardDelete(employeeId, reason.trim()), {
      onSuccess: () => {
        toast.success(t("web:leaveRequest.resignation.hardDelete.success"));
        fetchEmployees();
      },
      errorMessage: t("web:leaveRequest.resignation.hardDelete.failed"),
    });

    if (!result) {
      // Error đã được xử lý bởi useHrApi
      return;
    }
  };

  // Kiểm tra xem user hiện tại có phải HR không
  const isHr = () => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        const roles = user.roles || [];
        return roles.some((r: string) => r.toUpperCase() === "HR");
      }
      const rolesStr = localStorage.getItem("roles");
      if (rolesStr) {
        const roles = JSON.parse(rolesStr);
        return Array.isArray(roles) && roles.some((r: string) => r.toUpperCase() === "HR");
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="p-6 min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-[#0D1B3E] mb-2">
                {t("list.title")}
              </h1>
              <p className="text-gray-600 text-base">
                {t("list.total")} <span className="font-extrabold text-gray-900">{(totalElements || 0).toLocaleString()}</span> {t("list.employees")}
              </p>
            </div>
            <button
              onClick={() => navigate("/hr/employees/create")}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              {t("list.addEmployee")}
            </button>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-800">{t("list.filters")}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("list.search.label")}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                    placeholder={t("list.search.placeholder")}
                    className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSearch}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    title={t("list.search.button")}
                    aria-label={t("list.search.button")}
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("list.department.label")}
                </label>
                <select
                  value={departmentId ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setDepartmentId(value ? Number(value) : null);
                    handleFilterChange();
                  }}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label={t("list.department.label")}
                >
                  <option value="">{t("list.department.all")}</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.departmentName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("list.role.label")}
                </label>
                <select
                  value={roleId ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setRoleId(value ? Number(value) : null);
                    handleFilterChange();
                  }}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label={t("list.role.label")}
                >
                  <option value="">{t("list.role.all")}</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.roleName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lọc theo trạng thái */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("list.status.label")}
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    const value = e.target.value as "all" | "active" | "inactive" | "resignation";
                    setStatusFilter(value);
                    handleFilterChange();
                  }}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label={t("list.status.label")}
                >
                  <option value="all">{t("list.status.all")}</option>
                  <option value="active">{t("list.status.active")}</option>
                  <option value="inactive">{t("list.status.locked")}</option>
                  <option value="resignation">{t("list.status.resignation")}</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 text-gray-700 border rounded hover:bg-gray-100"
              >
                {t("list.clearFilters")}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200">
            {loading ? (
              <div className="p-8 text-center text-gray-500">{t("list.loading")}</div>
            ) : employees.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {t("list.noEmployeeFound")}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t("list.table.name")}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t("list.table.department")}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t("list.table.position")}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t("list.table.status")}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t("list.table.joinDate")}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t("list.table.actions")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {employees.map((employee) => {
                        const isDropdownOpen = openDropdown === employee.id;
                        return (
                          <tr
                            key={employee.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                                  {employee.avatarUrl ? (
                                    <img
                                      src={employee.avatarUrl.startsWith('http') ? employee.avatarUrl : `${apiBase}${employee.avatarUrl.startsWith('/') ? employee.avatarUrl : '/' + employee.avatarUrl}`}
                                      alt={employee.fullName}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        // Nếu lỗi tải ảnh, hiện ký tự đầu
                                        const target = e.currentTarget as HTMLImageElement;
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        if (parent && !parent.querySelector('span')) {
                                          const fallback = document.createElement('span');
                                          fallback.className = 'text-gray-500 text-xs font-medium';
                                          fallback.textContent = employee.fullName.charAt(0).toUpperCase();
                                          parent.appendChild(fallback);
                                        }
                                      }}
                                    />
                                  ) : (
                                    <span className="text-gray-500 text-xs font-medium">
                                      {employee.fullName.charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm font-medium text-gray-900">
                                  {employee.fullName}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {employee.department?.departmentName || "-"}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {employee.role?.roleName || "-"}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${employee.isActive
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                                  }`}
                              >
                                {employee.isActive ? t("status.active") : t("status.inactive")}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                              {employee.createdAt
                                ? new Date(employee.createdAt).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-CA', {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                })
                                : t("common.na")}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                              <DropdownCell
                                isOpen={isDropdownOpen}
                                onToggle={() => setOpenDropdown(isDropdownOpen ? null : employee.id)}
                                onViewProfile={() => {
                                  navigate(`/hr/employees/${employee.id}`);
                                  setOpenDropdown(null);
                                }}
                                onHardDelete={employee.hasApprovedResignation && isHr() ? () => {
                                  handleHardDelete(employee.id, employee.fullName);
                                  setOpenDropdown(null);
                                } : undefined}
                                hasApprovedResignation={employee.hasApprovedResignation}
                                isHr={isHr()}
                                t={t}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Phân trang bảng nhân viên */}
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">
                      {t("list.pagination.show")}{" "}
                      <select
                        value={size}
                        onChange={(e) => {
                          setSize(Number(e.target.value));
                          setPage(0);
                        }}
                        className="border rounded px-2 py-1 mx-1"
                        aria-label={t("list.pagination.itemsPerPage")}
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      {t("list.pagination.of")} {totalElements} {t("list.pagination.results")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(0)}
                      disabled={page === 0}
                      className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                      title={t("list.pagination.first")}
                      aria-label={t("list.pagination.first")}
                    >
                      {t("list.pagination.first")}
                    </button>
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 0}
                      className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                      title={t("list.pagination.previous")}
                      aria-label={t("list.pagination.previous")}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-700">
                      {t("list.pagination.page")} {page + 1} / {totalPages || 1}
                    </span>
                    <button
                      onClick={() => {
                        if (totalPages > 0 && page < totalPages - 1) {
                          setPage(page + 1);
                        }
                      }}
                      disabled={totalPages <= 0 || page >= totalPages - 1}
                      className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                      title={t("list.pagination.next")}
                      aria-label={t("list.pagination.next")}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (totalPages > 0) {
                          setPage(totalPages - 1);
                        }
                      }}
                      disabled={totalPages <= 0 || page >= totalPages - 1}
                      className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                      title={t("list.pagination.last")}
                      aria-label={t("list.pagination.last")}
                    >
                      {t("list.pagination.last")}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default EmployeesList;
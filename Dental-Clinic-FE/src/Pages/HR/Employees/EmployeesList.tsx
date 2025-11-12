import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
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

type Employee = {
  id: number;
  code: string;
  fullName: string;
  email: string;
  phone: string;
  username: string;
  avatarUrl?: string;
  isActive: boolean;
  department?: { id: number; departmentName: string };
  role?: { id: number; roleName: string };
  clinic?: { id: number; clinicName: string };
  roleAtClinic?: string;
  createdAt?: string;
  lastLoginAt?: string;
};

type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
};

type Department = {
  id: number;
  departmentName: string;
};

// Component để xử lý dropdown với auto-positioning
function DropdownCell({ 
  isOpen, 
  onToggle, 
  onViewProfile, 
  onDelete, 
  t 
}: { 
  isOpen: boolean; 
  onToggle: () => void; 
  onViewProfile: () => void; 
  onDelete: () => void; 
  t: (key: string) => string;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && buttonRef.current && dropdownRef.current) {
      // Đơn giản: kiểm tra xem button có ở cuối trang không
      const updatePosition = () => {
        if (!buttonRef.current || !dropdownRef.current) return;
        
        const btnRect = buttonRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const margin = 4;
        
        // Kiểm tra xem button có ở cuối trang không (trong 200px cuối cùng của viewport)
        const isNearBottom = btnRect.bottom > (viewportHeight - 200);
        
        if (isNearBottom) {
          // Ở cuối trang → hiển thị lên trên bằng fixed positioning
          dropdownRef.current.style.position = 'fixed';
          dropdownRef.current.style.top = 'auto';
          // bottom = khoảng cách từ đáy viewport đến đỉnh button
          dropdownRef.current.style.bottom = `${viewportHeight - btnRect.top + margin}px`;
          dropdownRef.current.style.right = `${viewportWidth - btnRect.right}px`;
          dropdownRef.current.style.left = 'auto';
          dropdownRef.current.style.marginBottom = '0';
          dropdownRef.current.style.marginTop = '0';
        } else {
          // Ở đầu/giữa trang → hiển thị xuống dưới bằng absolute positioning
          dropdownRef.current.style.position = 'absolute';
          dropdownRef.current.style.top = '100%';
          dropdownRef.current.style.bottom = 'auto';
          dropdownRef.current.style.right = '0';
          dropdownRef.current.style.left = 'auto';
          dropdownRef.current.style.marginTop = `${margin}px`;
          dropdownRef.current.style.marginBottom = '0';
        }
      };
      
      // Đợi DOM render xong
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
          <div
            className="fixed inset-0 z-10"
            onClick={onToggle}
          ></div>
          <div 
            ref={dropdownRef}
            className="absolute right-0 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1"
          >
            <button
              onClick={onViewProfile}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              {t("list.table.viewProfile")}
            </button>
            <button
              onClick={onDelete}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {t("list.table.deleteEmployee")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function EmployeesList() {
  const { t, i18n } = useTranslation("employees");
  const navigate = useNavigate();
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const accessToken = localStorage.getItem("accessToken");

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Lọc - filter
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [roleId, setRoleId] = useState<number | null>(null);
  const [isActive, setIsActive] = useState<boolean | null>(null);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<{ id: number; roleName: string }[]>([]);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  useEffect(() => {
    fetchMasterData();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [page, size, search, departmentId, roleId, isActive]);

  // Lấy danh sách phòng ban và vai trò từ backend
  const fetchMasterData = async () => {
    try {
      const departmentsRes = await axios.get<Department[]>(
        `${apiBase}/api/hr/management/departments`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      setDepartments(departmentsRes.data || []);

      const rolesRes = await axios.get<{ id: number; roleName: string }[]>(
        `${apiBase}/api/hr/management/roles`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      setRoles(rolesRes.data || []);
    } catch (err: any) {
      console.error("Error fetching master data:", err);
      // Báo lỗi khi không lấy được phòng ban/vai trò
      let errorMsg = t("messages.cannotLoadMasterData");

      if (err?.response?.data) {
        const errorData = err.response.data;
        errorMsg = errorData.message || errorData.error || errorMsg;
      } else if (err?.message) {
        errorMsg = err.message;
      }

      toast.error(errorMsg);
    }
  };

  // Lấy danh sách nhân viên từ backend và xử lý lỗi
  const fetchEmployees = async () => {
    if (!accessToken || !apiBase) {
      toast.error(t("messages.pleaseLogin"));
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params: any = {
        page,
        size,
      };
      if (search && search.trim()) params.search = search.trim();
      if (departmentId !== null && departmentId !== undefined) params.departmentId = Number(departmentId);
      if (roleId !== null && roleId !== undefined) params.roleId = Number(roleId);
      if (isActive !== null && isActive !== undefined) params.isActive = Boolean(isActive);

      const response = await axios.get<PageResponse<Employee>>(
        `${apiBase}/api/hr/employees`,
        {
          params,
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      const employeesList = response.data.content || [];
      let totalElementsValue = response.data.totalElements;
      
      // Nếu totalElements = 0 nhưng có content, có thể backend trả về sai
      // Gọi statistics endpoint để lấy total chính xác (giống dashboard)
      if ((!totalElementsValue || totalElementsValue === 0) && employeesList.length > 0) {
        try {
          const statsParams: any = {};
          if (departmentId !== null && departmentId !== undefined) {
            statsParams.departmentId = departmentId;
          }
          // Không truyền roleId và isActive vào statistics vì endpoint này không hỗ trợ
          
          const statsRes = await axios.get<{ totalEmployees?: number }>(
            `${apiBase}/api/hr/employees/statistics`,
            {
              params: statsParams,
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );
          
          if (statsRes.data?.totalEmployees !== undefined && statsRes.data.totalEmployees > 0) {
            totalElementsValue = statsRes.data.totalEmployees;
            console.log("Using totalEmployees from statistics endpoint:", totalElementsValue);
          }
        } catch (statsErr) {
          console.warn("Failed to fetch statistics, using totalElements from page response:", statsErr);
        }
      }

      setEmployees(employeesList);
      setTotalPages(response.data.totalPages || 0);
      setTotalElements(totalElementsValue ?? 0);
    } catch (err: any) {
      console.error("Error fetching employees:", err);
      // Báo lỗi khi không lấy được danh sách nhân viên
      let errorMsg = t("messages.cannotLoadList");

      if (err?.response?.data) {
        const errorData = err.response.data;
        errorMsg = errorData.message || errorData.error || errorMsg;
      } else if (err?.message) {
        errorMsg = err.message;
      }

      toast.error(errorMsg);
      // Reset về 0 khi có lỗi
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

  // Xử lý xóa tất cả filter
  const handleResetFilters = () => {
    setSearch("");
    setSearchInput("");
    setDepartmentId(null);
    setRoleId(null);
    setIsActive(null);
    setPage(0);
  };

  // Đưa trang về đầu khi thay đổi filter
  const handleFilterChange = () => {
    setPage(0);
  };

  // Xử lý xóa nhân viên (confirm và truyền reason), xử lý lỗi trả về
  const handleDelete = async (employeeId: number, employeeName: string) => {
    if (!accessToken) {
      toast.error(t("delete.needLogin"));
      return;
    }

    const confirmMessage = t("delete.confirm", { name: employeeName });
    if (!window.confirm(confirmMessage)) return;

    const reason = prompt(t("delete.reason"));
    if (!reason || reason.trim() === "") {
      toast.warning(t("delete.enterReason"));
      return;
    }

    try {
      await axios.delete(
        `${apiBase}/api/hr/employees/${employeeId}`,
        {
          params: { reason: reason.trim() },
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      toast.success(t("delete.success"));
      fetchEmployees();
    } catch (err: any) {
      console.error("Error deleting employee:", err);
      let errorMsg = t("delete.failed");

      if (err?.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === "string") {
          errorMsg = errorData;
        } else if (errorData.message) {
          errorMsg = errorData.message;
        } else if (errorData.error) {
          errorMsg = errorData.error;
        }
      } else if (err?.response?.status === 401) {
        errorMsg = t("delete.sessionExpired");
      } else if (err?.response?.status === 403) {
        errorMsg = t("delete.noPermission");
      } else if (err?.response?.status === 404) {
        errorMsg = t("delete.notExist");
      } else if (err?.message) {
        errorMsg = err.message;
      }

      toast.error(errorMsg);
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("list.status.label")}
                </label>
                <select
                  value={isActive === null ? "" : isActive ? "true" : "false"}
                  onChange={(e) => {
                    const value = e.target.value;
                    const newValue = value === "" ? null : value === "true";
                    setIsActive(newValue);
                    handleFilterChange();
                  }}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label={t("list.status.label")}
                >
                  <option value="">{t("list.status.all")}</option>
                  <option value="true">{t("list.status.active")}</option>
                  <option value="false">{t("list.status.locked")}</option>
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
                <div className="overflow-x-auto overflow-y-visible">
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
                                        // Fallback to initial if image fails to load
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
                              {(employee.role as any)?.roleName || "-"}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${
                                  employee.isActive
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
                                onDelete={() => {
                                  handleDelete(employee.id, employee.fullName);
                                  setOpenDropdown(null);
                                }}
                                t={t}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

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
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages - 1}
                      className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                      title={t("list.pagination.next")}
                      aria-label={t("list.pagination.next")}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPage(totalPages - 1)}
                      disabled={page >= totalPages - 1}
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


import { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from "react-i18next";

type AdminStaff = {
  id: number;
  code?: string;
  fullName: string;
  username?: string;
  email?: string;
  phone?: string;
  active: boolean;
  departmentName?: string | null;
  roles: string[];
  clinics: string[];
  createdAt?: string;
  lastLoginAt?: string;
  avatarUrl?: string | null;
};

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";

function formatDate(value?: string) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return value;
  }
}

export default function AdminStaffManagement() {
  const { t } = useTranslation("admin");
  const [staff, setStaff] = useState<AdminStaff[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const accessToken = localStorage.getItem("accessToken");

  const fetchStaff = async (keyword?: string) => {
    if (!accessToken) {
      toast.error(t("attendance.messages.noAccessToken", "Missing access token"));
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get<AdminStaff[]>(`${apiBase}/api/admin/staff`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: keyword ? { search: keyword } : undefined,
      });
      setStaff(response.data || []);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        t("staff.messages.loadFailed", "Unable to load staff");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    fetchStaff(search.trim());
  };

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

      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col gap-4 md:flex-row md:items-end">
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
              fetchStaff();
            }}
            className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100 transition"
          >
            {t("staff.actions.clear", "Clear")}
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t("staff.table.employee", "Employee")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t("staff.table.department", "Department")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t("staff.table.roles", "Roles")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t("staff.table.clinics", "Clinics")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t("staff.table.contact", "Contact")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t("staff.table.status", "Status")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t("staff.table.createdAt", "Created At")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                {t("staff.table.lastLogin", "Last Login")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                  {t("staff.messages.loading", "Loading staff...")}
                </td>
              </tr>
            ) : staff.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                  {t("staff.messages.noData", "No staff found")}
                </td>
              </tr>
            ) : (
              staff.map((person) => (
                <tr key={person.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
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
                  <td className="px-4 py-3 text-sm text-gray-700">{formatDate(person.createdAt)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{formatDate(person.lastLoginAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


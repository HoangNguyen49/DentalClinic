import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  FaChartBar,
  FaClipboardList,
  FaUser,
  FaHospital,
  FaClock,
  FaSignOutAlt,
  FaCogs,
  FaUsers,
  FaBox,
  FaFileContract,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";

import NotificationBell from "../../widgets/NotificationBell";

const AdminLayout = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("admin"); // namespace "admin"

  // Hàm chuyển đổi ngôn ngữ
  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "vi" : "en";
    i18n.changeLanguage(newLang);
    localStorage.setItem("lang", newLang);
  };

  // Hàm đăng xuất admin
  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("roles");
    localStorage.removeItem("user");
    sessionStorage.clear();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar hiển thị menu cho admin */}
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-6 border-b">
          <div className="text-2xl font-bold text-blue-600 mb-2">{t("brand.name", "Dental Admin")}</div>
          <div className="text-sm text-gray-500">{t("brand.subtitle", "Sunshine Dental Care")}</div>
        </div>
        <nav className="flex flex-col gap-1 px-4 py-4 flex-1 overflow-y-auto">
          <NavItem to="/admin" label={t("nav.dashboard", "Dashboard")} icon={<FaChartBar />} />
          <NavItem
            to="/admin/attendance"
            label={t("nav.attendance", "Attendance")}
            icon={<FaClock />}
          />
          <NavItem to="/admin/clinics" label={t("nav.clinics", "Clinics")} icon={<FaHospital />} />
          <NavItem to="/admin/reports" label={t("nav.reports", "Reports")} icon={<FaChartBar />} />
          <NavItem to="/admin/leave-requests" label={t("nav.leaveRequests", "Leave Requests")} icon={<FaClipboardList />} />
          <NavItem to="/admin/staff" label={t("nav.staff", "Staff")} icon={<FaUser />} />
          <NavItem to="/admin/customers" label={t("nav.customers", "Customers")} icon={<FaUsers />} />
          <NavItem to="/admin/inventory" label={t("nav.inventory", "Inventory")} icon={<FaBox />} />
          <NavItem to="/admin/payroll/contract" label={t("nav.salaryContracts", "Salary Contracts")} icon={<FaFileContract />} />
          <NavItem to="/admin/system" label={t("nav.system", "System")} icon={<FaCogs />} />
        </nav>
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-md text-red-600 hover:bg-red-50 transition"
          >
            <FaSignOutAlt />
            <span>{t("logout", "Logout")}</span>
          </button>
        </div>
      </aside>

      {/* Nội dung chính */}
      <div className="flex-1 flex flex-col">
        {/* Thanh topbar gồm tiêu đề, chuông thông báo, chuyển ngôn ngữ và nút về trang chủ */}
        <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">{t("pageTitles.adminDashboard")}</h1>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={toggleLanguage}
              className="px-3 py-2 border rounded hover:bg-gray-100"
              title="Change Language"
            >
              {i18n.language === "en" ? "🇻🇳" : "🇺🇸"}
            </button>
            <button
              onClick={() => navigate("/")}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              {t("nav.backToWebsite")}
            </button>
          </div>
        </header>

        {/* Outlet render component con theo từng route cụ thể */}
        <main className="p-6 overflow-y-auto flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Component cho từng item trong menu sidebar admin
const NavItem = ({
  to,
  label,
  icon,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
}) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-2 rounded-md text-gray-700 hover:bg-blue-100 transition ${isActive ? "bg-blue-200 font-semibold text-blue-700" : ""
      }`
    }
  >
    <span className="text-lg">{icon}</span>
    {label}
  </NavLink>
);

export default AdminLayout;

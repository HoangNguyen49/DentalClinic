import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  FaCalendarAlt,
  FaFileInvoice,
  FaChartBar,
  FaUserMd,
  FaClipboardList,
  FaBoxes,
  FaUser,
  FaComments,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";

const AdminLayout = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("admin"); // namespace "admin"

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "vi" : "en";
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-6 text-2xl font-bold text-blue-600">Dental Admin</div>
        <nav className="flex flex-col gap-1 px-4">
          <NavItem to="/admin" label={t("nav.dashboard")} icon={<FaChartBar />} />
          <NavItem to="/admin/appointments" label={t("nav.appointments")} icon={<FaCalendarAlt />} />
          <NavItem to="/admin/treatments" label={t("nav.treatments")} icon={<FaClipboardList />} />
          <NavItem to="/admin/rooms" label={t("nav.rooms")} icon={<FaUserMd />} />
          <NavItem to="/admin/invoices" label={t("nav.invoices")} icon={<FaFileInvoice />} />
          <NavItem to="/admin/medical-records" label={t("nav.medicalRecords")} icon={<FaClipboardList />} />
          <NavItem to="/admin/inventory" label={t("nav.inventory")} icon={<FaBoxes />} />
          <NavItem to="/admin/reports" label={t("nav.reports")} icon={<FaChartBar />} />
          <NavItem to="/admin/staff" label={t("nav.staff")} icon={<FaUser />} />
          <NavItem to="/admin/crm" label={t("nav.crm")} icon={<FaComments />} />
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">{t("pageTitles.adminDashboard")}</h1>
          <div className="flex items-center gap-2">
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

        {/* Content */}
        <main className="p-6 overflow-y-auto flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

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
      `flex items-center gap-3 px-4 py-2 rounded-md text-gray-700 hover:bg-blue-100 ${
        isActive ? "bg-blue-200 font-semibold" : ""
      }`
    }
  >
    <span className="text-lg">{icon}</span>
    {label}
  </NavLink>
);

export default AdminLayout;

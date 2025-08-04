import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { FaCalendarAlt, FaFileInvoice, FaChartBar, FaUserMd, FaClipboardList, FaBoxes, FaUser, FaComments } from "react-icons/fa";

const AdminLayout = () => {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-6 text-2xl font-bold text-blue-600">
          Dental Admin
        </div>
        <nav className="flex flex-col gap-1 px-4">
          <NavItem to="/admin" label="Dashboard" icon={<FaChartBar />} />
          <NavItem to="/admin/appointments" label="Appointments" icon={<FaCalendarAlt />} />
          <NavItem to="/admin/treatments" label="Treatments" icon={<FaClipboardList />} />
          <NavItem to="/admin/rooms" label="Rooms" icon={<FaUserMd />} />
          <NavItem to="/admin/invoices" label="Invoices" icon={<FaFileInvoice />} />
          <NavItem to="/admin/medical-records" label="Medical Records" icon={<FaClipboardList />} />
          <NavItem to="/admin/inventory" label="Inventory" icon={<FaBoxes />} />
          <NavItem to="/admin/reports" label="Reports" icon={<FaChartBar />} />
          <NavItem to="/admin/staff" label="Staff" icon={<FaUser />} />
          <NavItem to="/admin/crm" label="CRM" icon={<FaComments />} />
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Admin Dashboard</h1>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Back to Website
          </button>
        </header>

        {/* Content */}
        <main className="p-6 overflow-y-auto flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const NavItem = ({ to, label, icon }: { to: string; label: string; icon: React.ReactNode }) => (
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

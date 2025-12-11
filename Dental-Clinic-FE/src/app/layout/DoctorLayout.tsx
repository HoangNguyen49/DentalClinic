import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  FaChartBar,
  FaCalendarAlt,
  FaSignOutAlt,
  FaCalendarCheck

} from "react-icons/fa";

const DoctorLayout = () => {
  const navigate = useNavigate();

 

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("roles");
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-6 border-b">
          <div className="text-2xl font-bold text-blue-600 mb-2">Doctor Portal</div>
          <div className="text-sm text-gray-500">Sunshine Dental Care</div>
        </div>
        <nav className="flex flex-col gap-1 px-4 py-4 flex-1 overflow-y-auto">
          <NavItem to="/doctor/dashboard" label="Dashboard" icon={<FaChartBar />} />
          <NavItem to="/doctor/appointments" label="Appointments" icon={<FaCalendarAlt />} />
             <NavItem to="/doctor/schedule" label="My Schedule" icon={<FaCalendarCheck />} />
        </nav>
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-md text-red-600 hover:bg-red-50 transition"
          >
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">Doctor Dashboard</h1>
          <div className="flex items-center gap-2">
          </div>
        </header>
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
      `flex items-center gap-3 px-4 py-2 rounded-md text-gray-700 hover:bg-blue-100 transition ${
        isActive ? "bg-blue-200 font-semibold text-blue-700" : ""
      }`
    }
  >
    <span className="text-lg">{icon}</span>
    {label}
  </NavLink>
);

export default DoctorLayout;
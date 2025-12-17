import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  FaChartBar, FaCalendarCheck, FaUserClock, FaUsers, FaSignOutAlt, FaHome,
  FaChevronLeft, FaChevronRight // Icon mới
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import NotificationBell from "../../widgets/NotificationBell";
import ReceptionAiChat from "../../Pages/Reception/Dashboard/ReceptionAiChat";

const ReceptionLayout = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  
  // State quản lý thu gọn menu
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "vi" : "en";
    i18n.changeLanguage(newLang);
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-100 font-instrument overflow-hidden">
      
      {/* SIDEBAR: Width thay đổi theo state */}
      <aside 
        className={`bg-white shadow-xl flex flex-col z-20 transition-all duration-300 ease-in-out relative
          ${isCollapsed ? "w-20" : "w-64"}`}
      >
        {/* Toggle Button (Nằm ở mép sidebar) */}
        <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-8 bg-white border border-gray-200 rounded-full p-1 shadow-md text-blue-600 hover:bg-blue-50 z-50"
        >
            {isCollapsed ? <FaChevronRight size={12}/> : <FaChevronLeft size={12}/>}
        </button>

        {/* Logo Area */}
        <div className={`p-6 border-b flex items-center justify-center h-20 ${isCollapsed ? 'px-2' : ''}`}>
          {isCollapsed ? (
             <span className="text-2xl font-bold text-[#3366FF]">S</span>
          ) : (
             <div className="overflow-hidden whitespace-nowrap">
                <div className="text-xl font-bold text-[#3366FF]">Reception</div>
                <div className="text-xs text-gray-500">Sunshine Dental</div>
             </div>
          )}
        </div>
        
        <nav className="flex flex-col gap-2 px-3 py-4 flex-1 overflow-y-auto overflow-x-hidden">
          <NavItem to="/reception/dashboard" label="Dashboard" icon={<FaChartBar />} collapsed={isCollapsed} />
          <NavItem to="/reception/walk-in" label="Walk-in Booking" icon={<FaUserClock />} collapsed={isCollapsed} />
          <NavItem to="/reception/appointments" label="Appointments" icon={<FaCalendarCheck />} collapsed={isCollapsed} />
          <NavItem to="/reception/patients" label="Patients" icon={<FaUsers />} collapsed={isCollapsed} />
        </nav>

        <div className="p-3 border-t">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200 ${isCollapsed ? 'justify-center' : ''}`}
            title="Logout"
          >
            <FaSignOutAlt className="text-lg" />
            {!isCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white shadow-sm px-6 py-3 flex justify-between items-center z-50 h-16 relative">
          <h1 className="text-xl font-bold text-gray-800 truncate">Reception Workspace</h1>
          <div className="flex items-center gap-3 shrink-0">
            <NotificationBell />
            <button
              onClick={toggleLanguage}
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition font-bold text-sm"
            >
              {i18n.language === "en" ? "VI" : "EN"}
            </button>
            <button
              onClick={() => navigate("/")}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition shadow-sm"
            >
              <FaHome />
              {!isCollapsed && "Back to Home"}
            </button>
          </div>
        </header>
        
        <main className="flex-1 overflow-hidden bg-gray-50 p-4">
          <Outlet />
        </main>
        <ReceptionAiChat />
      </div>
    </div>
  );
};

// Updated NavItem
const NavItem = ({ to, label, icon, collapsed }: any) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative
      ${isActive ? "bg-blue-50 text-[#3366FF]" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"}
      ${collapsed ? 'justify-center' : ''}`
    }
  >
    <span className="text-xl shrink-0">{icon}</span>
    
    {!collapsed && (
        <span className="font-medium whitespace-nowrap overflow-hidden transition-all">{label}</span>
    )}

    {/* Tooltip khi collapsed */}
    {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
            {label}
        </div>
    )}
  </NavLink>
);

export default ReceptionLayout;

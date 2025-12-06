import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  FaChartBar,
  FaUser,
  FaCalendarAlt,
  FaUsers,
  FaUserPlus,
  FaSignOutAlt,
  FaFileAlt,
  FaClipboardCheck,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";


// Hàm xử lý layout chính của HR (giao diện dashboard nhân sự)
const HRLayout = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("hr-dashboard");

  // Đổi ngôn ngữ tiếng Anh/tiếng Việt
  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "vi" : "en";
    i18n.changeLanguage(newLang);
  };

  // Đăng xuất: xóa token và chuyển về trang đăng nhập
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
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-6 border-b">
          <div className="text-2xl font-bold text-blue-600 mb-2">HR Management</div>
          <div className="text-sm text-gray-500">Sunshine Dental Care</div>
        </div>
        <nav className="flex flex-col gap-1 px-4 py-4 flex-1 overflow-y-auto">
          <NavItem to="/hr/dashboard" label="Dashboard" icon={<FaChartBar />} />
          <NavItem to="/hr/employees" label="Employee List" icon={<FaUsers />} />
          <NavItem to="/hr/employees/create" label="Add Employee" icon={<FaUserPlus />} />
          <NavItem to="/hr/schedules" label="Schedules" icon={<FaCalendarAlt />} />
          <NavItem to="/hr/schedules/create" label="Create Schedule" icon={<FaCalendarAlt />} />
          <NavItem to="/hr/attendance" label="Attendance" icon={<FaUser />} />
          <NavItem to="/hr/attendance/explanations" label="Attendance Explanations" icon={<FaClipboardCheck />} />
          <NavItem to="/hr/leave-requests" label="Leave Requests" icon={<FaFileAlt />} />
          <NavItem to="/hr/face-profile-approvals" label={t("faceProfileApproval.menuLabel", "Face Profile Approvals")} icon={<FaUser />} />
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
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">HR Dashboard</h1>
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
              Back to Home
            </button>
          </div>
        </header>
        <main className="p-6 overflow-y-auto flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Thành phần hiển thị một mục trong menu sidebar (navigation)
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

export default HRLayout;

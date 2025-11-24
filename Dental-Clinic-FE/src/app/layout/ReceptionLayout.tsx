import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  FaChartBar,
  FaCalendarCheck,
  FaUserClock,
  FaUsers,
  FaSignOutAlt,
  FaHome,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";

// Hàm xử lý layout chính của Reception (giao diện dashboard lễ tân)
const ReceptionLayout = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  // Đổi ngôn ngữ tiếng Anh/tiếng Việt
  const toggleLanguage = () => {
    const newLang = i18n.language === "en" ? "vi" : "en";
    i18n.changeLanguage(newLang);
  };

  // Đăng xuất: xóa token và chuyển về trang đăng nhập
  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user"); // Xóa thông tin user
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-100 font-instrument">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white shadow-md flex flex-col z-20">
        <div className="p-6 border-b">
          <div className="text-2xl font-bold text-[#3366FF] mb-2">Reception Desk</div>
          <div className="text-sm text-gray-500">Sunshine Dental Care</div>
        </div>
        
        <nav className="flex flex-col gap-1 px-4 py-4 flex-1 overflow-y-auto">
          {/* 1. Dashboard chung */}
          <NavItem to="/reception/dashboard" label="Dashboard" icon={<FaChartBar />} />
          
          {/* 2. Đặt lịch Walk-in (Form wizard ta vừa làm) */}
          <NavItem to="/reception/walk-in" label="Walk-in Booking" icon={<FaUserClock />} />
          
          {/* 3. Quản lý danh sách lịch hẹn (CRUD) */}
          <NavItem to="/reception/appointments" label="Appointments" icon={<FaCalendarCheck />} />
          
          {/* 4. Quản lý bệnh nhân (Tìm kiếm, tạo mới hồ sơ) */}
          <NavItem to="/reception/patients" label="Patients" icon={<FaUsers />} />

           {/* 5. Quản lý hóa đơn/thanh toán (Optional - nếu Lễ tân kiêm thu ngân) */}
           {/* <NavItem to="/reception/invoices" label="Invoices" icon={<FaFileInvoiceDollar />} /> */}
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

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow px-6 py-4 flex justify-between items-center z-10">
          <h1 className="text-xl font-semibold text-gray-800">Reception Workspace</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleLanguage}
              className="px-3 py-2 border rounded hover:bg-gray-100 transition"
              title="Change Language"
            >
              {i18n.language === "en" ? "🇻🇳" : "🇺🇸"}
            </button>
            
            <button
              onClick={() => navigate("/")}
              className="bg-[#3366FF] hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 transition"
            >
              <FaHome />
              Back to Home
            </button>
          </div>
        </header>
        
        <main className="p-6 overflow-y-auto flex-1 bg-gray-50">
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
      `flex items-center gap-3 px-4 py-3 rounded-lg transition font-medium ${
        isActive 
          ? "bg-blue-50 text-[#3366FF]" 
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      }`
    }
  >
    <span className="text-lg">{icon}</span>
    {label}
  </NavLink>
);

export default ReceptionLayout;
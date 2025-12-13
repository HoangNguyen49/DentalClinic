import type { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  Receipt,
  BarChart4,
  LogOut,
  PackagePlus,
  Warehouse
} from "lucide-react";

export type SidebarItem = {
  label: string;
  href: string;
  icon: ReactNode;
};

export type SidebarGroup = {
  title: string;
  items: SidebarItem[];
};

function DashboardSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  // --- XỬ LÝ LOGOUT TẠI CHỖ ---
  const handleLogout = () => {
    // 1. Xóa dữ liệu phiên đăng nhập
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    
    // 2. Điều hướng về trang Login
    navigate("/login");
  };

  // ============================
  //   CẤU TRÚC MENU MỚI
  // ============================
  const menuGroups: SidebarGroup[] = [
    {
      title: "Overview",
      items: [
        {
          label: "Dashboard",
          href: "/accountant/dashboard",
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
      ],
    },
    {
      title: "Catalog Management",
      items: [
        {
          label: "List Products",
          href: "/accountant",
          icon: <Package className="w-4 h-4" />,
        },
        {
          label: "Add New Product",
          href: "/accountant/product/create",
          icon: <PlusCircle className="w-4 h-4" />,
        },
      ],
    },
    {
      title: "Inventory Control",
      items: [
          {
          label: "Inventory Overview",
          href: "/accountant/inventory",
          icon: <Warehouse className="w-4 h-4" />,
        },
        {
          label: "Import Stock",
          href: "/accountant/inventory/import",
          icon: <PackagePlus className="w-4 h-4" />,
        },
        
      ],
    },
    {
      title: "Sales & Finance",
      items: [
        {
          label: "Invoices & Orders",
          href: "/accountant/invoices",
          icon: <Receipt className="w-4 h-4" />,
        },
        {
          label: "Revenue Reports",
          href: "/accountant/reports",
          icon: <BarChart4 className="w-4 h-4" />,
        },
      ],
    },
  ];

  return (
    // [FIX] Changed h-screen to h-full (or ensure parent is h-screen) and added sticky if needed
    // Usually fixed h-screen on sidebar is good for dashboard layouts
    <aside className="w-64 bg-white shadow-xl border-r border-gray-100 hidden md:flex flex-col h-screen font-sans sticky top-0">

      {/* HEADER - Fixed at top */}
      <div className="px-6 py-6 border-b border-gray-100 flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-blue-200 shadow-md">
          SD
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800 leading-tight">
            Sunshine Dental
          </p>
          <p className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-1">
            Accountant
          </p>
        </div>
      </div>

      {/* MENU ITEMS (SCROLLABLE) - Takes remaining height */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-8 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
        {menuGroups.map((group, groupIdx) => (
          <div key={groupIdx}>
            {/* Group Title */}
            <h3 className="px-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
              {group.title}
            </h3>

            {/* Group Items */}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive =
                  location.pathname === item.href ||
                  (item.href !== "/accountant" && location.pathname.startsWith(item.href));

                return (
                  <button
                    key={item.href}
                    onClick={() => navigate(item.href)}
                    className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out
                      ${isActive
                        ? "bg-blue-50 text-blue-700 shadow-sm"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }
                    `}
                  >
                    <span
                      className={`transition-colors ${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                        }`}
                    >
                      {item.icon}
                    </span>

                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* FOOTER / LOGOUT - Fixed at bottom */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50 shrink-0">
        <button
          onClick={handleLogout} 
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

export default DashboardSidebar;
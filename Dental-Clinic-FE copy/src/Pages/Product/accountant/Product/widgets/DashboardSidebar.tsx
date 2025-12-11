import type { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  PlusCircle,
  Receipt,
  BarChart3,
  LogOut,
} from "lucide-react";

export type SidebarItem = {
  label: string;
  href: string;
  icon?: ReactNode;
  description?: string;
};

function DashboardSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  // ============================
  //   MENU CHO ROLE ACCOUNTANT
  // ============================
  const items: SidebarItem[] = [
    // {
    //   label: "Dashboard",
    //   href: "",
    //   icon: <LayoutDashboard className="w-4 h-4" />,
    // },
    {
      label: "Product List",
      href: "/accountant",
      icon: <ShoppingCart className="w-4 h-4" />,
    },
    {
      label: "Add Product",
      href: "/accountant/create",
      icon: <PlusCircle className="w-4 h-4" />,
    },
    {
      label: "Invoices",
      href: "/accountant/invoices",
      icon: <Receipt className="w-4 h-4" />,
    },
    {
      label: "Reports",
      href: "/accountant/reports",
      icon: <BarChart3 className="w-4 h-4" />,
    },
  ];

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200 hidden md:flex flex-col">
      {/* HEADER */}
      <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
          AC
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">
            Sunshine Dental Care
          </p>
          <p className="text-xs text-gray-500">Accountant</p>
        </div>
      </div>

      {/* MENU ITEMS */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {items.map((item) => {
          const isActive =
            location.pathname === item.href ||
            location.pathname.startsWith(item.href + "/");

          return (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition
                ${isActive ? "bg-blue-100" : "hover:bg-blue-50"}
              `}
            >
              <span
                className={`mt-0.5 ${
                  isActive ? "text-blue-600" : "text-gray-600"
                }`}
              >
                {item.icon ?? <LayoutDashboard className="w-4 h-4" />}
              </span>

              <span>
                <span
                  className={`block text-sm font-medium ${
                    isActive ? "text-blue-700" : "text-gray-800"
                  }`}
                >
                  {item.label}
                </span>

                {item.description && (
                  <span className="block text-xs text-gray-500">
                    {item.description}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </nav>

      {/* LOGOUT BUTTON */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={() => navigate("/logout")}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default DashboardSidebar;

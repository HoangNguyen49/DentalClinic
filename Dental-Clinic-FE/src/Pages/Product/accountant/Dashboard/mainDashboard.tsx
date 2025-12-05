// src/Pages/Accountant/MainDashboard.tsx
import { Outlet } from "react-router-dom";
import DashboardSidebar from "../Product/widgets/DashboardSidebar";
import DashboardTopbar from "../Product/widgets/DashboardTopbar";
import AppToast from "../Product/widgets/AppToast";

function MainDashboard() {
  const sidebarItems = [
    {
      label: "Products",
      href: "/accountant",
    },
    {
      label: "Create product",
      href: "/accountant/create",
    },
  ];

  return (
    <>
      <AppToast />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
        <DashboardSidebar
          brandTitle="Sunshine Dental Care"
          brandSubtitle="Accountant panel"
          items={sidebarItems}
        />

        <main className="flex-1 flex flex-col">
          <DashboardTopbar
            title="Accountant – Product Management"
            subtitle="Manage dental products, prices and status"
          />

          <section className="flex-1">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <Outlet />
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

export default MainDashboard;

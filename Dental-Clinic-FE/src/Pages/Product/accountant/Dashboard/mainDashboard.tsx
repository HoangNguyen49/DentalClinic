// src/Pages/Accountant/MainDashboard.tsx
import { Outlet } from "react-router-dom";
import DashboardSidebar from "../widgets/DashboardSidebar";
import DashboardTopbar from "../widgets/DashboardTopbar";
import AppToast from "../widgets/AppToast";

function MainDashboard() {
  return (
    <>
      <AppToast />
      
      {/* Layout Container: Full height, flex row */}
      <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
        
        {/* Sidebar (Fixed width handled inside component) */}
        <DashboardSidebar />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0">
          
          {/* Topbar */}
          <DashboardTopbar
            title="Accountant Workspace"
            subtitle="Manage catalog, inventory, invoices and reports"
          />

          {/* Content Scrollable Area */}
          <section className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
              {/* Outlet renders child routes (Product List, Create, Import Stock...) */}
              <Outlet />
            </div>
          </section>
          
        </main>
      </div>
    </>
  );
}

export default MainDashboard;
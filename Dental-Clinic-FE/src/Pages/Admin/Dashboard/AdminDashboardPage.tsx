import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Users,
  BarChart2,
  Settings,
  UserCircle,
  Package,
} from "lucide-react";
import DashboardMetrics from "./DashboardMetrics";
import DashboardRevenueChart from "./DashboardRevenueChart";
import DashboardActivityFeed from "./DashboardActivityFeed";

// Trang dashboard cho quyền Admin
function AdminDashboardPage() {
  const navigate = useNavigate();
  const { t } = useTranslation("admin");

  // Palette màu cho theme dashboard
  const palette = useMemo(
    () => ({
      background: "bg-slate-50",
      surface: "bg-white",
      border: "border-slate-200",
      subtleText: "text-slate-500",
      heading: "text-slate-900",
      accent: "text-blue-600",
      shadow: "shadow-[0_12px_30px_rgba(15,23,42,0.08)]",
    }),
    []
  );

  // Danh sách các mục chức năng chính cho dashboard (hiện thị theo API backend hỗ trợ)
  const sections = [
    {
      key: "reports",
      title: t("dashboard.sections.reports.title", "Báo cáo & Thống kê"),
      description: t(
        "dashboard.sections.reports.description",
        "Xem biểu đồ doanh thu, lịch hẹn, bệnh nhân mới, phòng/ghế/bác sĩ."
      ),
      icon: <BarChart2 className="w-10 h-10 text-sky-600" />,
      link: "/admin/reports",
    },
    {
      key: "staff",
      title: t("dashboard.sections.staff.title", "Quản lý nhân viên"),
      description: t(
        "dashboard.sections.staff.description",
        "Xem danh sách nhân viên, chấm công, đơn nghỉ việc, phòng khám."
      ),
      icon: <Users className="w-10 h-10 text-rose-500" />,
      link: "/admin/staff",
    },
    {
      key: "customers",
      title: t("dashboard.sections.customers.title", "Quản lý khách hàng"),
      description: t(
        "dashboard.sections.customers.description",
        "Xem danh sách khách hàng, thông tin liên hệ và lịch sử."
      ),
      icon: <UserCircle className="w-10 h-10 text-emerald-500" />,
      link: "/admin/customers",
    },
    {
      key: "inventory",
      title: t("dashboard.sections.inventory.title", "Kho sản phẩm"),
      description: t(
        "dashboard.sections.inventory.description",
        "Thống kê sản phẩm đã bán theo từng cơ sở, số lượng tồn kho và sản phẩm sắp hết."
      ),
      icon: <Package className="w-10 h-10 text-purple-500" />,
      link: "/admin/inventory",
    },
    {
      key: "system",
      title: t("dashboard.sections.system.title", "Cấu hình hệ thống"),
      description: t(
        "dashboard.sections.system.description",
        "Thiết lập tham số, ngày nghỉ lễ và xem nhật ký hệ thống."
      ),
      icon: <Settings className="w-10 h-10 text-slate-600" />,
      link: "/admin/system",
    },
  ];

  return (
    <div className={`p-6 min-h-screen ${palette.background}`}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Khu vực tiêu đề và mô tả dashboard */}
        <section className="space-y-2">
          <p className={`text-sm font-medium uppercase tracking-[0.2em] ${palette.subtleText}`}>
            {t("dashboard.subtitle", "Admin control center")}
          </p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className={`text-3xl font-semibold ${palette.heading}`}>
                {t("pageTitles.adminDashboard", "Admin Dashboard")}
              </h1>
              <p className={`text-sm mt-2 ${palette.subtleText}`}>
                {t(
                  "dashboard.description",
                  "Giám sát lịch hẹn, nhân viên, tồn kho và quy trình vận hành trong một nơi duy nhất."
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Khu vực hiển thị các thẻ số liệu tổng quan */}
        <section>
          <DashboardMetrics />
        </section>

        {/* Khu vực hiển thị biểu đồ doanh thu và nhật ký hoạt động */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DashboardRevenueChart />
          </div>
          <div>
            <DashboardActivityFeed />
          </div>
        </section>

        {/* Khu vực các chức năng chính cho admin */}
        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <button
              key={section.key}
              // Điều hướng khi click vào chức năng
              onClick={() => navigate(section.link)}
              className={`
                text-left rounded-2xl border transition-all
                ${palette.surface} ${palette.border} ${palette.shadow}
                hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(15,23,42,0.12)]
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500
              `}
            >
              <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-100">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
                  {section.icon}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mt-1">
                    {t("dashboard.actions.manage", "Quản lý & giám sát")}
                  </p>
                </div>
              </div>
              <p className="px-6 py-5 text-sm text-slate-600">{section.description}</p>
            </button>
          ))}
        </section>
      </div>
    </div>
  );
}

export default AdminDashboardPage;

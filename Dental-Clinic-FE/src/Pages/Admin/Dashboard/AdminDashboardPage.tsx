import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  BellRing,
  Boxes,
  Building,
  CalendarDays,
  FileText,
  Image,
  Stethoscope,
  Users,
  BarChart2,
} from "lucide-react";

function AdminDashboardPage() {
  const navigate = useNavigate();
  const { t } = useTranslation("admin");

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

  const sections = [
    {
      key: "appointments",
      title: t("dashboard.sections.appointments.title", "Quản lý lịch hẹn"),
      description: t(
        "dashboard.sections.appointments.description",
        "Tiếp nhận và kiểm soát trạng thái lịch hẹn."
      ),
      icon: <CalendarDays className="w-10 h-10 text-blue-600" />,
      link: "/admin/appointments",
    },
    {
      key: "treatments",
      title: t("dashboard.sections.treatments.title", "Kế hoạch điều trị"),
      description: t(
        "dashboard.sections.treatments.description",
        "Tạo và theo dõi các plan điều trị của bệnh nhân."
      ),
      icon: <Stethoscope className="w-10 h-10 text-emerald-600" />,
      link: "/admin/treatments",
    },
    {
      key: "rooms",
      title: t("dashboard.sections.rooms.title", "Phòng & Ghế & Bác sĩ"),
      description: t(
        "dashboard.sections.rooms.description",
        "Quản lý phòng khám, ghế và lịch làm việc của bác sĩ."
      ),
      icon: <Building className="w-10 h-10 text-amber-600" />,
      link: "/admin/rooms",
    },
    {
      key: "invoices",
      title: t("dashboard.sections.invoices.title", "Hóa đơn & Thanh toán"),
      description: t(
        "dashboard.sections.invoices.description",
        "Xuất hóa đơn và theo dõi lịch sử thanh toán."
      ),
      icon: <FileText className="w-10 h-10 text-violet-600" />,
      link: "/admin/invoices",
    },
    {
      key: "medical",
      title: t("dashboard.sections.medical.title", "Hình ảnh bệnh án"),
      description: t(
        "dashboard.sections.medical.description",
        "Lưu trữ và quản lý ảnh X-ray và ảnh điều trị."
      ),
      icon: <Image className="w-10 h-10 text-rose-600" />,
      link: "/admin/medical-records",
    },
    {
      key: "inventory",
      title: t("dashboard.sections.inventory.title", "Tồn kho vật tư"),
      description: t(
        "dashboard.sections.inventory.description",
        "Quản lý sản phẩm, vật tư tiêu hao và theo dõi sử dụng."
      ),
      icon: <Boxes className="w-10 h-10 text-indigo-600" />,
      link: "/admin/inventory",
    },
    {
      key: "reports",
      title: t("dashboard.sections.reports.title", "Báo cáo & thống kê"),
      description: t(
        "dashboard.sections.reports.description",
        "Xem biểu đồ doanh thu, lịch hẹn, bệnh nhân mới."
      ),
      icon: <BarChart2 className="w-10 h-10 text-sky-600" />,
      link: "/admin/reports",
    },
    {
      key: "staff",
      title: t("dashboard.sections.staff.title", "Quản lý nhân viên"),
      description: t(
        "dashboard.sections.staff.description",
        "Chấm công, phân quyền và quản lý theo phòng ban."
      ),
      icon: <Users className="w-10 h-10 text-rose-500" />,
      link: "/admin/staff",
    },
    {
      key: "crm",
      title: t("dashboard.sections.crm.title", "CRM & chăm sóc khách hàng"),
      description: t(
        "dashboard.sections.crm.description",
        "Gửi nhắc lịch, email sinh nhật, sale,..."
      ),
      icon: <BellRing className="w-10 h-10 text-orange-500" />,
      link: "/admin/crm",
    },
  ];

  return (
    <div className={`p-6 min-h-screen ${palette.background}`}>
      <div className="max-w-7xl mx-auto space-y-8">
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

        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <button
              key={section.key}
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

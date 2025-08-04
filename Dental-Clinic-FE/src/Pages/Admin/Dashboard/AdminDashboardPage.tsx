import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Stethoscope,
  Building,
  FileText,
  Image,
  Boxes,
  BarChart2,
  Users,
  BellRing
} from "lucide-react";

function AdminDashboardPage() {
  const navigate = useNavigate();

  const sections = [
    {
      title: "Quản lý lịch hẹn",
      description: "Tiếp nhận và kiểm soát trạng thái lịch hẹn.",
      icon: <CalendarDays className="w-10 h-10 text-blue-600" />,
      link: "/admin/appointments",
    },
    {
      title: "Kế hoạch điều trị",
      description: "Tạo và theo dõi các plan điều trị của bệnh nhân.",
      icon: <Stethoscope className="w-10 h-10 text-green-600" />,
      link: "/admin/treatments",
    },
    {
      title: "Phòng & Ghế & Bác sĩ",
      description: "Quản lý phòng khám, ghế và lịch làm việc của bác sĩ.",
      icon: <Building className="w-10 h-10 text-yellow-600" />,
      link: "/admin/rooms",
    },
    {
      title: "Hóa đơn & Thanh toán",
      description: "Xuất hóa đơn và theo dõi lịch sử thanh toán.",
      icon: <FileText className="w-10 h-10 text-purple-600" />,
      link: "/admin/invoices",
    },
    {
      title: "Hình ảnh bệnh án",
      description: "Lưu trữ và quản lý ảnh X-ray và ảnh điều trị.",
      icon: <Image className="w-10 h-10 text-pink-600" />,
      link: "/admin/medical-records",
    },
    {
      title: "Tồn kho vật tư",
      description: "Quản lý sản phẩm, vật tư tiêu hao và theo dõi sử dụng.",
      icon: <Boxes className="w-10 h-10 text-indigo-600" />,
      link: "/admin/inventory",
    },
    {
      title: "Báo cáo & thống kê",
      description: "Xem biểu đồ doanh thu, lịch hẹn, bệnh nhân mới.",
      icon: <BarChart2 className="w-10 h-10 text-emerald-600" />,
      link: "/admin/reports",
    },
    {
      title: "Quản lý nhân viên",
      description: "Chấm công, phân quyền và quản lý theo phòng ban.",
      icon: <Users className="w-10 h-10 text-rose-600" />,
      link: "/admin/staff",
    },
    {
      title: "CRM & chăm sóc khách hàng",
      description: "Gửi nhắc lịch, email sinh nhật, sale,...",
      icon: <BellRing className="w-10 h-10 text-orange-600" />,
      link: "/admin/crm",
    },
  ];

  return (
    <div className="p-6 min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-[#0D1B3E] mb-8">
          Admin Dashboard
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section, index) => (
            <div
              key={index}
              onClick={() => navigate(section.link)}
              className="cursor-pointer rounded-2xl bg-white p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all border border-gray-200"
            >
              <div className="mb-4">{section.icon}</div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                {section.title}
              </h2>
              <p className="text-gray-600 text-sm">{section.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardPage;

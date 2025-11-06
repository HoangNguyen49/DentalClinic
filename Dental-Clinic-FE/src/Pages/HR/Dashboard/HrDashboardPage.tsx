import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Users,
  UserPlus,
  Calendar,
  BarChart3,
  Building2,
  Shield,
  UserCheck,
  UserX,
  Clock,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Các kiểu dữ liệu cho các entity
type EmployeeStatistics = {
  totalEmployees?: number;
  activeEmployees?: number;
  inactiveEmployees?: number;
  byDepartment?: Record<string, number>;
  byRole?: Record<string, number>;
  byClinic?: Record<string, number>;
  message?: string;
};

type EmployeePreview = {
  id: number;
  code: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  isActive: boolean;
  department?: any;
  role?: any;
  clinic?: any;
  roleAtClinic?: string;
  lastLoginAt?: string;
};

type HrDocDto = {
  id: number;
  fullName: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  code?: string;
};

type ClinicResponse = {
  id: number;
  clinicName: string;
};

type RoomResponse = {
  id: number;
  roomName: string;
  clinicId?: number;
  clinicName?: string;
};

type SchedulePreview = {
  id: number;
  doctor: HrDocDto | null;
  clinic: ClinicResponse | null;
  room: RoomResponse | null;
  chair: any;
  workDate: string;
  startTime: string;
  endTime: string;
  status: string;
  note?: string;
};

function HrDashboardPage() {
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState<EmployeeStatistics>({});
  const [recentEmployees, setRecentEmployees] = useState<EmployeePreview[]>([]);
  const [currentSchedule, setCurrentSchedule] = useState<SchedulePreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const accessToken = localStorage.getItem("accessToken");

  // useEffect chính cho việc load dữ liệu dashboard (chỉ chạy một lần khi load page)
  useEffect(() => {
    if (apiBase && accessToken) {
      fetchDashboardData();
    } else {
      setError("Missing API URL or token");
      if (!apiBase) {
        toast.error("API URL is not configured. Please check your .env file");
      }
      if (!accessToken) {
        toast.error("You are not logged in. Please login again.");
      }
      setLoading(false);
    }
  }, []);

  // Hàm chính lấy toàn bộ dữ liệu dashboard từ API
  // Bao gồm: thống kê, danh sách nhân viên gần đây, lịch làm việc tuần hiện tại
  const fetchDashboardData = async () => {
    if (!apiBase || !accessToken) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Lấy thống kê nhân sự
      const statsRes = await axios.get<EmployeeStatistics>(
        `${apiBase}/api/hr/employees/statistics`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setStatistics(statsRes.data || {});

      // Lấy 5 nhân viên gần đây nhất
      const employeesRes = await axios.get<{
        content: EmployeePreview[];
        totalElements: number;
      }>(`${apiBase}/api/hr/employees?page=0&size=5`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setRecentEmployees(employeesRes.data?.content || []);

      // Lấy lịch làm việc của tuần hiện tại (bắt đầu từ thứ Hai)
      try {
        const today = new Date();
        const day = today.getDay();
        // Tính thứ Hai của tuần hiện tại
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(today.setDate(diff));
        const weekStart = monday.toISOString().split("T")[0];

        const scheduleRes = await axios.get<SchedulePreview[]>(
          `${apiBase}/api/hr/schedules/${weekStart}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        const schedules = scheduleRes.data || [];
        setCurrentSchedule(schedules);
      } catch (err: any) {
        setCurrentSchedule([]);
      }
    } catch (err: any) {
      // Xử lý lỗi API và set dữ liệu rỗng để không crash
      const errorMessage = err?.response?.data?.message || err?.message || "Unable to load dashboard data";
      toast.error(errorMessage);
      setStatistics({});
      setRecentEmployees([]);
      setCurrentSchedule([]);
    } finally {
      setLoading(false);
    }
  };

  // Hiển thị các hành động nhanh
  const quickActions = [
    {
      title: "Employee list",
      description: "View and manage all employees",
      icon: <Users className="w-10 h-10 text-blue-600" />,
      link: "/hr/employees",
      color: "bg-blue-50 hover:bg-blue-100",
    },
    {
      title: "Add new employee",
      description: "Create a new employee account",
      icon: <UserPlus className="w-10 h-10 text-green-600" />,
      link: "/hr/employees/create",
      color: "bg-green-50 hover:bg-green-100",
    },
    {
      title: "Work schedule management",
      description: "View and create doctors' work schedules",
      icon: <Calendar className="w-10 h-10 text-purple-600" />,
      link: "/hr/schedules",
      color: "bg-purple-50 hover:bg-purple-100",
    },
    {
      title: "Create new schedule",
      description: "Set up work schedule for a new week",
      icon: <Calendar className="w-10 h-10 text-green-600" />,
      link: "/hr/schedules/create",
      color: "bg-green-50 hover:bg-green-100",
    },
    {
      title: "Statistics & Reports",
      description: "View detailed HR reports",
      icon: <BarChart3 className="w-10 h-10 text-orange-600" />,
      link: "/hr/reports",
      color: "bg-orange-50 hover:bg-orange-100",
    },
  ];

  // Thống kê nhanh ở đầu dashboard
  const statsCards = [
    {
      title: "Total employees",
      value: statistics.totalEmployees || 0,
      icon: <Users className="w-8 h-8 text-blue-600" />,
      color: "bg-blue-50 border-blue-200",
    },
    {
      title: "Active",
      value: statistics.activeEmployees || 0,
      icon: <UserCheck className="w-8 h-8 text-green-600" />,
      color: "bg-green-50 border-green-200",
    },
    {
      title: "Inactive",
      value: statistics.inactiveEmployees || 0,
      icon: <UserX className="w-8 h-8 text-red-600" />,
      color: "bg-red-50 border-red-200",
    },
    {
      title: "Schedules this week",
      value: currentSchedule.length || 0,
      icon: <Calendar className="w-8 h-8 text-purple-600" />,
      color: "bg-purple-50 border-purple-200",
    },
  ];

  if (loading) {
    return (
      <div className="p-6 min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg p-8 shadow-md">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="p-6 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#0D1B3E] mb-2">
                  HR Dashboard
                </h1>
                <p className="text-gray-600">
                  Manage human resources, work schedules and reports
                </p>
              </div>
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsCards.map((card, index) => (
              <div
                key={index}
                className={`${card.color} rounded-xl p-5 border-2 shadow-sm hover:shadow-md transition-shadow`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-2">
                      {card.title}
                    </p>
                    <p className="text-3xl font-bold text-gray-800">
                      {card.value.toLocaleString('en-US')}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {card.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {quickActions.map((action, index) => (
                <div
                  key={index}
                  onClick={() => navigate(action.link)}
                  className={`${action.color} cursor-pointer rounded-xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all border border-gray-200 group`}
                >
                  <div className="mb-3 group-hover:scale-110 transition-transform">
                    {action.icon}
                  </div>
                  <h3 className="text-base font-semibold text-gray-800 mb-1">
                    {action.title}
                  </h3>
                  <p className="text-gray-600 text-xs leading-relaxed">
                    {action.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Recent employees
                </h2>
                <button
                  onClick={() => navigate("/hr/employees")}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline transition"
                >
                  View all →
                </button>
              </div>
              <div className="space-y-2">
                {recentEmployees.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">
                      No employees yet
                    </p>
                  </div>
                ) : (
                  recentEmployees.map((employee) => (
                    <div
                      key={employee.id}
                      onClick={() => navigate(`/hr/employees/${employee.id}`)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 cursor-pointer transition border border-transparent hover:border-blue-200"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {employee.avatarUrl ? (
                          <img
                            src={`${apiBase}${employee.avatarUrl}`}
                            alt={employee.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-blue-700 font-semibold text-sm">
                            {employee.fullName?.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate text-sm">
                          {employee.fullName}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {employee.email}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                          {employee.code && (
                            <span className="px-1.5 py-0.5 bg-gray-100 rounded">
                              {employee.code}
                            </span>
                          )}
                          {employee.role && (
                            <span className="text-gray-400">
                              {typeof employee.role === "object"
                                ? (employee.role as any).roleName || (employee.role as any).name
                                : employee.role}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {employee.isActive ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  This week's schedules
                </h2>
                <button
                  onClick={() => navigate("/hr/schedules")}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline transition"
                >
                  View details →
                </button>
              </div>
              <div className="space-y-2">
                {currentSchedule.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm mb-4">
                      No schedule for this week
                    </p>
                    <button
                      onClick={() => navigate("/hr/schedules/create")}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                    >
                      Create schedule
                    </button>
                  </div>
                ) : (
                  currentSchedule.slice(0, 5).map((schedule) => (
                    <div
                      key={schedule.id}
                      onClick={() => navigate("/hr/schedules")}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 cursor-pointer transition border border-transparent hover:border-purple-200"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate text-sm">
                          {schedule.doctor?.fullName || `Doctor #${schedule.id}`}
                        </p>
                        <p className="text-xs text-gray-600 truncate mt-0.5 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {schedule.clinic?.clinicName || "N/A"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <span>
                            {schedule.workDate ? new Date(schedule.workDate).toLocaleDateString('en-US', {
                              weekday: 'short',
                              day: '2-digit',
                              month: '2-digit'
                            }) : 'N/A'}
                          </span>
                          <span>•</span>
                          <span>{schedule.startTime || 'N/A'} - {schedule.endTime || 'N/A'}</span>
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            schedule.status === "ACTIVE"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {schedule.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {(
            statistics.byDepartment ||
            statistics.byRole ||
            statistics.byClinic) && (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 mb-5 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-orange-600" />
                Human resource allocation
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {statistics.byDepartment && Object.keys(statistics.byDepartment).length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-blue-600" />
                      By Department
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(statistics.byDepartment).map(([dept, count]) => (
                        <div
                          key={dept}
                          className="flex justify-between items-center py-1.5 px-2 rounded hover:bg-white transition"
                        >
                          <span className="text-gray-700 text-sm">{dept || "N/A"}</span>
                          <span className="font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-sm">
                            {count as number}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {statistics.byRole && Object.keys(statistics.byRole).length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-purple-600" />
                      By Role
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(statistics.byRole).map(([role, count]) => (
                        <div
                          key={role}
                          className="flex justify-between items-center py-1.5 px-2 rounded hover:bg-white transition"
                        >
                          <span className="text-gray-700 text-sm">{role || "N/A"}</span>
                          <span className="font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-sm">
                            {count as number}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {statistics.byClinic && Object.keys(statistics.byClinic).length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-green-600" />
                      By Clinic
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(statistics.byClinic).map(([clinic, count]) => (
                        <div
                          key={clinic}
                          className="flex justify-between items-center py-1.5 px-2 rounded hover:bg-white transition"
                        >
                          <span className="text-gray-700 text-sm">{clinic || "N/A"}</span>
                          <span className="font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-sm">
                            {count as number}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default HrDashboardPage;


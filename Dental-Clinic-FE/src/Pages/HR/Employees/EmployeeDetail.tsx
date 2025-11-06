import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  Edit,
  User,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type Employee = {
  id: number;
  code: string;
  fullName: string;
  email: string;
  phone: string;
  username: string;
  avatarUrl?: string;
  isActive: boolean;
  department?: { id: number; departmentName: string };
  role?: { id: number; roleName: string };
  clinic?: { id: number; clinicName: string };
  roleAtClinic?: string;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
};

function EmployeeDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const accessToken = localStorage.getItem("accessToken");

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchEmployeeDetail();
    }
  }, [id]);

  const fetchEmployeeDetail = async () => {
    if (!accessToken || !apiBase || !id) {
      toast.error("Vui lòng đăng nhập");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get<Employee>(
        `${apiBase}/api/hr/employees/${id}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      setEmployee(response.data);
    } catch (err: any) {
      console.error("Error fetching employee:", err);
      let errorMsg = "Không thể tải thông tin nhân viên";

      if (err?.response?.data) {
        const errorData = err.response.data;
        errorMsg = errorData.message || errorData.error || errorMsg;
      } else if (err?.message) {
        errorMsg = err.message;
      }

      toast.error(errorMsg);
      setTimeout(() => {
        navigate("/hr/employees");
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Đang tải thông tin nhân viên...</div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Không tìm thấy nhân viên</div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="min-h-screen bg-gray-50">
        {/* Header with Back Button and Title */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <button
            onClick={() => navigate("/hr/employees")}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại</span>
          </button>
          <h1 className="text-3xl font-semibold">
            <span className="text-gray-400 font-normal">PROFILE</span>
            <span className="text-gray-400 font-normal ml-4">{employee.fullName}</span>
          </h1>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {/* Avatar with Edit Icon */}
                <div className="relative mb-4">
                  <div className="w-32 h-32 rounded-lg bg-gray-200 overflow-hidden flex items-center justify-center mx-auto">
                    {employee.avatarUrl ? (
                      <img
                        src={`${apiBase}${employee.avatarUrl}`}
                        alt={employee.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-16 h-16 text-gray-400" />
                    )}
                  </div>
                  <button
                    onClick={() => navigate(`/hr/employees/${employee.id}/edit`)}
                    className="absolute top-0 right-0 lg:right-auto lg:left-1/2 lg:transform lg:-translate-x-1/2 lg:top-full lg:mt-2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 border border-gray-200"
                    title="Edit avatar"
                  >
                    <Edit className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                {/* Name */}
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
                  {employee.fullName}
                </h2>

                {/* Role Badge */}
                <div className="flex justify-center mb-6">
                  <span className="inline-flex px-4 py-1 rounded-full text-sm font-medium bg-blue-500 text-white">
                    {(employee.role as any)?.roleName || "Employee"}
                  </span>
                </div>

                {/* Key Info Boxes */}
                <div className="space-y-3">
                  {employee.roleAtClinic && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Journey</div>
                      <div className="text-sm font-medium text-gray-900">
                        {employee.roleAtClinic}
                      </div>
                    </div>
                  )}
                  {employee.code && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Registration</div>
                      <div className="text-sm font-medium text-gray-900">
                        {employee.code}
                      </div>
                    </div>
                  )}
                  {employee.createdAt && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Admission date</div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(employee.createdAt)}
                      </div>
                    </div>
                  )}
                  {(employee.role as any)?.roleName && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Position</div>
                      <div className="text-sm font-medium text-gray-900">
                        {(employee.role as any).roleName}
                      </div>
                    </div>
                  )}
                  {(employee.department as any)?.departmentName && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Department</div>
                      <div className="text-sm font-medium text-gray-900">
                        {(employee.department as any).departmentName}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Content */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Content */}
                <div className="p-6">
                  <div className="space-y-6">
                      {/* Personal Data Section */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-gray-900">
                            Personal data
                          </h3>
                          <button
                            onClick={() => navigate(`/hr/employees/${employee.id}/edit`)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                            title="Edit personal data"
                            aria-label="Edit personal data"
                          >
                            <Edit className="w-5 h-5 text-gray-600" />
                          </button>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">
                                Full name
                              </label>
                              <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                                <span className="text-sm font-medium text-gray-900">
                                  {employee.fullName || "-"}
                                </span>
                              </div>
                            </div>
                            {employee.username && (
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block">
                                  Username
                                </label>
                                <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                                  <span className="text-sm font-medium text-gray-900">
                                    {employee.username}
                                  </span>
                                </div>
                              </div>
                            )}
                            {employee.code && (
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block">
                                  Employee Code
                                </label>
                                <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                                  <span className="text-sm font-medium text-gray-900">
                                    {employee.code}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Contact Section */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-gray-900">Contact</h3>
                          <button
                            onClick={() => navigate(`/hr/employees/${employee.id}/edit`)}
                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                            title="Edit contact information"
                            aria-label="Edit contact information"
                          >
                            <Edit className="w-5 h-5 text-gray-600" />
                          </button>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-xs text-gray-500 mb-1 block">
                                E-mail
                              </label>
                              <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                                <span className="text-sm font-medium text-gray-900">
                                  {employee.email || "-"}
                                </span>
                              </div>
                            </div>
                            {employee.phone && (
                              <div>
                                <label className="text-xs text-gray-500 mb-1 block">
                                  Phone
                                </label>
                                <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                                  <span className="text-sm font-medium text-gray-900">
                                    {employee.phone}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </>
  );
}

export default EmployeeDetail;

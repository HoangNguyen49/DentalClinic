import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { X, Save, User, ArrowLeft, Plus } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type Department = {
  id: number;
  departmentName: string;
};

type Role = {
  id: number;
  roleName: string;
};

type Room = {
  id: number;
  roomName: string;
  clinicId?: number;
  clinicName?: string;
};

function CreateEmployeeForm() {
  const navigate = useNavigate();
  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const accessToken = localStorage.getItem("accessToken");

  // State lưu trữ dữ liệu form
  const [code, setCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const password = "123456"; // Mật khẩu mặc định - không cần input
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [roleId, setRoleId] = useState<number | null>(null);
  const [roomId, setRoomId] = useState<number | null>(null);

  // State avatar
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // State cho dropdown
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);

  useEffect(() => {
    fetchOptions();
  }, []);

  // Lấy dữ liệu dropdown từ API
  const fetchOptions = async () => {
    if (!accessToken) return;

    setLoadingOptions(true);
    try {
      const departmentsRes = await axios.get<Department[]>(
        `${apiBase}/api/hr/management/departments`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const departmentsData = departmentsRes.data || [];
      setDepartments(departmentsData);

      const rolesRes = await axios.get<Role[]>(
        `${apiBase}/api/hr/management/roles`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const filteredRoles = (rolesRes.data || []).filter(
        (role) =>
          role.roleName &&
          role.roleName.toUpperCase() !== "ADMIN" &&
          role.roleName.toUpperCase() !== "USER"
      );
      setRoles(filteredRoles);

      const roomsRes = await axios.get<Room[]>(
        `${apiBase}/api/hr/management/rooms`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const roomsData = roomsRes.data || [];
      setRooms(roomsData);
    } catch (err: any) {
      console.error("Error fetching options:", err);

      // Tất cả lỗi phải được xử lý từ backend
      let errorMsg = "Failed to load drop-down data";

      if (err?.response?.data) {
        const errorData = err.response.data;
        if (errorData.message) {
          errorMsg = errorData.message;
        } else if (errorData.error) {
          errorMsg = errorData.error + (errorData.message ? `: ${errorData.message}` : "");
        }
      } else if (err?.message) {
        errorMsg = `Connection error: ${err.message}`;
      }

      toast.error(errorMsg);
    } finally {
      setLoadingOptions(false);
    }
  };

  // Xử lý chọn avatar, validate và tạo preview
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must not exceed 5MB");
      return;
    }

    setAvatarFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Xóa avatar đã chọn
  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  // Xử lý submit form tạo nhân viên (bao gồm upload avatar nếu có)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Chỉ kiểm tra cơ bản ở frontend, validation thực sự sẽ từ backend
    if (!fullName || !email || !roleId) {
      toast.error("Please fill in all required information");
      return;
    }

    setLoading(true);
    try {
      // Tạo nhân viên (validation từ backend)
      const employeeRequest = {
        code: code || undefined,
        fullName,
        email,
        phone: phone || undefined,
        password,
        departmentId: departmentId || undefined,
        roleId,
        roomId: roomId || undefined,
        avatarUrl: undefined,
      };

      const createRes = await axios.post<{ id: number }>(
        `${apiBase}/api/hr/employees`,
        employeeRequest,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const employeeId = createRes.data.id;

      // Upload avatar nếu có file
      if (avatarFile && employeeId) {
        try {
          const formData = new FormData();
          formData.append("file", avatarFile);

          await axios.post(
            `${apiBase}/api/hr/employees/${employeeId}/avatar`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "multipart/form-data",
              },
            }
          );
        } catch (avatarErr: any) {
          console.error("Error uploading avatar:", avatarErr);
          // Xử lý lỗi avatar từ backend
          const avatarErrorData = avatarErr?.response?.data;
          let avatarErrorMsg = "Employee was created but failed to upload avatar";

          if (avatarErrorData) {
            if (avatarErrorData.errors && typeof avatarErrorData.errors === 'object') {
              const errorMessages = Object.entries(avatarErrorData.errors)
                .map(([field, message]) => `${field}: ${message}`)
                .join(", ");
              avatarErrorMsg = errorMessages || avatarErrorData.message || avatarErrorMsg;
            }
            else if (Array.isArray(avatarErrorData.errors)) {
              avatarErrorMsg = avatarErrorData.errors.join(", ");
            }
            else if (avatarErrorData.message) {
              avatarErrorMsg = avatarErrorData.message;
            }
            else if (avatarErrorData.error) {
              avatarErrorMsg = avatarErrorData.error;
            }
          }

          toast.warning(avatarErrorMsg);
        }
      }

      toast.success("Employee created successfully!");
      navigate("/hr/employees");
    } catch (err: any) {
      console.error("Error creating employee:", err);

      // Hiển thị lỗi trả về từ backend
      let errorMsg = "Failed to create employee";

      if (err?.response?.data) {
        const errorData = err.response.data;
        if (errorData.errors && typeof errorData.errors === 'object' && !Array.isArray(errorData.errors)) {
          const errorMessages = Object.entries(errorData.errors)
            .map(([field, message]) => {
              // Map các field sang tiếng Việt cho hiển thị
              const fieldMap: { [key: string]: string } = {
                fullName: "Full name",
                email: "Email",
                phone: "Phone number",
                password: "Password",
                roleId: "Role",
                departmentId: "Department",
                roomId: "Room",
              };
              const fieldName = fieldMap[field] || field;
              return `${fieldName}: ${message}`;
            })
            .join("\n");
          errorMsg = errorMessages || errorData.message || errorMsg;
        }
        else if (Array.isArray(errorData.errors)) {
          errorMsg = errorData.errors.join("\n");
        }
        else if (errorData.validationErrors && Array.isArray(errorData.validationErrors)) {
          errorMsg = errorData.validationErrors.join("\n");
        }
        else if (errorData.message) {
          errorMsg = errorData.message;
        }
        else if (errorData.error) {
          errorMsg = errorData.error + (errorData.message ? `: ${errorData.message}` : "");
        }
      } else if (err?.message) {
        errorMsg = `Connection error: ${err.message}`;
      }

      toast.error(errorMsg, { autoClose: 7000 });
    } finally {
      setLoading(false);
    }
  };

  if (loadingOptions) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading data...</div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <button
            onClick={() => navigate("/hr/employees")}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <h1 className="text-3xl font-semibold">
            <span className="text-gray-400 font-normal">New Employee</span>
          </h1>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <form onSubmit={handleSubmit} noValidate className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 space-y-6">
          <div className="flex justify-center pb-6">
            <div className="relative">
              {avatarPreview ? (
                <div className="relative">
                  <img
                    src={avatarPreview}
                    alt="Preview"
                    className="w-32 h-32 rounded-full object-cover border-2 border-gray-200"
                  />
                  <label className="absolute bottom-0 right-0 cursor-pointer" title="Upload avatar" aria-label="Upload avatar">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                      aria-label="Upload avatar"
                    />
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 shadow-md border-2 border-white">
                      <Plus className="w-5 h-5" />
                    </div>
                  </label>
                  <button
                    type="button"
                    onClick={removeAvatar}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md"
                    title="Remove avatar"
                    aria-label="Remove avatar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                    <User className="w-16 h-16 text-gray-400" />
                  </div>
                  <label className="absolute bottom-0 right-0 cursor-pointer" title="Upload avatar" aria-label="Upload avatar">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                      aria-label="Upload avatar"
                    />
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 shadow-md border-2 border-white">
                      <Plus className="w-5 h-5" />
                    </div>
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter employee code"
                aria-label="Employee code"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter full name"
                aria-label="Full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter email address"
                aria-label="Email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Assignment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={roleId || ""}
                  onChange={(e) =>
                    setRoleId(e.target.value ? Number(e.target.value) : null)
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27m6 8 4 4 4-4%27/%3E%3C/svg%3E')] bg-no-repeat bg-right-2.5 bg-[length:1.5em_1.5em] pr-10"
                  aria-label="Select role"
                >
                  <option value="">Select role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.roleName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <select
                  value={departmentId || ""}
                  onChange={(e) =>
                    setDepartmentId(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27m6 8 4 4 4-4%27/%3E%3C/svg%3E')] bg-no-repeat bg-right-2.5 bg-[length:1.5em_1.5em] pr-10"
                  aria-label="Select department"
                >
                  <option value="">Select department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.departmentName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room
                </label>
                <select
                  value={roomId || ""}
                  onChange={(e) =>
                    setRoomId(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27m6 8 4 4 4-4%27/%3E%3C/svg%3E')] bg-no-repeat bg-right-2.5 bg-[length:1.5em_1.5em] pr-10"
                  aria-label="Select room"
                >
                  <option value="">Select room</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.roomName}{room.clinicName ? ` - ${room.clinicName}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate("/hr/employees")}
              className="px-6 py-2 text-gray-700 border rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              {loading ? "Creating..." : "Create Employee"}
            </button>
          </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default CreateEmployeeForm;


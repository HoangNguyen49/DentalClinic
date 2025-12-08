import axiosClient from "../../huybro_api/axiosClient";

// Interface chi tiết nhân viên
export interface Employee {
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
    specialty?: string;
    specialties?: string[];
    doctorSpecialties?: Array<{ id: number; specialtyName: string; isActive: boolean }>;
    room?: { id: number; roomName: string; clinicId?: number; clinicName?: string };
    createdAt?: string;
    updatedAt?: string;
    lastLoginAt?: string;
    hasApprovedResignation?: boolean; // Đã có đơn nghỉ việc được duyệt hay chưa
}

export interface Department {
    id: number;
    departmentName: string;
}

export interface Role {
    id: number;
    roleName: string;
}

export interface Clinic {
    id: number;
    clinicName: string;
    isActive?: boolean;
}

// Payload tạo mới nhân viên
export interface CreateEmployeeRequest {
    code: string;
    fullName: string;
    email: string;
    phone: string;
    password?: string;
    departmentId: number;
    roleId: number;
    clinicId?: number;
    specialties?: string[];
}

// Dữ liệu phân trang trả về từ backend
export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
}

const employeeService = {
    // Lấy danh sách nhân viên có phân trang và filter
    getEmployees: (params: any) => {
        return axiosClient.get<PageResponse<Employee>>('/api/hr/employees', { params });
    },

    // Thống kê nhân sự (ví dụ: tổng số lượng nhân viên)
    getEmployeeStatistics: (params: any) => {
        return axiosClient.get<{ totalEmployees?: number }>('/api/hr/employees/statistics', { params });
    },

    // Lấy thông tin chi tiết 1 nhân viên (theo id)
    getEmployee: (id: number | string) => {
        return axiosClient.get<Employee>(`/api/hr/employees/${id}`);
    },

    // Thêm mới nhân viên
    createEmployee: (data: CreateEmployeeRequest) => {
        return axiosClient.post<{ id: number }>('/api/hr/employees', data);
    },

    // Khôi phục tài khoản nhân viên (gửi kèm formData nếu cần)
    restoreEmployee: (id: number | string, data: FormData) => {
        return axiosClient.put(`/api/hr/employees/${id}/restore`, data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    // Xóa mềm nhân viên (chuyển trạng thái, cần lý do xóa)
    deleteEmployee: (id: number | string, reason: string) => {
        return axiosClient.delete(`/api/hr/employees/${id}`, {
            params: { reason },
        });
    },

    // Xóa vĩnh viễn nhân viên (chỉ dùng trong trường hợp đặc biệt, cần lý do xóa)
    hardDeleteEmployee: (id: number | string, reason: string) => {
        return axiosClient.delete(`/api/hr/employees/${id}/hard-delete`, {
            params: { reason },
        });
    },

    // Thay đổi trạng thái hoạt động của nhân viên (kích hoạt/ngưng hoạt động)
    toggleEmployeeStatus: (id: number | string, isActive: boolean, reason: string) => {
        return axiosClient.put<Employee>(`/api/hr/employees/${id}/toggle-status`, null, {
            params: { isActive, reason },
        });
    },

    // Lấy danh sách phòng ban
    getDepartments: () => {
        return axiosClient.get<Department[]>('/api/hr/management/departments');
    },

    // Lấy danh sách vai trò (role)
    getRoles: () => {
        return axiosClient.get<Role[]>('/api/hr/management/roles');
    },

    // Lấy danh sách clinic
    getClinics: () => {
        return axiosClient.get<Clinic[]>('/api/hr/management/clinics');
    },
};

export default employeeService;

import axiosClient from "../../huybro_api/axiosClient"

// Type cho response phân trang từ Spring Boot
export interface PageResponse<T> {
  content: T[]
  totalPages: number
  totalElements: number
  size: number
  number: number
  first: boolean
  last: boolean
}

// Các interface định nghĩa kiểu dữ liệu cho admin
export interface AdminStaff {
  id: number
  code?: string
  fullName: string
  username?: string
  email?: string
  phone?: string
  active: boolean
  departmentName?: string | null
  roles: string[]
  clinics: string[]
  createdAt?: string
  lastLoginAt?: string
  avatarUrl?: string | null
  hasApprovedResignation?: boolean
}

export interface AdminCustomer {
  id: number
  patientCode?: string
  fullName: string
  gender?: string
  dateOfBirth?: string
  phone?: string
  email?: string
  address?: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
  userId?: number
}

export interface AdminClinic {
  id: number
  clinicCode?: string
  clinicName: string
  address?: string
  phone?: string
  email?: string
  openingHours?: string
  active: boolean
  createdAt?: string
  updatedAt?: string
}

export interface AttendanceResponse {
  id: number
  userId: number
  userName: string
  userAvatarUrl?: string
  clinicId: number
  clinicName?: string
  workDate: string
  checkInTime?: string | null
  checkOutTime?: string | null
  attendanceStatus?: string | null
  note?: string | null
}

export interface AppointmentResponse {
  id: number
  patientId: number
  patientName: string
  doctorId: number
  doctorName: string
  clinicId: number
  clinicName: string
  roomId?: number
  roomName?: string
  startDateTime: string
  endDateTime: string
  status: string
  type: string
  notes?: string
}

// Service quản lý các API cho phía admin
export const adminApi = {
  // Nhân sự (Staff)
  staff: {
    getAll: async (params?: { search?: string; page?: number; size?: number }) => {
      const response = await axiosClient.get<PageResponse<AdminStaff>>("/api/admin/staff", {
        params,
      })
      return { data: response.data }
    },
    getCvData: async (id: number | string) => {
      const response = await axiosClient.get<{
        id: number
        userId: number
        originalFileName: string
        fileType: string
        fileSize: number
        cvFileUrl: string
        extractedText: string
        extractedImages: string[]
        createdAt: string
        updatedAt: string
      }>(`/api/admin/staff/${id}/cv`)
      return { data: response.data }
    }
  },
  // Khách hàng (Customer)
  customers: {
    getAll: async (params?: { search?: string; page?: number; size?: number }) => {
      const response = await axiosClient.get<PageResponse<AdminCustomer>>("/api/admin/customers", {
        params,
      })
      return { data: response.data }
    },
    getById: async (id: number) => {
      const response = await axiosClient.get<AdminCustomer>(`/api/admin/customers/${id}`)
      return { data: response.data }
    },
    toggleStatus: async (id: number, isActive: boolean) => {
      const response = await axiosClient.patch(`/api/admin/customers/${id}/status`, { isActive })
      return { data: response.data }
    }
  },
  // Quản lý phòng khám (Clinic)
  clinics: {
    getAll: async () => {
      const response = await axiosClient.get<AdminClinic[]>("/api/admin/clinics")
      return { data: response.data }
    },
    // Bật/tắt trạng thái phòng khám
    updateActivation: async (id: number, active: boolean) => {
      const response = await axiosClient.patch(`/api/admin/clinics/${id}/activation`, { active })
      return { data: response.data }
    },
    // Cập nhật thông tin phòng khám
    update: async (id: number, data: {
      clinicCode: string
      clinicName: string
      address?: string
      phone?: string
      email?: string
      openingHours?: string
    }) => {
      const response = await axiosClient.put<AdminClinic>(`/api/admin/clinics/${id}`, data)
      return { data: response.data }
    }
  },
  // Chấm công
  attendance: {
    getAll: async (params: {
      date?: string
      clinicId?: number
      status?: string
    }) => {
      const response = await axiosClient.get<AttendanceResponse[]>("/api/admin/attendance", {
        params,
      })
      return { data: response.data }
    }
  },
  // Thống kê dashboard dành cho admin
  dashboard: {
    getStats: async () => {
      const response = await axiosClient.get("/api/admin/dashboard/stats")
      return { data: response.data }
    }
  },
  // Quản lý kho (Inventory)
  inventory: {
    getStatistics: async () => {
      const response = await axiosClient.get<any>("/api/admin/inventory/statistics")
      return { data: response.data }
    }
  },
  // Quản lý đơn xin nghỉ phép
  leaveRequests: {
    getAll: async (params: { page?: number; size?: number; status?: string }) => {
      const response = await axiosClient.get<any>("/api/hr/leave-requests", { params })
      return { data: response.data }
    },
    getPending: async () => {
      const response = await axiosClient.get<any[]>("/api/hr/leave-requests/pending")
      return { data: response.data }
    },
    // Lấy danh sách đơn chờ duyệt của admin
    getPendingAdmin: async () => {
      const response = await axiosClient.get<any[]>("/api/hr/leave-requests/pending-admin")
      return { data: response.data }
    },
    getCounts: async () => {
      const response = await axiosClient.get<Record<string, number>>("/api/hr/leave-requests/counts")
      return { data: response.data }
    },
    // Duyệt hoặc từ chối đơn xin nghỉ phép
    process: async (leaveRequestId: number, action: "APPROVE" | "REJECT", comment?: string) => {
      const response = await axiosClient.put("/api/hr/leave-requests/process", {
        leaveRequestId,
        action,
        comment: comment || undefined,
      })
      return { data: response.data }
    }
  }
}

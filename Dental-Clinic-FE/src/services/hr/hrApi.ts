import axiosClient from "../../huybro_api/axiosClient"

// ========== Types ==========
export interface HrEmployee {
  id: number
  code: string
  fullName: string
  email: string
  phone: string
  username: string
  avatarUrl?: string
  isActive: boolean
  department?: { id: number; departmentName: string }
  role?: { id: number; roleName: string }
  clinic?: { id: number; clinicName: string }
  roleAtClinic?: string
  specialty?: string
  specialties?: string[]
  doctorSpecialties?: Array<{ id: number; specialtyName: string; isActive: boolean }>
  room?: { id: number; roomName: string; clinicId?: number; clinicName?: string }
  createdAt?: string
  updatedAt?: string
  lastLoginAt?: string
  hasApprovedResignation?: boolean
}

export interface Department {
  id: number
  departmentName: string
}

export interface Role {
  id: number
  roleName: string
}

export interface HrClinic {
  id: number
  clinicName: string
  isActive?: boolean
}

export interface CreateEmployeeRequest {
  code: string
  fullName: string
  email: string
  phone: string
  password?: string
  departmentId: number
  roleId: number
  clinicId?: number
  specialties?: string[]
}

export interface HrLeaveRequest {
  id: number
  userId: number
  userName: string
  userFullName?: string
  clinicId: number
  clinicName?: string
  startDate: string
  endDate: string
  type: string
  status: string
  reason: string
  shiftType?: string
  approvedBy?: number
  approvedByName?: string
  createdAt: string
  updatedAt: string
  leaveBalance?: number // Số ngày nghỉ trong tháng hiện tại
  annualLeaveTotal?: number // Tổng số phép năm (12 ngày)
  annualLeaveUsed?: number // Đã dùng bao nhiêu ngày trong năm
  annualLeaveRemaining?: number // Còn lại bao nhiêu ngày
  replacementAvailable?: boolean
  potentialReplacements?: string[]
  userRole?: string
}

export interface CreateScheduleRequest {
  weekStart: string
  dailyAssignments: {
    [key: string]: Array<{
      doctorId: number
      clinicId: number
      roomId: number
      chairId: number
      startTime: string
      endTime: string
      note?: string
    }>
  }
  note?: string
}

export interface ScheduleItem {
  id: number
  doctor: any
  clinic: any
  room: any
  chair: any
  workDate: string
  startTime: string
  endTime: string
  status: string
  note?: string
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first?: boolean
  last?: boolean
}

// ========== HR API Service ==========
export const hrApi = {
  // Nhân viên (Employees)
  employees: {
    getAll: async (params?: {
      page?: number
      size?: number
      search?: string
      clinicId?: number
      departmentId?: number
      roleId?: number
      isActive?: boolean
    }) => {
      const response = await axiosClient.get<PageResponse<HrEmployee>>("/api/hr/employees", { params })
      return { data: response.data }
    },
    getById: async (id: number | string) => {
      const response = await axiosClient.get<HrEmployee>(`/api/hr/employees/${id}`)
      return { data: response.data }
    },
    create: async (data: CreateEmployeeRequest) => {
      const response = await axiosClient.post<HrEmployee>("/api/hr/employees", data)
      return { data: response.data }
    },
    previewCode: async () => {
      const response = await axiosClient.get<{ code: string }>("/api/hr/employees/preview-code")
      return { data: response.data }
    },
    restore: async (id: number | string, formData: FormData) => {
      const response = await axiosClient.put(`/api/hr/employees/${id}/restore`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      return { data: response.data }
    },
    delete: async (id: number | string, reason: string) => {
      const response = await axiosClient.delete(`/api/hr/employees/${id}`, {
        params: { reason },
      })
      return { data: response.data }
    },
    hardDelete: async (id: number | string, reason: string) => {
      const response = await axiosClient.delete(`/api/hr/employees/${id}/hard-delete`, {
        params: { reason },
      })
      return { data: response.data }
    },
    uploadCv: async (id: number | string, file: File) => {
      const formData = new FormData()
      formData.append("file", file)
      const response = await axiosClient.post<{
        id: number
        userId: number
        originalFileName: string
        fileType: string
        fileSize: number
        cvFileUrl: string
        extractedText: string
        extractedImages: string[]
        message: string
      }>(`/api/hr/employees/${id}/upload-cv`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
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
      }>(`/api/hr/employees/${id}/cv`)
      return { data: response.data }
    },
    updateCvText: async (id: number | string, extractedText: string) => {
      const response = await axiosClient.put<{
        id: number
        userId: number
        extractedText: string
        message: string
      }>(`/api/hr/employees/${id}/cv/text`, { extractedText })
      return { data: response.data }
    },
    deleteCvData: async (id: number | string) => {
      const response = await axiosClient.delete<{ message: string }>(`/api/hr/employees/${id}/cv`)
      return { data: response.data }
    },
    toggleStatus: async (id: number | string, isActive: boolean, reason: string) => {
      const response = await axiosClient.put<HrEmployee>(
        `/api/hr/employees/${id}/toggle-status`,
        null,
        {
          params: { isActive, reason },
        }
      )
      return { data: response.data }
    },
    getStatistics: async (params?: { clinicId?: number; departmentId?: number }) => {
      const response = await axiosClient.get<{ totalEmployees?: number }>("/api/hr/employees/statistics", {
        params,
      })
      return { data: response.data }
    },
  },

  // Đơn xin nghỉ phép (Leave Requests)
  leaveRequests: {
    getAll: async (params?: { page?: number; size?: number; status?: string }) => {
      const response = await axiosClient.get<PageResponse<HrLeaveRequest>>("/api/hr/leave-requests", {
        params,
      })
      return { data: response.data }
    },
    getMy: async () => {
      const response = await axiosClient.get<HrLeaveRequest[]>("/api/hr/leave-requests/my")
      return { data: response.data }
    },
    getPending: async () => {
      const response = await axiosClient.get<HrLeaveRequest[]>("/api/hr/leave-requests/pending")
      return { data: response.data }
    },
    getPendingAdmin: async () => {
      const response = await axiosClient.get<HrLeaveRequest[]>("/api/hr/leave-requests/pending-admin")
      return { data: response.data }
    },
    getCounts: async () => {
      const response = await axiosClient.get<{ [key: string]: number }>("/api/hr/leave-requests/counts")
      return { data: response.data }
    },
    process: async (leaveRequestId: number, action: "APPROVE" | "REJECT", comment?: string) => {
      const response = await axiosClient.put("/api/hr/leave-requests/process", {
        leaveRequestId,
        action,
        comment,
      })
      return { data: response.data }
    },
    cancel: async (leaveRequestId: number) => {
      const response = await axiosClient.delete(`/api/hr/leave-requests/${leaveRequestId}`)
      return { data: response.data }
    },
    getApprovedInRange: async (startDate: string, endDate: string) => {
      const response = await axiosClient.get<HrLeaveRequest[]>("/api/hr/leave-requests/approved-in-range", {
        params: { startDate, endDate },
      })
      return { data: response.data }
    },
  },

  // Lịch làm việc (Schedules)
  schedules: {
    getHolidays: async () => {
      const response = await axiosClient.get<any[]>("/api/hr/management/holidays")
      return { data: response.data }
    },
    getClinics: async () => {
      const response = await axiosClient.get<HrClinic[]>("/api/hr/management/clinics")
      return { data: response.data }
    },
    getEmployees: async (params?: { size?: number; isActive?: boolean }) => {
      const response = await axiosClient.get<{ content: any[]; totalElements: number }>(
        "/api/hr/employees",
        { params }
      )
      return { data: response.data }
    },
    validate: async (request: CreateScheduleRequest) => {
      const response = await axiosClient.post<{ isValid: boolean; errors: string[] }>(
        "/api/hr/schedules/validate",
        request
      )
      return { data: response.data }
    },
    create: async (request: CreateScheduleRequest) => {
      const response = await axiosClient.post<ScheduleItem[]>("/api/hr/schedules/create", request)
      return { data: response.data }
    },
    generateAi: async (weekStart: string, description: string) => {
      const response = await axiosClient.post<CreateScheduleRequest>(
        "/api/hr/schedules/ai/generate", 
        {
          weekStart,
          description,
        },
        {
          timeout: 90000, // 90 seconds timeout for AI generation (longer than default 30s)
        }
      )
      return { data: response.data }
    },
    getByWeek: async (weekStart: string) => {
      const response = await axiosClient.get<ScheduleItem[]>(`/api/hr/schedules/${weekStart}`)
      return { data: response.data }
    },
  },

  // Quản lý (Management) - Departments, Roles, Clinics
  management: {
    getDepartments: async () => {
      const response = await axiosClient.get<Department[]>("/api/hr/management/departments")
      return { data: response.data }
    },
    getRoles: async () => {
      const response = await axiosClient.get<Role[]>("/api/hr/management/roles")
      return { data: response.data }
    },
    getClinics: async () => {
      const response = await axiosClient.get<HrClinic[]>("/api/hr/management/clinics")
      return { data: response.data }
    },
  },
}


import axiosClient from "../../huybro_api/axiosClient";

export interface SystemConfig {
    id: number;
    configKey: string;
    configValue: string;
    description?: string;
}

export interface Holiday {
    id: number;
    date: string;
    name: string;
    isRecurring: boolean;
    duration: number;
    clinicId?: number; // clinicId = null = áp dụng cho tất cả phòng khám
}

export interface AuditLog {
    id: number;
    user: {
        id: number;
        username: string;
        fullName: string;
    };
    action: string;
    tableName: string;
    recordId: number;
    title: string;
    message: string;
    ipAddr: string;
    userAgent: string;
    createdAt: string;
}

export const systemService = {
    // Lấy toàn bộ config hệ thống
    getAllConfigs: async (): Promise<SystemConfig[]> => {
        const response = await axiosClient.get<SystemConfig[]>("/api/admin/system/configs");
        return response.data;
    },

    // Cập nhật config hệ thống
    updateConfig: async (key: string, value: string, description?: string): Promise<SystemConfig> => {
        const response = await axiosClient.put<SystemConfig>("/api/admin/system/configs", { key, value, description });
        return response.data;
    },

    // Lấy danh sách phòng khám
    getAllClinics: async (): Promise<{ id: number; clinicName: string }[]> => {
        const response = await axiosClient.get<{ id: number; clinicName: string }[]>("/api/admin/clinics");
        return response.data;
    },

    // Lấy toàn bộ ngày nghỉ
    getAllHolidays: async (): Promise<Holiday[]> => {
        const response = await axiosClient.get<Holiday[]>("/api/admin/system/holidays");
        return response.data;
    },

    // Thêm ngày nghỉ mới
    addHoliday: async (date: string, name: string, isRecurring: boolean, duration: number, clinicId: number | null): Promise<Holiday> => {
        const response = await axiosClient.post<Holiday>("/api/admin/system/holidays", { date, name, isRecurring, duration, clinicId });
        return response.data;
    },

    // Xóa ngày nghỉ
    deleteHoliday: async (id: number): Promise<void> => {
        await axiosClient.delete(`/api/admin/system/holidays/${id}`);
    },

    // Lấy danh sách audit logs (log thao tác)
    getAuditLogs: async (params: {
        userId?: number;
        action?: string;
        tableName?: string;
        fromDate?: string;
        toDate?: string;
        page?: number;
        size?: number;
    }): Promise<{ content: AuditLog[]; totalElements: number; totalPages: number }> => {
        const response = await axiosClient.get<{ content: AuditLog[]; totalElements: number; totalPages: number }>("/api/admin/system/audit-logs", { params });
        return response.data;
    },
};

import axiosClient from '../../huybro_api/axiosClient';

// Thông tin yêu cầu nghỉ phép
export interface LeaveRequest {
    id: number;
    userId: number;
    userName: string;
    userFullName?: string;
    clinicId: number;
    clinicName?: string;
    startDate: string;
    endDate: string;
    type: string;
    status: string;
    reason: string;
    shiftType?: string;
    approvedBy?: number;
    approvedByName?: string;
    createdAt: string;
    updatedAt: string;
    leaveBalance?: number;
    replacementAvailable?: boolean;
    potentialReplacements?: string[];
    userRole?: string;
}

// Kết quả phân trang chung
export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

const leaveRequestService = {
    // Lấy danh sách yêu cầu nghỉ phép (có phân trang)
    getLeaveRequests: (page = 0, size = 10, status?: string) => {
        const params: any = { page, size };
        if (status) params.status = status;
        return axiosClient.get<PageResponse<LeaveRequest>>('/api/hr/leave-requests', { params });
    },

    // Lấy các yêu cầu chờ xử lý (của user hiện tại)
    getPendingRequests: () => {
        return axiosClient.get<LeaveRequest[]>('/api/hr/leave-requests/pending');
    },

    // Lấy yêu cầu chờ xử lý ở cấp admin/phòng khám
    getPendingAdminRequests: () => {
        return axiosClient.get<LeaveRequest[]>('/api/hr/leave-requests/pending-admin');
    },

    // Lấy tổng số lượng yêu cầu ở các trạng thái
    getCounts: () => {
        return axiosClient.get<{ [key: string]: number }>('/api/hr/leave-requests/counts');
    },

    // Duyệt hoặc từ chối yêu cầu nghỉ phép
    processLeaveRequest: (leaveRequestId: number, action: "APPROVE" | "REJECT", comment?: string) => {
        return axiosClient.put('/api/hr/leave-requests/process', {
            leaveRequestId,
            action,
            comment
        });
    },

    // Lấy các yêu cầu nghỉ phép đã được duyệt trong khoảng ngày
    getApprovedLeaveRequestsInRange: (startDate: string, endDate: string) => {
        return axiosClient.get<any[]>('/api/hr/leave-requests/approved-in-range', {
            params: { startDate, endDate }
        });
    }
};

export default leaveRequestService;

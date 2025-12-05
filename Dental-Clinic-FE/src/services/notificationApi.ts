import axiosClient from '../huybro_api/axiosClient';

// Thông tin notification trả về từ backend
export interface NotificationResponse {
    notificationId: number;
    userId: number;
    type: string;
    priority: string;
    title: string;
    message: string;
    isRead: boolean;
    readAt?: string;
    actionUrl?: string;
    relatedEntityType?: string;
    relatedEntityId?: number;
    createdAt: string;
    expiresAt?: string;
}

// Thống kê các loại notification
export interface NotificationStatistics {
    totalNotifications: number;
    unreadCount: number;
    readCount: number;
    highPriorityCount: number;
    mediumPriorityCount: number;
    lowPriorityCount: number;
    expiredCount: number;
    todayCount: number;
    thisWeekCount: number;
    thisMonthCount: number;
}

const notificationApi = {
    // Lấy danh sách notification (phân trang)
    getNotifications: (page = 0, size = 10, includeExpired = false) => {
        return axiosClient.get<{ content: NotificationResponse[]; totalElements: number; totalPages: number }>(
            '/api/notifications',
            { params: { page, size, includeExpired } }
        );
    },

    // Lấy các notification chưa đọc
    getUnreadNotifications: () => {
        return axiosClient.get<NotificationResponse[]>('/api/notifications/unread');
    },

    // Đánh dấu 1 notification đã đọc
    markAsRead: (id: number) => {
        return axiosClient.put<NotificationResponse>(`/api/notifications/${id}/read`);
    },

    // Đánh dấu tất cả đã đọc
    markAllAsRead: () => {
        return axiosClient.put<void>('/api/notifications/read-all');
    },

    // Đếm số notification chưa đọc
    countUnread: () => {
        return axiosClient.get<number>('/api/notifications/unread-count');
    },

    // Lấy thống kê notification
    getStatistics: () => {
        return axiosClient.get<NotificationStatistics>('/api/notifications/statistics');
    },

    // Đăng ký device nhận thông báo push
    registerDevice: (token: string, deviceType = 'WEB') => {
        return axiosClient.post('/api/notifications/device', null, {
            params: { token, deviceType },
        });
    },
};

export default notificationApi;
